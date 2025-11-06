import emojiRegex from 'emoji-regex';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';

@scoped(Lifecycle.ContainerScoped)
export class EmojiFilter{

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async checkForEmoji(message: string) {
        console.log("inside checkForEmoji",message);
        const regex = emojiRegex();
        let emojiObj;
        const emoji = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("EMOJI");
        if (emoji){
            emojiObj = JSON.parse(emoji);
        }
        else {
            emojiObj = JSON.parse(process.env.EMOJI);
        }
        const emojiObjKeys = Object.keys(emojiObj);

        // console.log("emojiKeys", emojiObjKeys);
        let filteredMessage: string = message;
        for (const match of message.matchAll(regex)) {
            const convertToUnicodeEmoji = await this.emojiUnicode(match[0]);
            console.log("convertToUnicodeEmoji", convertToUnicodeEmoji);
            if (convertToUnicodeEmoji !== undefined){
                if (emojiObjKeys.includes(convertToUnicodeEmoji)){
                    filteredMessage = emojiObj[convertToUnicodeEmoji];
                    console.log("filtered message", filteredMessage);
                    return filteredMessage;
                }
                else {
                    console.log("not registered emoji");
                    filteredMessage = message.replace(match[0]," ");
                    return filteredMessage;
                }
            }
            else {
                console.log("inside else");
                filteredMessage = message;
            }
        }
        console.log("filtered message last", filteredMessage);
        return filteredMessage;
    }

    emojiUnicode = async (emoji) => {
        // eslint-disable-next-line init-declarations
        let comp;
        if (emoji.length === 1) {
            comp = emoji.charCodeAt(0);
        }
        comp = (
            (emoji.charCodeAt(0) - 0xD800) * 0x400
            + (emoji.charCodeAt(1) - 0xDC00) + 0x10000
        );
        if (comp < 0) {
            comp = emoji.charCodeAt(0);
        }
        return comp.toString("16");
    };

}
