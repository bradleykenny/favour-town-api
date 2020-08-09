"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var uuid_1 = require("uuid");
var app = express_1.default();
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
var favours = [];
app.get('/favours', function (req, res, next) {
    var count = Number(req.query["count"]); //Return number of favours requested by users
    if (favours.length < count) {
        for (var i = favours.length; i < count; i++) {
            favours.push({
                "_id": "fvr_" + uuid_1.v4(),
                "user_id": "usr_" + uuid_1.v4(),
                "description": "Yo Imma do somethin for ya",
                "location": "Favortown"
            }); //Generate a list of favours
        }
    }
    res.send(favours);
});
app.post('/favours', function (req, res, next) {
    favours.push({
        "_id": "fvr_" + uuid_1.v4(),
        "user_id": "usr_" + uuid_1.v4(),
        "description": req.body["description"],
        "location": req.body["location"]
    }); //Generate a list of favours
    console.log(favours[favours.length - 1]);
    res.send(req.query);
});
app.get('/', function (req, res, next) {
    res.send("hi");
});
app.listen(5000, function () { return console.log('Server running'); });
