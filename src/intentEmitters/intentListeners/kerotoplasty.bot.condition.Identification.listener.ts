import { sendExtraMessages } from "../../services/send.extra.messages.service";
import { Logger } from "../../common/logger";
import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { CacheMemory } from "../../services/cache.memory.service";

export const kerotoplastySymptomAnalysisListener = async (intent, eventObj) => {
    try {
        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        const dialogflowService: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
        const [symptoms, message, priority] =
            await kerotoplastyServiceObj.identifyCondition(eventObj) as [string[], any, number];
        
        let outputMessage = "To better understand your condition, we’ll ask you a few quick questions. This will help us guide you effectively.";
        if (priority === 1){
            outputMessage =  message;
        } else if (priority > 1 && intent === "symptomAnalysis") {

            // Format symptoms list naturally (comma + "and")

            const formattedSymptoms =
                    symptoms.length > 1
                        ? symptoms.slice(0, -1).join(", ") + " and " + symptoms.slice(-1)
                        : symptoms[0] || "";

            outputMessage = `Thanks for sharing your symptoms: *${formattedSymptoms}*`;

        } else {
            outputMessage = message;
        }
        if (priority !== 0){
            kerotoplastyServiceObj.postingOnClickup(intent, eventObj, priority);
            followUpStep(intent, eventObj, priority);
            
        }
        const data = await dialogflowService.making_response(outputMessage);
        return data;
    }
    catch (error: any) {
        Logger.instance()
            .log_error(error.message, 500, "kerotoplasty_bot_condition identification Listener Error!");
        throw new Error("Keratoplasty bot condition identification Listener Error");
    }
};

async function followUpStep(intent: string, eventObj: any, priority: number) {
    try {
        const sendExtraMessagesObj: sendExtraMessages = eventObj.container.resolve(sendExtraMessages);

        let inputMessage: string;
        let yesIntentName: string;
        let noIntentName: string;

        // Variables for cache
        const userPlatformId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const cacheKey = `SymptomsStorage:${userPlatformId}`;

        if (priority === 1 || intent === "MoreSymptoms" || intent === "KerotoplastyFollowUp") {
            inputMessage = "Would you be able to provide an *image of the affected area of your eye* for the doctor’s assessment?";
            yesIntentName = "EyeImage";
            noIntentName = "responseNo";

            // Delete the cache key as this is the final step
            await CacheMemory.delete(cacheKey);
        } else {
            inputMessage = `Could you let me know if you have any other symptoms?`;
            yesIntentName = "MoreSymptoms";
            noIntentName = "KerotoplastyFollowUp";
        }

        await sendExtraMessagesObj.sendSecondaryButtonMessage(
            inputMessage,
            yesIntentName,
            noIntentName,
            eventObj
        );

    } catch (error) {
        console.error("Error in followUpStep:", error);
        throw new Error("Keratoplasty next steps error");
    }
}
