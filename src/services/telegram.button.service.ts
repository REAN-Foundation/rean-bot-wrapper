
export const sendTelegramButtonService = async (buttons) => {
    const objects = [];
    for (let i = 0; i < buttons.length; i += 2) {
        const buttonObject = {
            structValue : {
                fields : {
                    text : {
                        stringValue : buttons[i],
                        kind: "stringValue",
                    },
                    callback_data : {
                        stringValue : buttons[i + 1],
                        kind : "stringValue",
                    },
                },
            },
            kind : "structValue",
        };
        objects.push(buttonObject);
    }
    const payload =  {
        fields : {
            messagetype : {
                stringValue : "interactive-buttons",
                kind        : "stringValue",
            },
            buttons : {
                listValue : {
                    values : [
                        {
                            listValue : {
                                values : objects,
                            },
                            kind : "listValue",
                        }
                    ]
                },
                kind : "listValue",
            },
        },
    };

    return payload;

};

