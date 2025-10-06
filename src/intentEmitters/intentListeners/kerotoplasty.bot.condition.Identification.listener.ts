import { sendExtraMessages } from "../../services/send.extra.messages.service";
import { Logger } from "../../common/logger";
import { kerotoplastyService } from "../../services/kerotoplasty.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";

export const kerotoplastySymptomAnalysisListener = async (intent, eventObj) => {
    try {
        const kerotoplastyServiceObj: kerotoplastyService = eventObj.container.resolve(kerotoplastyService);
        const dialogflowService: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
        const [symptoms, message, priority] =
            await kerotoplastyServiceObj.identifyCondition(eventObj) as [string[], any, number];
        
        kerotoplastyServiceObj.postingOnClickup(intent, eventObj, priority);
        let outputMessage = "To better understand your condition, we’ll ask you a few quick questions. This will help us guide you effectively.";
        if (priority <=1){
            outputMessage =  message;
        }
        else if (priority > 1 && intent === "symptomAnalysis") {
            // Format symptoms list naturally (comma + "and")

            const formattedSymptoms =
                    symptoms.length > 1
                        ? symptoms.slice(0, -1).join(", ") + " and " + symptoms.slice(-1)
                        : symptoms[0] || "";

            outputMessage = `Thanks for sharing your symptoms: *${formattedSymptoms}*`;

        }
        followUpStep(intent, symptoms, eventObj, priority, message);
        const data = await dialogflowService.making_response(outputMessage);
        return data;
    }
    catch (error: any) {
        Logger.instance()
            .log_error(error.message, 500, "kerotoplasty_bot_condition identification Listener Error!");
        throw new Error("Keratoplasty bot condition identification Listener Error");
    }
};

async function followUpStep(intent: string, symptoms: string[], eventObj: any, priority: number,message: string) {
    try {
        const sendExtraMessagesObj: sendExtraMessages = eventObj.container.resolve(sendExtraMessages);

        let inputMessage: string;
        let yesIntentName: string;
        let noIntentName: string;

        // Format symptoms list naturally (comma + "and")
        const formattedSymptoms =
            symptoms.length > 1
                ? symptoms.slice(0, -1).join(", ") + " and " + symptoms.slice(-1)
                : symptoms[0] || "";

        if (priority <= 1 || intent === "MoreSymptoms") {
            inputMessage = "Would you be able to provide an *image of the affected area of your eye* for the doctor’s assessment?";
            yesIntentName = "EyeImage";
            noIntentName = "responseNo";
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
