"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var uuid_1 = require("uuid");
var app = express_1.default();
app.get('/favours', function (req, res, next) {
    var count = Number(req.query["count"]);
    var favours = [];
    for (var i = 0; i < count; i++) {
        favours.push({ "_id": "fvr_" + uuid_1.v4(), "user_id": "usr_" + uuid_1.v4(), "description": "Yo Imma do somethin for ya", "location": "Favortown" });
    }
    res.send(favours);
});
app.post('/favours', function (req, res, next) {
});
app.get('/', function (req, res, next) {
    res.send("hi");
});
app.listen(5000, function () { return console.log('Server running'); });
