import { Logger } from '../common/logger';
import * as cron from 'node-cron';
import * as CronSchedules from '../assets/seed.data/cron.schedules.json';
import { databackup } from '../services/scheduleDataBackup.service';
import { ChatDailyRollupService } from '../services/stats/chat.daily.rollup.service';

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
                this.scheduleChatDailyRollup();
                resolve(true);
            } catch (error) {
                Logger.instance().log('Error initializing the schedular.: ' + error.message);
                reject(false);
            }
        });
    };

    private scheduleChatDailyRollup = () => {
        const cronExpression = Scheduler.envSchedules?.STATS?.scheduleChatDailyRollup;
        console.log(`scheduleChatDailyRollup: cron expression for this environment is "${cronExpression}".`);
        if (!cronExpression) {
            Logger.instance().log('scheduleChatDailyRollup: no cron expression configured for this environment, skipping.');
            return;
        }
        cron.schedule(cronExpression, () => {
            (async () => {
                Logger.instance().log('Running scheduled job: ChatDailyRollupService.runForYesterday');
                await ChatDailyRollupService.runForYesterday();
            })();
        });
    };

    private scheduleDataBackup = () => {
        for (const clientName in Scheduler.envSchedules){
            const cronExpression = Scheduler.envSchedules[clientName]['scheduleDataBackup'];
            if (!cronExpression) {
                console.log(`scheduleDataBackup: no cron expression configured for client ${clientName}, skipping.`);
                continue;
            }
            cron.schedule(cronExpression, () => {
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
