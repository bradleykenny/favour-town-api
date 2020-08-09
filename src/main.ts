import express, {Application, Request,Response, NextFunction} from 'express';
import {v4 as uuid} from 'uuid';
const app: Application= express();



app.get('/favours', (req: Request,res:Response, next:NextFunction)=>{
    const count : Number = Number(req.query["count"]); //Return number of favours requested by users
    var favours: Array<object> = [];
    for (let i = 0; i < count; i++) {
        favours.push({
            "_id":"fvr_"+uuid(),
            "user_id":"usr_"+uuid(),
            "description":"Yo Imma do somethin for ya",
            "location":"Favortown"}); //Generate a list of favours
    }
    res.send(favours); 
})
app.post('/favours', (req: Request,res:Response, next:NextFunction)=>{
    
})

app.get('/', (req: Request,res:Response, next:NextFunction)=>{
    res.send("hi");
})

app.listen(5000, () => console.log('Server running'))