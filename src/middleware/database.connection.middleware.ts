import { autoInjectable } from 'tsyringe';
import { SequelizeClient } from '../connection/sequelizeClient';

@autoInjectable()
export class DatabaseConnection{

    constructor(private sequelizeClient?: SequelizeClient){}

    myLogger = async (req, res, next) => {
        if (req.body.statuses){
            console.log("360Dialog & Telegram Connection Avoided");
        }
        else if (req.body.challenge) {
            console.log("no db connection needed");
        }
        else if (req.body.event) {
            console.log("skip");
        }
        else if (req.body.history_items){
            console.log("webhook clickup");
            if (req.body.event === "taskCommentUpdated" || req.body.event === "taskStatusUpdated") {
                await this.sequelizeClient.connect();
            }
        }
        else {
            await this.sequelizeClient.connect();
        }
        next();
    };

    metaDBConnection = async (req, res, next) => {
        if (!req.body.entry[0].changes[0].value.statuses){
            await this.sequelizeClient.connect();
        } else {
            console.log("Meta DB Connection Skipped");
        }
        next();
    };

}
