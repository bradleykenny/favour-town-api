import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import mysql, { Connection } from "mysql";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";

const app: Application = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
dotenv.config();
var sqlConn: Connection = mysql.createConnection({
	host: process.env.FT_HOST,
	user: process.env.FT_USER,
	password: process.env.FT_PASSWORD,
	database: process.env.FT_DB,
});

sqlConn.connect();
var favours: Array<object> = [];
//Return number of favours requested by users, specified by count
app.get("/favours", (req: Request, res: Response, next: NextFunction) => {
    const count:Number = (req.query["count"]!=undefined ? Number(req.query["count"]):20);//Default to 20 if no count is given
    sqlConn.query("SELECT * FROM Favour LIMIT ?",[count],function(err, result){ 
        if (err) throw err;
        res.send(result); //Send back list of object returned by SQL query
    })
});
//Post request to submit a favour
//TODO: Determine valid user once login system works
app.post("/favours", (req: Request, res: Response, next: NextFunction) => { 
    //TODO: Check user valid
    const sqlQuery = `INSERT INTO Favour (_id, user_id, title,location,description, favour_coins) VALUES (?,?,?,?,?,?)`;
    
    sqlConn.query(sqlQuery,
        ["fvr_" + uuid(),
        req.body["user_id"], //Replace with req.body["user_id"] when login is ready
        req.body["title"],
        req.body["location"],
        req.body["description"],
        req.body["coins"]], function (err, result) {
        if (err) throw err;
        res.send("OK"); // Send back OK if successfully inserted
    });
});

app.post("/login", (req: Request, res: Response, next: NextFunction) => { 
    //TODO: After sprint 1 add the capability to login with email as well
    const sqlQuery:string = "SELECT _id, username, password FROM User WHERE username=? AND password=?"; //NOTE: can we compare unencrypted password to sql encrypted password?
    sqlConn.query(sqlQuery,
        [req.body["username"],req.body["password"]], function (err, result) {
        if (err) throw err;
        if(result.length!=1){
            res.send("FAILED");
            console.log("failed login, sql return:",result);
            return;
        }
        console.log("login:",req.body);
        res.send(result[0]["_id"]); // Send back OK if successfully inserted
    });
});


app.post("/register", (req: Request, res: Response, next: NextFunction) => { 
    //Check user valid
    const sqlQuery:string = `INSERT INTO User (_id, username, password,email_addr, favour_counter) VALUES (?,?,?,?,?)`;
    
    sqlConn.query(sqlQuery,
        ["usr_" + uuid(),
        req.body["username"],
        req.body["password"],
        req.body["email"],
        0
        ], function (err, result) {
        if (err) throw err;
        res.send("OK"); // Send back OK if successfully registered
    });
});


app.listen(5000, () => console.log("Server running"));
