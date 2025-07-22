import { inject, Lifecycle, scoped } from 'tsyringe';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { ContactList } from '../../models/contact.list';
import { UserInfo } from '../../models/user.info.model';
import { userInfoPayload } from '../../refactor/interface/user.info.interface';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class UserInfoService {

    public res;

    private _platformMessageService : platformServiceInterface = null;

    constructor(
        @inject(ClientEnvironmentProviderService) 
            private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider
    ){}

    async checkUserProvidedInfo(userPlatformID: string){
        try {
            const userProvidedInfo = {
                providedInfoFlag : false,
                providedInfo     : {}
            };
            const UserInfoRepository = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(UserInfo);
            const userInfo = await UserInfoRepository.findOne({
                where : {
                    userPlatformID : userPlatformID
                }
            });
            if (userInfo) {
                userProvidedInfo.providedInfoFlag = true;
                userProvidedInfo.providedInfo = userInfo;
            } else {
                userProvidedInfo.providedInfoFlag = false;
            }
            return userProvidedInfo;
        } catch (error) {
            console.log('Error in user info fetching: ', error);
        }
    }

    async updateUserInfo(userPlatformID: string, payload: userInfoPayload){
        try {
            const userInfoObj: Partial<UserInfo> = {
                userPlatformID : userPlatformID,
                userName       : payload.Name,
                userAge        : payload.Age,
                userGender     : payload.Gender,
                userInfo       : JSON.stringify(payload),
                infoProvided   : true
            };
            const UserInfoRepository = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(UserInfo);
            const ContactListRepository = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(ContactList);

            const userInfoExists = await UserInfoRepository.findOne(
                { 
                    where : {
                        userPlatformID : userPlatformID
                    }
                }
            );
            if (userInfoExists) {
                await UserInfoRepository.update(userInfoObj, {
                    where : {
                        userPlatformID : userPlatformID
                    }
                });
            } else {
                const userID = await ContactListRepository.findOne({
                    where : {
                        mobileNumber : userPlatformID
                    }
                });
                userInfoObj.userID = userID.autoIncrementalID;
                await UserInfoRepository.create(userInfoObj);
            }
        } catch (error) {
            console.log('Error while updating user info: ', error);
        }
    }

    async getMessageText() {
        const message = this.clientEnvironmentProviderService.getClientEnvironmentVariable("USER_INFO_THANK_YOU_MESSAGE");
        return message;
    }
}
