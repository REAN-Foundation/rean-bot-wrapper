import { Logger } from  '../../common/logger';
import { cron } from 'node-cron';

Logger.instance().log('Enabling Cron process for Rean Bot.');

/*
 * Test cron running every min
 * doc: https://www.npmjs.com/package/node-cron
 */
// MIN HOUR DOM MON DOW
export const scheduleCron = () =>{
    cron.schedule('* * * * *', () => {
        var time = new Date().toString();
        Logger.instance().log('------------------------- Test Cron Execution... -------------------------');
        Logger.instance().log('TIME: [' + time + ']');
        Logger.instance().log('ReanBot is up ____ running a task every minute.');
    });
};
