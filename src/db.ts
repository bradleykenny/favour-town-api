import mysql, { Connection } from "mysql";
import dotenv from "dotenv";
dotenv.config();
var sqlConn: Connection = mysql.createConnection({
	host: process.env.FT_HOST,
	user: process.env.FT_USER,
	password: process.env.FT_PASSWORD,
	database: process.env.FT_DB,
	multipleStatements: true,
});

sqlConn.connect(function (err) {
	if (err) throw err;
});

module.exports.db = sqlConn;
