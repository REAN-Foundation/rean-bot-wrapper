import { autoInjectable } from 'tsyringe';
import { SequelizeClient } from '../connection/sequelizeClient';

@autoInjectable()
export class DatabaseConnection{

    constructor(private sequelizeClient?: SequelizeClient){}

    myLogger = async (req, res, next) => {
        if (req.body.statuses || req.body.entry[0].changes[0].value.statuses){
            console.log("DO NOTHING");
        } else {
            await this.sequelizeClient.connect();
        }
        next();
    }
}