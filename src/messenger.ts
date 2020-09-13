import socketIO from "socket.io";
import { Connection } from "mysql";

var db: Connection = require("./db").db;
module.exports = function (client: socketIO.Socket) {
	//Define all socket.io events here
	client.on("event", (data) => {
		/* … */
	});
	client.on("disconnect", () => {
		/* … */
	});
};
