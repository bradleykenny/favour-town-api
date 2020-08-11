"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var mysql_1 = __importDefault(require("mysql"));
var dotenv_1 = __importDefault(require("dotenv"));
var app = express_1.default();
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
dotenv_1.default.config();
var connection = mysql_1.default.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB
});
connection.connect();
/*
var favours: Array<object> = [];

app.get('/favours', (req: Request,res:Response, next:NextFunction)=>{
    const count : Number = Number(req.query["count"]); //Return number of favours requested by users
    if(favours.length<count){
        for (let i = favours.length; i < count; i++) {
            favours.push({
                "_id":"fvr_"+uuid(),
                "user_id":"usr_"+uuid(),
                "description":"Yo Imma do somethin for ya",
                "location":"Favortown"
            }); //Generate a list of favours
            }
    }
    res.send(favours);
})
app.post('/favours', (req: Request,res:Response, next:NextFunction)=>{

    favours.push({
        "_id":"fvr_"+uuid(),
        "user_id":"usr_"+uuid(),
        "description":req.body["description"],
        "location":req.body["location"]
    }); //Generate a list of favours
    console.log(favours[favours.length-1])
    res.send(req.query)
    
})

app.get('/', (req: Request,res:Response, next:NextFunction)=>{
    res.send("hi");
})

app.listen(5000, () => console.log('Server running'))
*/ 
