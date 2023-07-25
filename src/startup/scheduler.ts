import { Logger } from '../common/logger';
import * as cron from 'node-cron';
import * as CronSchedules from '../assets/seed.data/cron.schedules.json';
import { Loader } from './loader';
import {databackup} from '../services/scheduleDataBackup.service';

export class Scheduler {

    private static _instance: Scheduler = null;

    private static envSchedules = null;

    private static env = null;

    private constructor() {
        Scheduler.env = process.env.ENVIRONMENT;
        Scheduler.envSchedules = CronSchedules[Scheduler.env];
        Logger.instance().log('Initializing the schedular.');
    }

    public static instance(): Scheduler {
        return this._instance || (this._instance = new this());
    }

    public schedule = async (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {
                console.log("starting the schedular service");
                this.scheduleDataBackup();
                resolve(true);
            } catch (error) {
                Logger.instance().log('Error initializing the schedular.: ' + error.message);
                reject(false);
            }
        });
    };

    private scheduleDataBackup = () => {
        for (const clientName in Scheduler.envSchedules){
            cron.schedule(Scheduler.envSchedules[clientName]['scheduleDataBackup'], () => {
                (async () => {
                    Logger.instance().log(`Running scheducled jobs: DataBackup in S3 ${clientName}`);
                    var databackupobj = new databackup();
                    await databackupobj.main(clientName);

                    // var service = Loader.container.resolve(FileResourceService);
                    // await service.cleanupTempFiles();
                })();
            });
        }

    };

}
