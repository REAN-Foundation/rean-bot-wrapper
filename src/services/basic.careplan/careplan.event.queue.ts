import * as asyncLib from 'async';
import { Logger } from "../../common/logger";
import { CareplanMessageSender } from "./careplan.message.sender";
import { CareplanEvent } from '../../domain.types/basic.careplan/careplan.types';

///////////////////////////////////////////////////////////////////////////////

export class CareplanEventQueue {

    private static _numAsyncTasks = 4;

    private static _delayBeforeProcessingMs = 60 * 1000; // 60 seconds

    private static _careplanEnrollmentQueue = asyncLib.queue(
        (event: CareplanEvent, onCompleted: asyncLib.ErrorCallback<Error>) => {
            (async () => {
                await CareplanEventQueue.delay(CareplanEventQueue._delayBeforeProcessingMs);
                await CareplanMessageSender.sendEnrollmentMessage(
                    event.ClientName,
                    event.Channel,
                    event.PlatformUserId
                );
                onCompleted();
            })();
        },
        CareplanEventQueue._numAsyncTasks
    );

    public static pushEvent(
        clientName: string,
        channel: string,
        platformUserId?: string
    ): void {
        try {
            const event: CareplanEvent = { ClientName: clientName, Channel: channel, PlatformUserId: platformUserId };

            Logger.instance().log(
                `Pushing careplan enrollment event to queue: ${JSON.stringify(event)}`
            );

            CareplanEventQueue._careplanEnrollmentQueue.push(event, (err) => {
                if (err) {
                    Logger.instance().log(`Error pushing careplan enrollment event: ${err.message}`);
                }
            });
        } catch (error) {
            Logger.instance().log(`Error in pushEvent: ${error.message}`);
        }
    }

    private static delay = async (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

}
