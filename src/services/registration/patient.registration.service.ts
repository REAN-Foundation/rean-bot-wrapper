import { CountryCodeService } from '../../utils/phone.number.formatting';
import { NeedleService } from '../needle.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped,  } from 'tsyringe';
import { ContactList } from '../../models/contact.list';

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


    async createUser(platformUserName,UserId,creationMethod)
    {   let obj = null;
        if (creationMethod === "phoneNumber"){
            obj = {
                Phone           : this.countryCodeService.formatPhoneNumber(UserId),
                Password        : "Test@123",
                FirstName       : platformUserName,
                DefaultTimeZone : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE"),
                CurrentTimeZone : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE")
            };
        }
        else if (creationMethod === "userName")
        {
            obj = {
                Password        : "Test@123",
                FirstName       : platformUserName,
                UserName        : UserId,
                TelegramChatId  : UserId,
                DefaultTimeZone : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE"),
                CurrentTimeZone : this.EnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_USERS_TIME_ZONE")
            };
        }
        const apiURL = `patients`;
        const response = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
        return response.Data.Patient.UserId;
    }

    async wrapperRegistration(entityManagerProvider,userPlatformId,userPlatformName,platform,patientUserId){
        const contactListRepository =
        (await entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(ContactList);
        const respContactList = await contactListRepository.findAll({ where: { mobileNumber: userPlatformId } });
        if (respContactList.length === 0) {
            await contactListRepository.create({
                mobileNumber  : userPlatformId,
                username      : userPlatformName,
                platform      : platform,
                patientUserId : patientUserId,
                optOut        : "false" });
        }
        else {
            await contactListRepository.update(
                { patientUserId: patientUserId }, { where: { mobileNumber: userPlatformId } });
        }

    }

    async getPatientUserId(channel: any, UserId: string, platformUserName: string) {
        try
        {
            let patientUserId = null;
            if (channel === "telegram" || channel === "Telegram") {
                const result = await this.checkPatientExist(UserId,null);
                if (result.Data.Patients.Items.length === 0) {
                    patientUserId = await this.createUser(platformUserName,UserId,"userName");
                } else {
                    patientUserId = result.Data.Patients.Items[0].UserId;
                }
            } else if (channel === "whatsappMeta") {
                const PhoneNumber = await this.countryCodeService.formatPhoneNumber(UserId);
                const apiURL = `patients/byPhone?phone=${encodeURIComponent(PhoneNumber)}`;
                const result = await this.needleService.needleRequestForREAN("get", apiURL);
                if (result.Data.Patients.Items.length === 0) {
                    patientUserId = await this.createUser(platformUserName,UserId,"phoneNumber");
                } else {
                    patientUserId = result.Data.Patients.Items[0].UserId;
                }
            }
            return patientUserId;
        }
        catch (e) {
            console.log(e);
        }
        
    }
}