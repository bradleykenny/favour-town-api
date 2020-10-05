import express, { Application } from "express";
import bodyParser from "body-parser";
import { v4 as uuid } from "uuid";
import session from "express-session";
import sharedsession from "express-socket.io-session";
import http from "http";
import socketIO from "socket.io";
var cookieParser = require("cookie-parser");

const app: Application = express();
const user_session = session({
	secret: uuid(),
	saveUninitialized: true,
	resave: false,
	cookie: {
		secure: false,
		maxAge: 60000,
	},
});
app.use(user_session);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var cors = require("cors");

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true, // Allow session cookies
	})
);

app.use(cookieParser());
var whitelist = ["http://localhost:5000"];

var corsOptions = {
	origin: function (origin: string, callback: any) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
};

app.use(require("./router"));

const server = http.createServer(app);
const io = socketIO(server);
io.use(
	sharedsession(user_session, {
		autoSave: true,
	})
);

io.on("connection", require("./messenger"));

var messengerIO = io.of("/messages");

//io ons and stuffs

server.listen(5000, () => console.log("Server running on port 5000"));
