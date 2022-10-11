export const whatsappMetaButtonService = async (button_1, buttonId_1, button_2, buttonId_2) => {
    const payloadButtons = {
        "payload" : {
            "messagetype" : "interactive-buttons",
            "buttons"     : [
                {
                    "reply" : {
                        "title" : button_1,
                        "id"    : buttonId_1
                    },
                    "type" : "reply"
                },
                {
                    "type"  : "reply",
                    "reply" : {
                        "title" : button_2,
                        "id"    : buttonId_2
                    }
                }
            ]
        }
    };

    return payloadButtons;
};
