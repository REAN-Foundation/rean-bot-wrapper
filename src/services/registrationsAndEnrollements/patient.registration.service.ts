import { CountryCodeService } from '../../utils/phone.number.formatting';
import { NeedleService } from '../needle.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped,  } from 'tsyringe';
import { Logger } from '../../common/logger';
import { ContactList } from '../../models/contact.list';
import { ChatSession } from '../../models/chat.session';
import { CareplanEventQueue } from '../basic.careplan/careplan.event.queue';

@scoped(Lifecycle.ContainerScoped)
export class Registration{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private EnvironmentProviderService: ClientEnvironmentProviderService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(CountryCodeService ) private countryCodeService ?:CountryCodeService
    ) {}

    async checkPatientExist(userName,phoneNumber){
        let searchResult = null;
        if (userName){
            const SearchByUserApiUrl = `patients/byPhone?userName=${userName}`;
            searchResult = await this.needleService.needleRequestForREAN("get", SearchByUserApiUrl);
        }
        else if (phoneNumber){
            const SearchByPhoneNumberApiUrl = `patients/byPhone?phone=${encodeURIComponent(phoneNumber)}`;
            searchResult = await this.needleService.needleRequestForREAN("get", SearchByPhoneNumberApiUrl);
        }
        return searchResult;
    }

    async registerUserOnReanCare(
        platformUserName: string,
        platformUserId: string,
        creationMethod: "phoneNumber" | "userName",
        password: string,
        api_key: string
    ): Promise<string> {
        try {
            let obj: Record<string, any> | null = null;
    
            // Build the object based on creation method
            if (creationMethod === "phoneNumber") {
                obj = {
                    Phone           : await this.countryCodeService.formatPhoneNumber(platformUserId),
                    FirstName       : platformUserName,
                    DefaultTimeZone : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE"),
                    CurrentTimeZone : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE"),
                    TenantCode      : this.EnvironmentProviderService.getClientEnvironmentVariable("NAME"),
                    GenerateOtp     : false
                };
            } else if (creationMethod === "userName") {
                obj = {
                    FirstName         : platformUserName,
                    UserName          : platformUserId,
                    UniqueReferenceId : platformUserId,
                    DefaultTimeZone   : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE"),
                    CurrentTimeZone   : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE"),
                    TenantCode        : this.EnvironmentProviderService.getClientEnvironmentVariable("NAME"),
                    GenerateOtp       : false
                };
            } else {
                throw new Error(`Invalid creation method: ${creationMethod}`);
            }
    
            // API Call
            const apiURL = `patients`;
            const response = await this.needleService.needleRequestForREAN("post", apiURL, null, obj,api_key);
    
            // Return the User ID
            if (response?.Data?.Patient?.UserId) {
                return response.Data.Patient.UserId;
            } else {
                throw new Error(`Failed to register user. Invalid response format: ${JSON.stringify(response)}`);
            }
            
        } catch (error: any) {
            console.error("Error in registerUserOnReanCare:", error.message || error);
            throw new Error(`Error in registerUserOnReanCare: ${error.message || error}`);
        }
    }
    
    async wrapperRegistration(entityManagerProvider,userPlatformId,userPlatformName,platform,patientUserId){
        const contactListRepository =
        (await entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(ContactList);
        const chatSessionRepository =
        (await entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(ChatSession);
        const respContactList = await contactListRepository.findAll({ where: { mobileNumber: userPlatformId } });
        if (respContactList.length === 0) {
            await contactListRepository.create({
                mobileNumber  : userPlatformId,
                username      : userPlatformName,
                platform      : platform,
                patientUserId : patientUserId,
                optOut        : "false" });
            const defaultLanguage = this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE") || "en";
            await chatSessionRepository.create({
                userPlatformID    : userPlatformId,
                preferredLanguage : defaultLanguage,
                sessionOpen       : "true" });
        }
        else {
            await contactListRepository.update(
                { patientUserId: patientUserId }, { where: { mobileNumber: userPlatformId } });
        }

    }

    async getPatientUserId(
        channel: any,
        PlatformUserId: string,
        platformUserName: string,
        password: string = process.env.USER_REGISTRATION_PASSWORD,
        api_key:string = this.EnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY")
    ): Promise<{ patientUserId: string | null; statusCode: number; errorMessage?: string }> {
        try {
            let patientUserId = null;
            if (channel === "telegram" || channel === "Telegram") {
                const result = await this.checkPatientExist(PlatformUserId, null);
                if (result.Data.Patients.Items.length === 0) {
                    patientUserId = await this.registerUserOnReanCare(platformUserName, PlatformUserId, "userName", password,api_key);

                    CareplanEventQueue.pushEvent(
                        this.EnvironmentProviderService.getClientName(),
                        channel,
                        patientUserId
                    );
                } else {
                    patientUserId = result.Data.Patients.Items[0].UserId;
                }
            } else if (
                channel === "whatsappMeta" ||
                channel === "whatsapp" ||
                channel === "whatsappWati" ||
                channel === "MockChannel" ||
                channel === "REAN_SUPPORT" ||
                channel === "SNEHA_SUPPORT") {
                console.log("platformUser ID IS:",PlatformUserId);
                const PhoneNumber = await this.countryCodeService.formatPhoneNumber(PlatformUserId);
                Logger.instance().log(`Fetching patient details for phone number: ${PhoneNumber}`);
                const apiURL = `patients/byPhone?phone=${encodeURIComponent(PhoneNumber)}`;
                const result = await this.needleService.needleRequestForREAN("get", apiURL,null,null,api_key);
                if (result.Data.Patients.Items.length === 0) {
                    patientUserId = await this.registerUserOnReanCare(platformUserName, PlatformUserId, "phoneNumber", password,api_key);

                    CareplanEventQueue.pushEvent(
                        this.EnvironmentProviderService.getClientName(),
                        channel,
                        patientUserId
                    );
                } else {
                    patientUserId = result.Data.Patients.Items[0].UserId;
                }
            } else {
                throw new Error("Channel not integrated");
            }
    
            return { patientUserId, statusCode: 200 }; // Success case
        } catch (error: any) {

            // Log the error if necessary
            console.error(`Error in getPatientUserId: ${error.message}`);
    
            // Re-throw the error to propagate it to the caller
            throw error;
        }
    }

}
