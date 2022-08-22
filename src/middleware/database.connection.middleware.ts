import { autoInjectable } from 'tsyringe';
import { SequelizeClient } from '../connection/sequelizeClient';

@autoInjectable()
export class DatabaseConnection{

    constructor(private sequelizeClient?: SequelizeClient){}

    myLogger = async (req, res, next) => {
        await this.sequelizeClient.connect();
        next();
    }
}