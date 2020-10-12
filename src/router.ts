var router = require("express").Router();
import { Connection } from "mysql";
import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
var db: Connection = require("./db").db;

const favourTypeEnum = {
	REQUEST: 0,
	OFFER: 1,
};
const saltRounds = 10;

//Return number of favours requested by users, specified by count
router.get("/favours", (req: Request, res: Response) => {
	var query: string =
		"SELECT f.*, u.username, GROUP_CONCAT(fc.category) AS categories FROM Favour f JOIN User u ON f.user_id = u._id LEFT JOIN Favour_Categories fc ON f._id=fc._id";
	var where_strings: string[] = [];
	var placeholder_vars: any = [];
	if (req.query["location"]) {
		where_strings.push("f.location=?");
		placeholder_vars.push(req.query["location"]);
	}
	if (req.query["categories"]) {
		//Expected for categories to be sent in csv format
		where_strings.push("fc.category IN (?)");
		placeholder_vars.push(req.query["category"]);
	}

	if (where_strings.length > 0) {
		query += " WHERE " + where_strings.join(" AND ");
	}

	const page: number = req.query["page"] ? Number(req.query["page"]) - 1 : 0; //Default to 0 if no page number is given

	const count: number = req.query["count"] ? Number(req.query["count"]) : 20; //Default to 20 if no count is given
	query += " GROUP BY f._id ORDER BY date DESC LIMIT ?,?";
	db.query(query, placeholder_vars.concat([page * count, count]), function (
		err,
		result
	) {
		if (err) console.log(err), res.send("error");
		res.send(result); //Send back list of object returned by SQL query
	});
});

//Return information on particular Favour given the ID
router.get("/favours/:id", (req: Request, res: Response) => {
	var query: string =
		"SELECT f.*,u.username FROM Favour f JOIN User u ON f.user_id=u._id WHERE f._id=?";
	db.query(query, req.params.id, function (err, result) {
		if (err) console.log(err), res.send("error");
		res.send(result); //Send back list of object returned by SQL query
	});
});

//Post request to submit a favour
router.post("/favours", (req: Request, res: Response) => {
	//check if user is valid
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}

	db.query(
		"SELECT _id FROM User WHERE _id=?",
		[req.session!.user_id],
		function (err, result) {
			if (err) console.log(err);
			console.log(result);
			if (result.length != 1) {
				//Check there is 1 and only 1 entry for user_id
				res.send("ERROR: Login failed");
				console.log("failed login, sql return:", result);
				return;
			}
		}
	);

	const favour = JSON.parse(req.body["payload"]);
	const sqlQuery = `INSERT INTO Favour (_id, user_id, title, location, description, favour_coins, favour_type, date) VALUES (?,?,?,?,?,?,?,NOW())`;
	const type: number = (function (typeString) {
		switch (typeString) {
			case "request":
				return favourTypeEnum.REQUEST;
			case "offer":
				return favourTypeEnum.OFFER;
			default:
				return favourTypeEnum.REQUEST;
		}
	})(req.body["type"]);
	const favour_id = "fvr_" + uuid();

	db.query(
		sqlQuery,
		[
			favour_id,
			req.session!.user_id, //Replace with session id when sessions is ready
			req.body["title"],
			req.body["location"],
			req.body["description"],
			req.body["favour_coins"],
			type,
		],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			if (req.body["categories"]) {
				JSON.parse(req.body["categories"]).forEach(
					//Expects category field to be in JSON format (list of strings)
					(category: string) => {
						db.query(
							"INSERT INTO Favour_Categories (_id,category) VALUES (?,?)",
							[favour_id, category],
							function (err, result) {
								if (err) console.log(err), res.send("error");
							}
						);
					}
				);
			}
			res.send("OK"); // Send back OK if successfully inserted
		}
	);
});
// Post a rating on a user.
//Expects user_id (id of user being critiqued) and rating (score of rating)
router.post("/rating", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}
	db.query(
		`INSERT INTO User_Ratings (user_id, critic_id,rating) VALUES (?,?,?)`,
		[req.body["user_id"], req.session!.user_id, req.body["rating"]],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			else console.log(result), res.send("OK");
		}
	);
});

// Fetches a single value corresponding to the average rating of the user id
// Expects user_id in url
router.get("/rating/:user_id", (req: Request, res: Response) => {
	db.query(
		//TODO: This query is bad and will double up, and does not check if the user has already rated this user. Need to work out a better solution
		`SELECT AVG(rating) as rating FROM User_Ratings WHERE user_id=?`,
		[req.params.user_id],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			else res.send(result);
		}
	);
});

// List all requests available for a specific favour owned by the logged in user
// Expects favour_id (id of favour to fetch requests for)
router.post("/favours/request/list", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}
	db.query(
		"SELECT f._id,f.user_id FROM Favour f WHERE f._id=? AND f.user_id=?",
		[req.body["favour_id"], req.session!.user_id],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			if (result.length == 0) {
				res.send("invalid favour id");
				console.log(
					req.session!.user_id,
					"attempted to send request for invalid favour",
					req.body["favour_id"],
					"either favour/user doesn't exist, or user does not own favour"
				);
			} else {
				db.query(
					`SELECT fr.*,u.username, u.f_name,u.l_name FROM Favour_Requests fr JOIN User u ON u._id=fr.user_id WHERE favour_id=?`,
					[req.body["favour_id"]],
					function (err, result) {
						if (err) console.log(err), res.send("error");
						else res.send(result);
					}
				);
			}
		}
	);
});

// Send request to get a specific favour
// Expects favour_id (id of favour to send a request for)
router.post("/favours/request/send", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}
	db.query(
		"SELECT _id FROM Favour WHERE _id=? AND favour_status=0",
		[req.body["favour_id"]],
		function (err, result) {
			if (err) {
				console.log(err);
				if (err.code == "ER_DUP_ENTRY") {
					res.send("duplicate");
				} else {
					res.send("error");
				}
			} else if (result.length == 0) {
				res.send("invalid favour id");
				console.log(
					req.session!.user_id,
					"attempted to send request for invalid favour",
					req.body["favour_id"]
				);
			} else {
				console.log(
					req.session!.user_id,
					"sent a request for favour",
					req.body["favour_id"]
				);
				db.query(
					`INSERT INTO Favour_Requests (favour_id, user_id) VALUES (?,?)`,
					[req.body["favour_id"], req.session!.user_id],
					function (err, result) {
						if (err) console.log(err), res.send("error");
						else res.send("OK");
					}
				);
			}
		}
	);
});

// User is able to accept Favour request
// Expects requestor (id of user whose request is being accepted) and favour_id (id of favour to accept request for)
router.post("/favours/request/accept", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}
	db.query(
		"UPDATE Favour SET favour_status=1,assigned_user_id=? WHERE _id=? AND favour_status=0 AND user_id=? AND EXISTS(SELECT r.user_id FROM Favour_Requests r WHERE r.favour_id=? AND r.user_id=?);",
		[
			req.body["requestor"],
			req.body["favour_id"],
			req.session!.user_id,
			req.body["favour_id"],
			req.body["requestor"],
		],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			else if (result["affectedRows"] == 0) {
				res.send("invalid user ids or favour id");
				console.log(
					req.session!.user_id,
					"attempted to send request for invalid favour",
					req.body["favour_id"],
					"or get request for invalid user",
					req.body["requestor"]
				);
			} else {
				db.query(
					"DELETE FROM Favour_Requests WHERE favour_id=?", //Delete other requests
					[req.body["favour_id"]],
					function (err, result) {
						console.log(result);
						if (err) console.log(err), res.send("error");
						res.send("OK");
					}
				);
			}
		}
	);
});

router.post("/favours/request/reject", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}

	db.query(
		"DELETE FROM Favour_Requests fr WHERE fr.favour_id=? AND fr.user_id=? EXISTS(SELECT f.user_id FROM Favour f WHERE f.favour_id=? AND f.user_id=?)", //Delete other requests
		[
			req.body["favour_id"],
			req.body["requestor"],
			req.body["favour_id"],
			req.session!.user_id,
		],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			else if (result["affectedRows"] == 0) {
				res.send("invalid user ids or favour id");
				console.log(
					req.session!.user_id,
					"attempted to send request for invalid favour",
					req.body["favour_id"],
					"or get request for invalid user",
					req.body["requestor"]
				);
			} else {
				res.send("OK");
			}
		}
	);
});

router.post("/login", (req: Request, res: Response) => {
	//TODO: After sprint 1 add the capability to login with email as well
	const sqlQuery: string =
		"SELECT _id, username, password FROM User WHERE username=?";
	db.query(sqlQuery, [req.body["username"]], function (err, result) {
		if (err) console.log(err), res.send("error");
		if (result.length != 1) {
			res.send("ERROR: Login failed");
			console.log("failed login, sql return:", result);
			return;
		}

		bcrypt.compare(
			req.body["password"],
			result[0]["password"].toString(), //SQL server returns binary string, need to convert to regular string to compare first
			function (err, correct) {
				if (err) console.log(err), res.send("error");
				if (correct) {
					req.session!.user_id = result[0]["_id"]; // Send back OK if successfully inserted
					req.session!.save(() => {
						console.log(req.session);
						return {
							user_id: result[0]["_id"],
						};
					});
					res.send("OK");
				} else {
					console.log(
						"Wrong password attempt:",
						result[0]["password"],
						req.body["password"]
					);
					res.send("ERROR: Login failed");
				}
			}
		);
	});
});

router.post("/register", (req: Request, res: Response, next: NextFunction) => {
	//Check user valid
	const sqlQuery: string = `INSERT INTO User (_id, f_name, l_name, username, password, email_addr, favour_counter) VALUES (?,?,?,?,?,?,?)`;
	bcrypt.hash(req.body["password"], saltRounds, function (err, hash) {
		//Need to throw error on bad hash?
		db.query(
			sqlQuery,
			[
				"usr_" + uuid(),
				req.body["f_name"],
				req.body["l_name"],
				req.body["username"],
				hash,
				req.body["email"],
				0,
			],
			function (err, result) {
				if (err) {
					console.log(err);
					switch (err.code) {
						case "ER_DUP_ENTRY":
							const msg: any = err.sqlMessage;
							if (msg.endsWith("'username'")) {
								res.send("ERROR: Username already taken");
							} else if (msg.endsWith("'email_addr_UNIQUE'")) {
								//'email_addr_UNIQUE'	'email_addr'
								res.send(
									"ERROR: Account with email already exists"
								);
							} else {
								res.send("ERROR: Unknown Login Error");
							}
							break;
						default:
							res.send("error"); // Just send sql error message
							break;
					}
					return;
				}
				console.log(result);
				//Send back username/email already exists error if it exists. Check if SQL will send back this response once _id, username and email has been made unique
				res.send("OK"); // Send back OK if successfully registered
			}
		);
	});
});

//Return all the listings given username
//username, favour title, favour id, user id
router.get("/listings/:username", (req: Request, res: Response) => {
	const username = req.params.username;
	db.query(
		"SELECT f.*, u.username FROM User u INNER JOIN Favour f ON u._id = f.user_id WHERE u.username = ?",
		[username],
		function (err, result) {
			if (err) throw err;
			res.send(result); //Send back list of object returned by SQL query
		}
	);
});

//Return all profile information
//username, user._id, email_addr, favour_counter, listings,
router.get("/profile/:username", (req: Request, res: Response) => {
	const username = req.params.username;
	db.query(
		"SELECT u.username, u._id, u.email_addr, u.favour_counter, u.user_rating, u.f_name, u.l_nmame FROM User u WHERE u.username = ? OR u._id = ?",
		[username, username],
		function (err, result) {
			if (err) throw err;
			res.send(result); //Send back list of object returned by SQL query
		}
	);
});

router.post("/hassession", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("NO");
	} else {
		res.send(req.session!.user_id);
	}
});

router.post("/account/password", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		return;
	}

	const sqlQuery: string = "SELECT _id, password FROM User WHERE _id=?";
	db.query(sqlQuery, [req.session!.user_id], function (err, result) {
		if (err) console.log(err), res.send("error");
		if (result.length != 1) {
			res.send("ERROR: Login failed");
			console.log("failed login, sql return:", result);
			return;
		}

		bcrypt.compare(
			req.body["old_password"],
			result[0]["password"].toString(), //SQL server returns binary string, need to convert to regular string to compare first
			function (err, correct) {
				if (err) console.log(err), res.send("error");
				if (correct) {
					const sqlQuery: string =
						"UPDATE User SET password=? WHERE _id=?";
					bcrypt.hash(req.body["new_password"], saltRounds, function (
						err,
						hash
					) {
						//Need to throw error on bad hash?
						db.query(
							sqlQuery,
							[hash, req.session!.user_id],
							function (err, result) {
								if (err) console.log(err);
								console.log(result);
								res.send("OK"); // Send back OK if successfully registered
							}
						);
					});
				} else {
					console.log(
						"Wrong password reset attempt:",
						result[0]["password"],
						req.body["old_password"]
					);
					res.send("ERROR: Login failed");
				}
			}
		);
	});
});

module.exports = router;
