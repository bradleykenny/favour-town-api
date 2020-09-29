const io = require("socket.io-client"),
	ioClient = io.connect("http://localhost:5000");

ioClient.on("connect", function () {
	console.log("hi");
});

ioClient.on("ACK", function (msg) {
	console.log(msg);
});
