import { Logger } from  '../../common/logger';
import { cron } from 'node-cron';

Logger.instance().log('Enabling Cron process for Rean Bot.');

export const scheduleCron = () =>{
    cron.schedule('* * * * *', () => {
        var time = new Date().toString();
        Logger.instance().log('------------------------- Test Cron Execution... -------------------------');
        Logger.instance().log('TIME: [' + time + ']');
        Logger.instance().log('ReanBot is up ____ running a task every minute.');
    });
};
