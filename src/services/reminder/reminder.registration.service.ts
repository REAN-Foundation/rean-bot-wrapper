import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import { NeedleService } from '../needle.service.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { DateTime } from 'luxon';
import cityTimezones from 'city-timezones';
import { Registration } from '../registrationsAndEnrollements/patient.registration.service.js';

@scoped(Lifecycle.ContainerScoped)
export class ReminderRegistrationService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(Registration) private registration?: Registration,
    ){}

    async setUserTimeZone (eventObj) {
        try {
            const cityName = eventObj.body.queryResult.parameters.cityName;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            let dffMessage = null;
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;

            const result = await this.registration.getPatientUserId(channel,
                personPhoneNumber, personName);

            const cityLookup = cityTimezones.lookupViaCity(cityName);
            let timeOffset = "+05:30";
            if (cityLookup.length !== 0) {
                timeOffset = await this.timeZoneToOffset(cityLookup[0].timezone);

                const obj = {
                    CurrentTimeZone : timeOffset
                };
                const apiURL = `patients/${result.patientUserId}`;
                await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
                dffMessage = `Your time zone has been successfully adjusted based on the city ${cityName}.`;
            } else {
                dffMessage = "Please provide a valid city name.";
            }
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    }
                ]
            };

            return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Set my time zone service error');
        }
    }

    public timeZoneToOffset(timeZone){
        try {
            const now = DateTime.now().setZone(timeZone);
            const offset = now.toFormat('ZZ');
            return offset;
        } catch (error) {
            console.error(`Error converting time zone to offset: ${error}`);
            return null;
        }
    }

}
