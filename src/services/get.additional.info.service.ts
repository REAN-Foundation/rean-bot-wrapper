import { inject, Lifecycle, scoped } from 'tsyringe';
import { ErrorHandler } from '../utils/error.handler';
import { translateService } from '../services/translate.service';
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import needle from 'needle';
import { ContactList } from '../models/contact.list';
import { ResponseHandler } from '../utils/response.handler';
import { commonResponseMessageFormat } from '../services/common.response.format.object';
import { Iresponse } from '../refactor/interface/message.interface';
import { sendApiButtonService } from './whatsappmeta.button.service';
import { sendTelegramButtonService } from '../services/telegram.button.service';
import { NeedleService } from './needle.service';
import { kerotoplastyService } from './kerotoplasty.service';

@scoped(Lifecycle.ContainerScoped)
export class getAdditionalInfoSevice {
    
    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(translateService) private translate?: translateService,
        @inject (kerotoplastyService) private KerotoplastyService?:kerotoplastyService,
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
    ){}

    async processAdditionalInfo(eventObj){
        try {
            console.log("additional info  intent is trigered");
            const userName = eventObj.body.originalDetectIntentRequest.payload.userName;
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const languageCode = eventObj.body.queryResult.languageCode;
            const ehrSystemCode = eventObj.body.queryResult.parameters.EHRNumber;
            if (ehrSystemCode){
                this.SaveEHRNumber(ehrSystemCode,userId);
                this.SendValidEHRResponse(ehrSystemCode,userId,userName,languageCode,eventObj);
            }
            console.log("Info is saved");
        }
        catch (error) {
            console.log("WhileStoring the additional info", error);

        }
    }

    async SendValidEHRResponse(EHRNumber,userId,userName,languageCode,eventObj){
        try {
            let message = null;
            const clientName = this.clientEnvironment.getClientEnvironmentVariable("NAME");
            if (clientName === "GGHN_HIVTB")
            {
                message = await this.getMessageForGGHN(EHRNumber,userName);
            }
            if (clientName === "LVPEI" || clientName === "REAN_BOT")
            {
                message = await this.getMessageForLVPEI(EHRNumber,userId,userName,languageCode,eventObj);
            }
            if (message !== null){
                const button_yes = await this.translate.translatestring("Yes",languageCode);
                const button_no = await this.translate.translatestring("No",languageCode);
                const buttonArray = [button_yes, "Welcome",button_no,"additionalInfo"];
                this.sendResponsebyButton(message,eventObj,userId,buttonArray);
            }
            else {
                const RequiredAdditionalInfo =  await this.clientEnvironment.getClientEnvironmentVariable("REQUIRED_ADDITIONAL_INFO");
                const RequiredAdditionalobj = JSON.parse(RequiredAdditionalInfo );
                message = `Sorry the provided ${ RequiredAdditionalobj.EHRCODE} ${EHRNumber} is not in our records \n Do you want to Re-enter your ${ RequiredAdditionalobj.EHRCODE}`;
                const button_yes = await this.translate.translatestring("Yes",languageCode);
                const button_no = await this.translate.translatestring("No",languageCode);
                const buttonArray = [button_yes, "additionalInfo" ,button_no,"Welcome"];
                this.sendResponsebyButton(message,eventObj,userId,buttonArray);
            }
        }
        catch (error) {
            console.log(" While Checking the validity of EHR Number", error);

        }
    }

    async getMessageForLVPEI(EHRNumber,userId,userName,languageCode,eventObj)
    {
        console.log("for LVPEI");
        let response: any = {};
        response =  await this.KerotoplastyService.makeApiCall(EHRNumber, eventObj);
        let message = null;
        if (response.body.patient_details){
            const responseObject = await this.formulate_LVPEI_ResposeObj(response);
            message = `Hi *${responseObject.Name}*!!\nWe have record your MR number *${EHRNumber}* .\n\n Your last appoinment was on ${responseObject.LastVisitDate} with ${responseObject.LastVisitDoctor}.\n *You have Undergone following Surgeries:* ${responseObject.surgey}. \n \n If the above Provided info is correct?`;
        }
        return message;
    }

    async formulate_LVPEI_ResposeObj(response)

    {
        const surgeryName = [];
        if (response.body.surgeries !== null){
            for (const operate of response.body.surgeries) {
                surgeryName.push(operate.procedure_info + '\n');
            }
        }
        const responseObj = {
            Name            : response.body.patient_details.FirstName + ' ' + response.body.patient_details.LastName,
            surgey          : surgeryName,
            LastVisitDoctor : response.body.patient_details.last_visted_doctor,
            LastVisitDate   : response.body.patient_details.last_visted_date

        };
        return responseObj;
    }

    async getMessageForGGHN(EHRNumber,userName)
    {
        const authenticationToken = await this.getauthenticationToken();
        const next_appointment_date = await this.getUserInfo(authenticationToken, EHRNumber );
        let message = null;
        if (next_appointment_date !== null){
            message = `Hi ${userName}! I’m GGHN Jara Wellness Assistant – Your Health Companion! 🤖\n Get instant clarity on any questions regarding  HIV & Tuberculosis (TB) in your preferred local language.
                \n⏰ you will get reminder for your next appointment date on ${next_appointment_date}.`;
        }
        return message;
    }

    async sendResponsebyButton(message,eventObj,userId,buttonArray){
        try {
            const sourceChannel = eventObj.body.originalDetectIntentRequest.payload.source;
            let payload = null;
            let messageType = null;
            if (sourceChannel === "whatsappMeta"){
                payload = await sendApiButtonService(buttonArray);
                messageType = "interactivebuttons";
            }
            else {
                payload = await sendTelegramButtonService(buttonArray);
                messageType = "inline_keyboard";
            }
            this._platformMessageService = eventObj.container.resolve(sourceChannel);
            await this.sendButton(this._platformMessageService,message, messageType, userId ,payload);
        }
        catch (error) {
            console.log("While formulating button response", error);

        }

    }

    async sendButton(_platformMessageService , message, messageType, sessionId, payload){
        try {
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = sessionId;
            response_format.messageText = message;
            response_format.message_type = messageType;
    
            _platformMessageService.SendMediaMessage(response_format, payload );
        }
        catch (error) {
            console.log("While Sending button response", error);

        }

    }

    async getUserInfo(authenticationToken,userID){
        try {
            const url = `https://hid4mel.gghnigeria.org/api/PharmacyPickup/QueryPatientInfo?querycode=${userID}`;
            const options = {
                headers : {
                    Authorization : `Bearer ${authenticationToken}`
                },
            };
            const obj = {};
            const response = await needle("post",url, obj,options);
            const jsonParsing = JSON.parse(response.body);
            const json = jsonParsing[0];
            if (json){
                const datestring = json.next_appointment_date;
                return datestring;
            }
            else {
                return null;
            }
        }
        catch (error) {
            console.log("While getting user info", error);

        }
        
    }

    async getauthenticationToken(){
        try {
            
            const url = "https://hid4mel.gghnigeria.org/account/JWTAuthentication";
            const headers = {
                'Content-Type' : 'application/json',
                accept         : 'application/json'
            };
            const options = {
                headers : headers,
            };
            const obj = {
                "username" : "reanapi",
                "Password" : "$reanAPI503$$"
            };
            const response = await needle("post",url, obj,options);
            return response.body.token;
        }
        catch (error) {
            console.log("While getting authentication token", error);

        }
  
    }

    async SaveEHRNumber(ehrSystemCode,userId){
        try {
            console.log("EHR number is saved");
            const contactList =
             (await this.entityManagerProvider.getEntityManager(this.clientEnvironment)).getRepository(ContactList);
            const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
            if (personContactList){
                await personContactList.update({  ehrSystemCode: ehrSystemCode });
                const patientUserId = personContactList.dataValues.patientUserId;
                const SearchByUserApiUrl = `patients/${patientUserId}`;
                const obj = { ExternalMedicalRegistrationId: ehrSystemCode };
                const response = await this.needleService.needleRequestForREAN("put", SearchByUserApiUrl,null,obj);
                console.log(response);
            }
            else {
                console.log("while updating the EHR number");
            }
    
        }
        catch (error) {
            console.log("in error", error);

        }
    }

    async readEHR(eventObj)
    {
        try {
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const contactList =
            (await this.entityManagerProvider.getEntityManager(this.clientEnvironment)).getRepository(ContactList);
            const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
            if (personContactList){
                const EhrNumber = personContactList.dataValues.ehrSystemCode;
                const RequiredAdditionalInfo =  await this.clientEnvironment.getClientEnvironmentVariable("REQUIRED_ADDITIONAL_INFO");
                const RequiredAdditionalobj = JSON.parse(RequiredAdditionalInfo );
                const dffMessage = `Your ${RequiredAdditionalobj.EHRCODE} is ${EhrNumber}.`;
                const message = `Do you want to change your  ${ RequiredAdditionalobj.EHRCODE}?`;
                const languageCode = eventObj.body.queryResult.languageCode;
                const button_yes = await this.translate.translatestring("Yes",languageCode);
                const button_no = await this.translate.translatestring("No",languageCode);
                const buttonArray = [button_yes, "additionalInfo" ,button_no,"Welcome"];
                this.sendResponsebyButton(message,eventObj,userId,buttonArray);
                return { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } ;
            }
        }
        catch (error) {
            console.log("While reading additional info", error);

        }

    }

}
