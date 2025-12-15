import { CareplanIntentMetadata } from "../../domain.types/basic.careplan/careplan.types";

export class PlatformMessageService {

    static buildPlatformMessage = (
        userId: string,
        channel: string,
        metadata: CareplanIntentMetadata
    ) => {
        const type = metadata.MessageType;
        const buttons = metadata.Buttons;
 
        switch (type) {
 
        case "text":
            return {
                userId,
                channel,
                agentName : "Reancare",
                provider  : "default",
                type      : "text",
                message   : metadata.Message,
                payload   : { Language: "en" }
            };
 
        case "interactivebuttons":
            // eslint-disable-next-line no-case-declarations
            const payload = [];
            buttons.forEach(b => payload.push(b.Title, b.id));
 
            return {
                userId,
                channel,
                agentName : "Reancare",
                provider  : "default",
                type      : "interactivebuttons",
                message   : [metadata.Message],
                payload   : payload
            };
 
        case "inline_keyboard":
            // eslint-disable-next-line no-case-declarations
            const telegramPayload = [];
            buttons.forEach(b => telegramPayload.push(b.Title, b.id));
 
            return {
                userId,
                channel,
                agentName : "Reancare",
                provider  : "default",
                type      : "inline_keyboard",
                message   : metadata.Message,
                payload   : telegramPayload
            };
 
        case "template":
            return {
                userId,
                channel,
                agentName    : "Reancare",
                provider     : "default",
                type         : "template",
                templateName : metadata.TemplateName,
                message      : JSON.stringify({
                    ButtonsIds : buttons.map(b => b.id),
                    Variables  : metadata.Variables ?? {}
                }),
                payload : { Language: "en" }
            };
 
        default:
            throw new Error(`Unsupported message type: ${type}`);
        }

    }

}
