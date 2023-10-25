import { GetHeaders } from '../../services/biometrics/get.headers';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from 'needle';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { GetPatientInfoService } from '../support.app.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import * as EnglishMessages from './english.messages.json';
import * as SwahiliMessages from './swahili.messages.json';
import { translateService } from '../translate.service';

@scoped(Lifecycle.ContainerScoped)
export class RegistrationPerMinMsgService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
        @inject(translateService) private translate?: translateService,
    ) {}

    async registrationService (eventObj): Promise<any> {
        try {
            const name : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const lmp : string = eventObj.body.queryResult.parameters.LMP;
            const birthdate : string = eventObj.body.queryResult.parameters.Birthdate;

            const body : QueueDoaminModel =  {
                Intent : "Registration_PerMinMsg",
                Body   : {
                    Name     : name,
                    LMP      : lmp,
                    EventObj : eventObj
                }
            };

            const registrationMessage = `Hi ${name}, \nYour Last Mensuration Period(LMP) date is ${new Date(lmp.split("T")[0]).toDateString()}.\nYou will get periodic notifications based on your LMP.`;
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [registrationMessage] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Maternity careplan registration service error');
        }

    }

    async collectMessage(eventObj) {
        const englishMessages = EnglishMessages['default'];
        const swahiliMessages = SwahiliMessages['default'];
        let messages = [];
        let greet = "";
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const languageCode = await this.translate.detectUsersLanguage( userId );
        if (languageCode === 'sw') {
            messages = swahiliMessages;
            greet = "Habari";
        } else {
            messages = englishMessages;
            greet = "Hello";
        }
        await this.timer(1000);
        const sequenceMsg = messages.sort((a, b) => a.Sequence - b.Sequence);
        for (const msg of sequenceMsg) {
            await this.sendMessage(msg.Message, greet, eventObj);
            await this.timer(60000);
        }
    }

    private timer = ms => new Promise(res => setTimeout(res, ms));

    async sendMessage(this: any, msg: string, greet: string, eventObj) {
        const response_format: Iresponse = commonResponseMessageFormat();
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        this._platformMessageService = eventObj.container.resolve(payload.source);
        const name : string = eventObj.body.originalDetectIntentRequest.payload.userName;
        const b = eventObj.body.session;
        const patientPhoneNumber = b.split("/", 5)[4];
        console.log(`user id in registration flow ${patientPhoneNumber}`);
        response_format.platform = payload.source;
        response_format.sessionId = patientPhoneNumber;
        response_format.messageText = `${greet} ` + `${name},` + `\n` + msg;
        response_format.message_type = "text";
        await this._platformMessageService.SendMediaMessage(response_format, null);
    }
    
}

export interface MessageDomainModel {
    Sequence : number;
    Message  : string;
}
