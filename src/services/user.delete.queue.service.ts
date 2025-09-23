import { inject, injectable } from 'tsyringe';
import * as asyncLib from 'async';
import { Logger } from '../common/logger';
import { userHistoryDeletionService } from './user.history.deletion.service';

////////////////////////////////////////////////////////////////////////////////////////////////////////

const ASYNC_TASK_COUNT = 4;

@injectable()
export class UserDeleteQueueService {

    constructor(
        @inject(userHistoryDeletionService) private _userHistoryDeletionService: userHistoryDeletionService
    ) {}

    // Queue definition
    public _q = asyncLib.queue((patientUserId: string, onCompleted) => {
        (async () => {
            await this.deleteUser(patientUserId);
            onCompleted();
        })();
    }, ASYNC_TASK_COUNT);

    // Public method to enqueue
    public enqueueDeleteUser = async (patientUserId: string, client) => {
        try {
            this.enqueue(patientUserId);
        } catch (error) {
            Logger.instance().log(`Enqueue error: ${JSON.stringify(error.message, null, 2)}`);
        }
    };

    //#region Privates

    private enqueue = (patientUserId: string) => {
        this._q.push(patientUserId, (patientUserId, error) => {
            if (error) {
                Logger.instance().log(`Error deleting user history for PatientUserId=${patientUserId}: ${JSON.stringify(error)}`);
                Logger.instance().log(`Stack: ${JSON.stringify(error.stack, null, 2)}`);
            } else {
                Logger.instance().log(`Successfully deleted user history for PatientUserId=${patientUserId}`);
            }
        });
    };

    private deleteUser = async (patientUserId: string) => {
        try {
            await this._userHistoryDeletionService.deleteUserProfile(patientUserId);
        } catch (error) {
            Logger.instance().log(`Delete error for PatientUserId=${patientUserId}: ${JSON.stringify(error.message, null, 2)}`);
        }
    };

    //#endregion
}
