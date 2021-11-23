import emojiRegex = require('emoji-regex');

export class EmojiFilter{
    
    checkForEmoji = async (message) => {
        const regex = emojiRegex();
        let positiveEmoji: String[] = ['1f44d', '1f604', '1f601'];
        let negativeEmoji: String[] = ['1f44e', '1f621', '1f92c'];
        // let emoji: String[] = [];
        let UnicodeEmoji: String[] = [];
        for (const match of message.matchAll(regex)) {
            // emoji.push(match)
            let convertToUnicodeEmoji = await this.emojiUnicode(match[0]);
            UnicodeEmoji.push(convertToUnicodeEmoji);
            console.log("the emoji is ", UnicodeEmoji);
        }

        if (UnicodeEmoji !== null) {
            let missingPositive = positiveEmoji.filter(item => UnicodeEmoji.indexOf(item) < 0);
            console.log("missing positive", missingPositive);
            let missingnegative = negativeEmoji.filter(item => UnicodeEmoji.indexOf(item) < 0);
            console.log("missing negative", missingnegative);
            if (missingPositive.length <= (positiveEmoji.length - 1)) {
                message = "PositiveFeedback";
            }
            else {
                console.log("No positive emoji");
            }
            if (missingnegative.length <= (negativeEmoji.length - 1)) {
                message = "NegativeFeedback";
            }
            else {
                console.log("No negative emoji");
            }
        }
        else {
            message = message;
        }
        return message
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