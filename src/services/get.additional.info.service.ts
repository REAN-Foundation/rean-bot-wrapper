import { inject, Lifecycle, scoped } from 'tsyringe';
import { translateService } from '../services/translate.service';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { ContactList } from '../models/contact.list';
import { NeedleService } from './needle.service';
import { kerotoplastyService } from './kerotoplasty.service';
import { sendExtraMessages } from './send.extra.messages.service';
@scoped(Lifecycle.ContainerScoped)
export class getAdditionalInfoSevice {

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(sendExtraMessages) private sendExtraMessagesobj?: sendExtraMessages,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(translateService) private translate?: translateService,
        @inject (kerotoplastyService) private KerotoplastyService?:kerotoplastyService,
    ){}

    async   processAdditionalInfo(eventObj){
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
            if (clientName === "GGHN_HIVTB" || clientName === "REAN_BOT")
            {
                message = await this.getMessageForGGHN(EHRNumber,userName);
            }
            if (clientName === "LVPEI")
            {
                message = await this.getMessageForLVPEI(EHRNumber,userId,userName,languageCode,eventObj);
            }
            if (message !== null){
                const button_yes = await this.translate.translatestring("Yes",languageCode);
                const button_no = await this.translate.translatestring("No",languageCode);
                const buttonArray = [button_yes, "Welcome",button_no,"additionalInfo"];
                this.sendExtraMessagesobj.sendResponsebyButton(message,eventObj,userId,buttonArray);
            }
            else {
                const RequiredAdditionalInfo =  await this.clientEnvironment.getClientEnvironmentVariable("REQUIRED_ADDITIONAL_INFO");
                const RequiredAdditionalobj = JSON.parse(RequiredAdditionalInfo );
                message = `Sorry the provided ${ RequiredAdditionalobj.EHRCODE} ${EHRNumber} is not in our records \n Do you want to Re-enter your ${ RequiredAdditionalobj.EHRCODE}`;
                const button_yes = await this.translate.translatestring("Yes",languageCode);
                const button_no = await this.translate.translatestring("No",languageCode);
                const buttonArray = [button_yes, "additionalInfo" ,button_no,"Welcome"];
                this.sendExtraMessagesobj.sendResponsebyButton(message,eventObj,userId,buttonArray);
            }
        }
        catch (error) {
            console.log(" While Checking the validity of EHR Number", error);

        }
    }

    async getMessageForLVPEI(EHRNumber,userId,userName,languageCode,eventObj)

    {
        try {
            let response: any = {};
            response =  await this.KerotoplastyService.makeApiCall(EHRNumber, eventObj);
            let name = null;
            let message = null;
            const surgeryName = [];
            if (response.body.patient_details){
                name = response.body.patient_details.FirstName + ' ' + response.body.patient_details.LastName;
                message = `Hi, *${name}*!\n\n We have recorded your MR number: *${EHRNumber}*` ;
                if (response.body.patient_details.last_visted_date !== null){
                    message = message + `\n\n Your last appointment was on ${response.body.patient_details.last_visted_date} with ${response.body.patient_details.last_visted_doctor}.`;
                }
                if (response.body.surgeries !== null){
                    for (const operate of response.body.surgeries) {
                        surgeryName.push(operate.procedure_info + '\n');
                    }
                    message = message + `\n *You have undergone following Surgeries:* ${surgeryName}.`;
                }
                message = message + ` \n \n Is the above provided information correct?`;
            }
            else 
            {
                message = null;
            }
            return message;
        } catch (error) {
            console.log("error in formatting message for LVPEI",error);
        }
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
            const gghnUrl =  await this.clientEnvironment.getClientEnvironmentVariable("GGHN_URL");
            const userName = await this.clientEnvironment.getClientEnvironmentVariable("GGHN_USER_NAME");
            const password = await this.clientEnvironment.getClientEnvironmentVariable("GGHN_PASSWORD");
            const url = gghnUrl;

            const headers = {
                'Content-Type' : 'application/json',
                accept         : 'application/json'
            };
            const options = {
                headers : headers,
            };
            const obj = {
                "username" : userName,
                "Password" : password
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
                this.sendExtraMessagesobj.sendResponsebyButton(message,eventObj,userId,buttonArray);
                return { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } ;
            }
        }
        catch (error) {
            console.log("While reading additional info", error);

        }

    }

}
