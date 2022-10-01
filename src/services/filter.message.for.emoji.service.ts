import emojiRegex from 'emoji-regex';

export class EmojiFilter{

    async checkForEmoji (message) {
        console.log("inside checkForEmoji",message);
        const regex = emojiRegex();
        const positiveEmoji: string[] = ['1f44d', '1f604', '1f601'];
        const negativeEmoji: string[] = ['1f44e', '1f621', '1f92c'];

        // let UnicodeEmoji: String[] = [];
        let filteredMessage: string = message;
        for (const match of message.matchAll(regex)) {
            const convertToUnicodeEmoji = await this.emojiUnicode(match[0]);
            if (convertToUnicodeEmoji !== undefined){
                if (positiveEmoji.includes(convertToUnicodeEmoji)){
                    filteredMessage = "PositiveFeedback";
                }
                else if (negativeEmoji.includes(convertToUnicodeEmoji)){
                    filteredMessage = "NegativeFeedback";
                }
                else {
                    console.log("Emoji not present in either of the list!!!");
                }
            }
            else {
                console.log("inside else");
                filteredMessage = message;
            }
        }

        // ------------ block for future, if consider more than 1 emoji in the message -------///
        // if (UnicodeEmoji !== null) {
        //     let missingPositive = positiveEmoji.filter(item => UnicodeEmoji.indexOf(item) < 0);
        //     console.log("missing positive", missingPositive);
        //     let missingnegative = negativeEmoji.filter(item => UnicodeEmoji.indexOf(item) < 0);
        //     console.log("missing negative", missingnegative);
        //     if (missingPositive.length <= (positiveEmoji.length - 1)) {
        //         filteredMessage = "PositiveFeedback";
        //     }
        //     else {
        //         console.log("No positive emoji");
        //     }
        //     if (missingnegative.length <= (negativeEmoji.length - 1)) {
        //         filteredMessage = "NegativeFeedback";
        //     }
        //     else {
        //         console.log("No negative emoji");
        //     }
        // }
        // else {
        //     console.log("inside else")
        //     filteredMessage = message;
        // }
        //----------------xxxxx--------------------------//
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
