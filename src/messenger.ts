import socketIO from "socket.io";
import { Connection } from "mysql";
var connectedClients: any = {};

var db: Connection = require("./db").db;

//TODO: Work out: messages via sockets or messages via
module.exports = function (client: socketIO.Socket) {
	if (client.handshake.session!.user_id) {
		connectedClients[client.handshake.session!.user_id] = client;
		db.query(
			`SELECT friends.* FROM (SELECT u.username,msg.* FROM User u JOIN (SELECT m.* FROM Messages m WHERE m.receiver_id=? ORDER BY m.date) AS msg ON u._id=msg.sender_id 
			UNION 
			SELECT u.username,msg.* FROM User u JOIN (SELECT m.* FROM Messages m WHERE m.sender_id=? ORDER BY m.date) AS msg ON u._id=msg.receiver_id ORDER BY date DESC) AS friends GROUP BY username
			`, //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
			[
				client.handshake.session!.user_id,
				client.handshake.session!.user_id
			],
			function (err, result) {
				if (err) console.log(err);
				client.emit("friendslist",result);
			}
		);

		//Define all socket.io events here
		client.on("send", (data) => {
			//Should send the receive and the message itself
			if (connectedClients.hasOwnProperty(data["receiver"])) {
				connectedClients[data["receiver"]].emit("incoming", [
					{
						sender_id: client.handshake.session!.user_id,
						content: data["message"],
					},
				]);
			}
			db.query(
				"INSERT INTO Messages (sender_id,receiver_id, content,date) VALUES (?,?,?,NOW())", //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
				[
					client.handshake.session!.user_id,
					data["receiver"],
					data["message"],
				],
				function (err, result) {
					if (err) console.log(err);
					else client.emit("ACK", "got msg for " + data["receiver"]);
				}
			);
			//Store message in db
		});

		client.on("receive", (data) => {
			//Client sends the number of messages loaded, and the user id they want to receive messages from
			db.query(
				"SELECT sender_id,content,date FROM Messages WHERE sender_id=? ORDER BY date LIMIT ?,10", //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
				[data["sender"], data["loaded"]],
				function (err, result) {
					if (err) throw err;
					client.emit("incoming", result);
				}
			);
		});

		client.on("disconnect", () => {
			console.log("disconnected");
			delete connectedClients[client.handshake.session!.user_id];
		});
	} else {
		client.emit("NotLoggedIn", "not logged in");
	}
};
