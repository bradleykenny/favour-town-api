import express, {Application, Request,Response, NextFunction} from 'express';
import bodyParser from "body-parser";
import mysql, { Connection } from "mysql";
import {v4 as uuid} from 'uuid';

const app: Application= express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var connection: Connection =mysql.createConnection({
    host     : 'localhost',
    user     : 'me',
    password : 'secret',
    database : 'my_db'
  });
connection.connect();


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