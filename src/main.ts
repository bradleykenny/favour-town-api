import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import mysql, { Connection } from "mysql";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";

const favourTypeEnum = {
	REQUEST: 0,
	OFFER: 1,
};

const app: Application = express();

app.use(
	session({
		secret: uuid(),
		saveUninitialized: false,
		resave: false,
		cookie: {
			//secure:true,
			maxAge: 60000,
		},
	})
);
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
		if (err) throw err;
		res.send(result); //Send back list of object returned by SQL query
	});
});
//Post request to submit a favour
//TODO: Determine valid user once login system works
app.post("/favours", (req: Request, res: Response, next: NextFunction) => {
	if (!req.session!.user_id) {
		res.send("Not logged in!");
		console.log("Invalid session with session data:", req.session);
		return;
	}
	//check if user is valid
	sqlConn.query(
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

	const sqlQuery = `INSERT INTO Favour (_id, user_id, title,location,description, favour_coins) VALUES (?,?,?,?,?,?)`;

	sqlConn.query(
		sqlQuery,
		[
			"fvr_" + uuid(),
			req.session!.user_id, //Replace with session id when sessions is ready
			req.body["title"],
			req.body["location"],
			req.body["description"],
			req.body["coins"],
		],
		function (err, result) {
			if (err) console.log(err);
			res.send("OK"); // Send back OK if successfully inserted
		}
	);
});

app.post("/login", (req: Request, res: Response, next: NextFunction) => {
	//TODO: After sprint 1 add the capability to login with email as well

	const sqlQuery: string =
		"SELECT _id, username, password FROM User WHERE username=?"; //NOTE: can we compare unencrypted password to sql encrypted password?
	sqlConn.query(sqlQuery, [req.body["username"]], function (err, result) {
		if (err) throw err;
		if (result.length != 1) {
			res.send("ERROR: Login failed");
			console.log("failed login, sql return:", result);
			return;
		}

		bcrypt.compare(
			req.body["password"], // troublesom comment issue
			result[0]["password"].toString(), //SQL server returns binary string, need to convert to regular string to compare first
			function (err, correct) {
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

app.post("/register", (req: Request, res: Response, next: NextFunction) => {
	//Check user valid
	const sqlQuery: string = `INSERT INTO User (_id, username, password,email_addr, favour_counter) VALUES (?,?,?,?,?)`;
	bcrypt.hash(req.body["password"], saltRounds, function (err, hash) {
		//Need to throw error on bad hash?
		sqlConn.query(
			sqlQuery,
			["usr_" + uuid(), req.body["username"], hash, req.body["email"], 0],
			function (err, result) {
				if (err) {
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
							res.send(err.sqlMessage); // Just send sql error message
							break;
					}
					return;
				}
				console.log(result);
				//TODO: Send back username/email already exists error if it exists. Check if SQL will send back this response once _id, username and email has been made unique
				res.send("OK"); // Send back OK if successfully registered
			}
		);
	});
});

app.listen(5000, () => console.log("Server running"));
