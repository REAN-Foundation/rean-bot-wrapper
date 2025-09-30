/* eslint-disable lines-around-comment */
/* eslint-disable max-len */
import { ChatSession } from '../models/chat.session';
import { translateService } from './translate.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { delay, inject, Lifecycle, scoped } from 'tsyringe';
import { EntityManagerProvider } from './entity.manager.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class UserLanguage {

    private translateSetting;

    constructor(
        @inject(delay(() => translateService)) private _translateService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider
    ){}

    async setLanguageForSession(messageType, sessionId, message) {
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const respChatSession = await chatSessionRepository.findAll({ where: { userPlatformID: sessionId } });
        const autoIncrementalID = respChatSession[respChatSession.length - 1].autoIncrementalID;
        const preferredLanguage = await this.getPreferredLanguageofSession(sessionId);
        console.log("preferredLanguage",preferredLanguage);
        if (preferredLanguage === "null"){
            console.log('Will create a session if it is the first entry in the chat session or if session is not open');
            const detected_language = await this.toDetectLangugaeOrNot(messageType, message);
            await chatSessionRepository.create({ userPlatformID: sessionId, preferredLanguage: detected_language, sessionOpen: "true" });
            // await setUserLanguage.save();
            return detected_language;
        }
        else if (preferredLanguage === "update"){
            console.log("autoIncrementalID", autoIncrementalID);
            // const detected_language = await new translateService().detectLanguage(message);
            const detected_language = await this.toDetectLangugaeOrNot(messageType, message);
            await chatSessionRepository.update({ preferredLanguage: detected_language }, { where: { autoIncrementalID: autoIncrementalID } } )
                .then(() => { console.log("updated lastMessageDate"); })
                .catch(error => console.log("error on update", error));
            return detected_language;
        }
        else {
            // const detected_language = await new translateService().detectLanguage(message);
            // if (detected_language !== preferredLanguage){
            //     return "change language";
            // }
            if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("TRANSLATE_SETTING")) {
                this.translateSetting = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TRANSLATE_SETTING");
            } else {
                this.translateSetting = 10;
            }

            if (message.length < this.translateSetting) {
                console.log('when preffered Language is not null');
                console.log('666', preferredLanguage);
                return preferredLanguage;
            }
            else {
                // const detected_language = await new translateService().detectLanguage(message);
                let detected_language = await this.toDetectLangugaeOrNot(messageType, message);
                if (messageType === "image") {
                    detected_language = preferredLanguage;
                }
                await chatSessionRepository.update({ preferredLanguage: detected_language, sessionOpen: "true" }, { where: { autoIncrementalID: autoIncrementalID } });
                return detected_language;
            }
        }
    }

    async getPreferredLanguageofSession(sessionId){
        return new Promise<string>(async(resolve) => {
            const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
            const userLanguageTableResponse = await chatSessionRepository.findAll({ where: { userPlatformID: sessionId } });
            //console.log("userLanguageTableResponse",userLanguageTableResponse);
            try {
                console.log(`Push notification language table response length ${userLanguageTableResponse.length}`);
                if (userLanguageTableResponse.length > 0 && userLanguageTableResponse[userLanguageTableResponse.length - 1].preferredLanguage !== null) {
                    if (userLanguageTableResponse[userLanguageTableResponse.length - 1].sessionOpen === "true") {
                        resolve(userLanguageTableResponse[userLanguageTableResponse.length - 1].preferredLanguage);
                    }
                    else {
                        console.log("session not open");
                        resolve("null");
                    }
                }
                else if (userLanguageTableResponse.length > 0 && userLanguageTableResponse[userLanguageTableResponse.length - 1].preferredLanguage === null) {
                    resolve("update");

                }
                else {
                    console.log("first entry");
                    resolve("null");
                }
            }
            catch (err){
                console.log("error",err);
            }
        });

    }

    async toDetectLangugaeOrNot(messageType, message) {
        // eslint-disable-next-line init-declarations
        let detected_language:string;
        if (messageType !== "location"){
            detected_language = await this._translateService.detectLanguage(message);
        }
        else {
            console.log("it was latlong");
            detected_language = "en";
        }
        return detected_language;
    }

    async updateUserPreferredLanguage (userPlatformId: string, languageCode: string) {
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        await chatSessionRepository.update({ preferredLanguage: languageCode }, {
            where : {
                userPlatformID : userPlatformId
            }
        });
    }

}
