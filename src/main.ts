import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import mysql, { Connection } from "mysql";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

const favourTypeEnum = {
	REQUEST: 0,
	OFFER: 1,
};

const app: Application = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const saltRounds = 10;

dotenv.config();

var sqlConn: Connection = mysql.createConnection({
	host: process.env.FT_HOST,
	user: process.env.FT_USER,
	password: process.env.FT_PASSWORD,
	database: process.env.FT_DB,
});

//Return number of favours requested by users, specified by count
app.get("/favours", (req: Request, res: Response, next: NextFunction) => {
	const count: Number =
		req.query["count"] != undefined ? Number(req.query["count"]) : 20; //Default to 20 if no count is given
	sqlConn.query("SELECT * FROM Favour LIMIT ?", [count], function (
		err,
		result
	) {
		if (err) console.log(err), res.send("error");
		res.send(result); //Send back list of object returned by SQL query
	});
});

//Post request to submit a favour
//TODO: Determine valid user once login system works
app.post("/favours", (req: Request, res: Response, next: NextFunction) => {
	//TODO: Check user valid
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

	sqlConn.query(
		sqlQuery,
		[
			"fvr_" + uuid(),
			req.body["user_id"], //Replace with session id when sessions is ready
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

app.post("/login", (req: Request, res: Response, next: NextFunction) => {
	//TODO: After sprint 1 add the capability to login with email as well
	const sqlQuery: string =
		"SELECT _id, username, password FROM User WHERE username=?"; //NOTE: can we compare unencrypted password to sql encrypted password?
	sqlConn.query(sqlQuery, [req.body["username"]], function (err, result) {
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
					console.log("login:", req.body);
					res.send(result[0]["_id"]); // Send back OK if successfully inserted
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

app.post("/register", (req: Request, res: Response, next: NextFunction) => {
	//Check user valid
	const sqlQuery: string = `INSERT INTO User (_id, username, password, email_addr, favour_counter) VALUES (?,?,?,?,?)`;
	bcrypt.hash(req.body["password"], saltRounds, function (err, hash) {
		//Need to throw error on bad hash?
		sqlConn.query(
			sqlQuery,
			["usr_" + uuid(), req.body["username"], hash, req.body["email"], 0],
			function (err, result) {
				if (err) {
					console.log(err);
					switch (err.code) {
						case "ER_DUP_ENTRY":
							const msg: any = err.sqlMessage;
							if (msg.endsWith("'username'")) {
								res.send("ERROR: Username already taken");
							} else if (msg.endsWith("'email_addr'")) {
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
app.post("/listings", (req: Request, res: Response, next: NextFunction) => {
	const _id = req.query._id;
	sqlConn.query(
		"SELECT * FROM User WHERE _id=?",//(User.username, Favour.title) FROM (User, Favour) WHERE (User._id=?)",
		[_id],
		function (err, result) {
			if (err) throw err;
			res.send(result); //Send back list of object returned by SQL query
		}
	);
});

app.listen(5000, () => console.log("Server running"));
