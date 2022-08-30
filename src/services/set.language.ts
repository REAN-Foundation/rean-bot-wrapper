/* eslint-disable max-len */
import { ChatSession } from '../models/chat.session';
import { translateService } from './translate.service';

export class UserLanguage {

    async setLanguageForSession(sessionId, message) {
        const preferredLanguage = await this.getPreferredLanguageofSession(sessionId);
        console.log("preferredLanguage",preferredLanguage);
        if (preferredLanguage === "null"){
            console.log('Will create a session if it is the first entry in the chat session or if session is not open');
            const detected_language = await new translateService().detectLanguage(message);
            const setUserLanguage = new ChatSession({ userPlatformID: sessionId, preferredLanguage: detected_language, sessionOpen: "true" });
            await setUserLanguage.save();
            return detected_language;
        }
        else {
            // const detected_language = await new translateService().detectLanguage(message);
            // if (detected_language !== preferredLanguage){
            //     return "change language";
            // }
            if (message.length < 5) {
                console.log('when preffered Language is not null');
                console.log('666', preferredLanguage);
                return preferredLanguage;
            }
            else {
                const detected_language = await new translateService().detectLanguage(message);
                const setUserLanguage = new ChatSession({ userPlatformID: sessionId, preferredLanguage: detected_language, sessionOpen: "true" });
                await setUserLanguage.save();
                return detected_language;
            }
        }
    }

    async getPreferredLanguageofSession(sessionId){
        return new Promise<string>(async(resolve) => {
            const userLanguageTableResponse = await ChatSession.findAll({ where: { userPlatformID: sessionId } });
            try {
                if (userLanguageTableResponse.length > 0 && userLanguageTableResponse[userLanguageTableResponse.length - 1].preferredLanguage !== null) {
                    if (userLanguageTableResponse[userLanguageTableResponse.length - 1].sessionOpen === "true") {
                        resolve(userLanguageTableResponse[userLanguageTableResponse.length - 1].preferredLanguage);
                    }
                    else {
                        console.log("session not open");
                        resolve("null");
                    }
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

}
