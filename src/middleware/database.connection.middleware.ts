import { autoInjectable } from 'tsyringe';
import { SequelizeClient } from '../connection/sequelizeClient';

@autoInjectable()
export class DatabaseConnection{

    constructor(private sequelizeClient?: SequelizeClient){}

    myLogger = async (req, res, next) => {
        if (!req.body.statuses){
            await this.sequelizeClient.connect();
        } else {
            console.log("360Dialog & Telegram Connection Avoided");
        }
        next();
    }

    metaDBConnection = async (req, res, next) => {
        if (!req.body.entry[0].changes[0].value.statuses){
            await this.sequelizeClient.connect();
        } else {
            console.log("Meta DB Connection Skipped");
        }
        next();
    }
}