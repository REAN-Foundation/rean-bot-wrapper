import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { GeneralReminderService } from './general.reminder.service.js';
import { Registration } from '../registrationsAndEnrollements/patient.registration.service.js';

@scoped(Lifecycle.ContainerScoped)
export class AppointmentReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        // eslint-disable-next-line max-len
        @inject(GeneralReminderService) private generalReminderService?: GeneralReminderService,
        @inject(Registration) private registration?: Registration,

    ){}

    async createReminder (eventObj) {
        try {
            const event = eventObj.body.queryResult.parameters.event;
            let date = eventObj.body.queryResult.parameters.dateTime;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;

            //const timeString = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            //const phoneNumber : any = await this.needleService.getPhoneNumber(eventObj);
            console.log(`Time stamp in appointment reminder ${date}`);
            if (date.date_time) {
                date = date.date_time;
            }

            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const patientIDArray = await this.registration.getPatientUserId(channel,
                personPhoneNumber, personName);

            const { whenDay, whenTime } = await this.generalReminderService.extractWhenDateTime(date);
            console.log(`date and time ${event} ${whenDay} ${whenTime}`);
            const jsonFormat = {
                patientUserId : patientIDArray.patientUserId,
                TaskName      : event,
                TaskType      : "other",
                Frequency     : "Once",
                DayName       : null,
                WhenTime      : whenTime,
            };

            await this.generalReminderService.createCommonReminders(eventObj, "Once", jsonFormat, patientIDArray.patientUserId, whenDay, whenTime, personName, personPhoneNumber, null );

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": ["Your reminder has been successfully set, and you will receive a notification at the scheduled time."] }
                    }
                ]
            };

            return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Appointment reminder creation error');
        }
    }

}
