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
	const count: Number =
		req.query["count"] != undefined ? Number(req.query["count"]) : 20; //Default to 20 if no count is given
	db.query(
		"SELECT f.*, u.username FROM Favour f JOIN User u ON f.user_id = u._id LIMIT ?",
		[count],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			res.send(result); //Send back list of object returned by SQL query
		}
	);
});

//Post request to submit a favour
//TODO: Determine valid user once login system works
router.post("/favours", (req: Request, res: Response) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}
	//check if user is valid
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

	db.query(
		sqlQuery,
		[
			"fvr_" + uuid(),
			req.session!.user_id, //Replace with session id when sessions is ready
			req.body["title"],
			req.body["location"],
			req.body["description"],
			req.body["favour_coins"],
			type,
		],
		function (err, result) {
			if (err) console.log(err), res.send("error");
			res.send("OK"); // Send back OK if successfully inserted
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
					console.log(req.session);
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
		"SELECT u.username, u._id, u.email_addr, u.favour_counter, f.title FROM User u LEFT JOIN Favour f ON u._id = f.user_id WHERE u.username = ?",
		[username],
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
