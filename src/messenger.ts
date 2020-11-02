import socketIO from "socket.io";
import { Connection } from "mysql";
var connectedClients: any = {};

var db: Connection = require("./db").db;

//TODO: Work out: messages via sockets or messages via
module.exports = function (client: socketIO.Socket) {

	if (client.handshake.session!.user_id) {
		connectedClients[client.handshake.session!.user_id] = client;
		db.query(
			`SELECT username,_id,image_link FROM User WHERE _id=?
			`, //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
			[
				client.handshake.session!.user_id,
			],
			function (err, result) {
				if (err) console.log(err);
				client.emit("yourUser_id",result[0])
			}
		);
		db.query(
			`SELECT friends.* FROM (SELECT u.username,u.image_link,msg.* FROM User u JOIN (SELECT m.* FROM Messages m WHERE m.receiver_id=? ORDER BY m.date) AS msg ON u._id=msg.sender_id 
			UNION 
			SELECT u.username,u.image_link,msg.* FROM User u JOIN (SELECT m.* FROM Messages m WHERE m.sender_id=? ORDER BY m.date) AS msg ON u._id=msg.receiver_id ORDER BY date DESC) AS friends GROUP BY username
			`, //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
			[
				client.handshake.session!.user_id,
				client.handshake.session!.user_id
			],
			function (err, result) {
				if (err) console.log(err);
				console.log(result)
				client.emit("friendslist",result);
			}
		);

		//Define all socket.io events here
		client.on("send", (data) => {
			//Should send the receive and the message itself
			if (data["reciever"] in connectedClients) {
			
				const now=new Date();
				connectedClients[data["reciever"]].emit("incoming", [
					{
						sender_id: client.handshake.session!.user_id,
						receiver_id: data["reciever"],
						username:data["author"],
						content: data["message"],
						image_link:data["avatar"],
						date:now.toISOString()
					},
				]);
			}
			db.query(
				"INSERT INTO Messages (sender_id,receiver_id, content,date) VALUES (?,?,?,NOW())", //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
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

		client.on("receive", (data) => { 
			//Client sends the number of messages loaded, and the user id they want to receive messages from
			db.query(
				"SELECT m.*,u.username,u.image_link FROM Messages m LEFT JOIN User u ON u._id=m.sender_id  WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY date", //REMEMBER TO PUT THIS IN THE MYSQL DATABASE
				[data["sender"],client.handshake.session!.user_id,client.handshake.session!.user_id,data["sender"]],
				function (err, result) {
					if (err) console.log(err);
					client.emit("incoming", result);
				}
			);
		});

		client.on("disconnect", () => {
			delete connectedClients[client.handshake.session!.user_id];
		});
	} else {
		client.emit("NotLoggedIn", "not logged in");
	}
};
