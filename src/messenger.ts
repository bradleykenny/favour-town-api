import socketIO from "socket.io";
import { Connection } from "mysql";
var connectedClients: any = {};

var db: Connection = require("./db").db;

//TODO: Work out: messages via sockets or messages via
module.exports = function (client: socketIO.Socket) {
	if (client.handshake.session!.user_id) {
		connectedClients[client.handshake.session!.user_id] = client;
		//Define all socket.io events here
		client.on("send", (data) => {
			//Should send the reciever and the message itself
			if (connectedClients.hasOwnProperty(data["reciever"])) {
				connectedClients[data["reciever"]].emit("incoming", {
					sender: client.handshake.session!.user_id,
					message: data["message"],
				});
			}
			db.query(
				"INSERT INTO Messages (sender_id,reciever_id, content,date) VALUES (?,?,?,NOW())", //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
				[
					client.handshake.session!.user_id,
					data["reciever"],
					data["message"],
				],
				function (err, result) {
					if (err) console.log(err);
					else client.emit("ACK", "got msg for " + data["reciever"]);
				}
			);
			//Store message in db
		});

		client.on("recieve", (data) => {
			//Client sends the number of messages loaded, and the user id they want to recieve messages from
			db.query(
				"SELECT content FROM Messages WHERE user_id=? ORDER BY date LIMIT ?,10", //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
				[data["sender"], data["loaded"]],
				function (err, result) {
					if (err) throw err;
					client.send(result);
				}
			);
		});

		client.on("disconnect", () => {
			console.log("disconnected");
			delete connectedClients[client.handshake.session!.user_id];
		});
	} else {
		client.emit("ACK", "not logged in");
	}
};
