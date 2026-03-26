import * as asyncLib from 'async';
import { Logger } from '../../common/logger';
import { RegistrationAssessmentService } from './registration.assessment.service';
import { RegistrationAssessmentEvent } from '../../domain.types/registration.assessment/registration.assessment.types';

///////////////////////////////////////////////////////////////////////////////

export class RegistrationAssessmentEventQueue {

    private static _numAsyncTasks = 4;

    // 90s delay — fires after the 60s careplan welcome message
    private static _delayBeforeProcessingMs = 90 * 1000;

    private static _registrationAssessmentQueue = asyncLib.queue(
        (event: RegistrationAssessmentEvent, onCompleted: asyncLib.ErrorCallback<Error>) => {
            (async () => {

                await RegistrationAssessmentEventQueue.delay(RegistrationAssessmentEventQueue._delayBeforeProcessingMs);
                await RegistrationAssessmentService.trigger(
                    event.ClientName,
                    event.Channel,
                    event.PlatformUserId,
                    event.PatientUserId
                );
                onCompleted();
            })();
        },
        RegistrationAssessmentEventQueue._numAsyncTasks
    );

    public static pushEvent(
        clientName    : string,
        channel       : string,
        platformUserId: string,
        patientUserId : string
    ): void {
        console.log(`RegistrationAssessmentEventQueue: pushEvent called with clientName=${clientName}, channel=${channel}, platformUserId=${platformUserId}, patientUserId=${patientUserId}`);
        try {
            const event: RegistrationAssessmentEvent = {
                ClientName     : clientName,
                Channel        : channel,
                PlatformUserId : platformUserId,
                PatientUserId  : patientUserId
            };

            Logger.instance().log(
                `Pushing registration assessment event to queue: ${JSON.stringify(event)}`
            );

            RegistrationAssessmentEventQueue._registrationAssessmentQueue.push(event, (err) => {
                if (err) {
                    Logger.instance().log(`Error pushing registration assessment event: ${err.message}`);
                }
            });
        } catch (error) {
            Logger.instance().log(`Error in RegistrationAssessmentEventQueue.pushEvent: ${error.message}`);
        }
    }

    private static delay = async (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

}
