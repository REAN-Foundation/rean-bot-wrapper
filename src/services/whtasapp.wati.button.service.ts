export const sendWhatsappWatiButtonService = async(buttons) => {
    const objects = [];
    for (let i = 0; i < buttons.length; i+=2) {
        const buttonObject = {
            structValue : {
                fields : {
                    "type" : {
                        "stringValue" : "reply",
                        "kind"        : "stringValue"
                    },
                    "reply" : {
                        "structValue" : {
                            "fields" : {
                                "id" : {
                                    "stringValue" : buttons[i+1],
                                    "kind"        : "stringValue"
                                },
                                "title" : {
                                    "stringValue" : buttons[i],
                                    "kind"        : "stringValue"
                                }
                            }
                        },
                        "kind" : "structValue"
                    }
                }
            },
            kind : "structValue"
        };
        objects.push(buttonObject);
    }
    const payload = {
        "fields" : {
            "buttons" : {
                "listValue" : {
                    "values" : objects,
                },
                "kind" : "listValue"
            },
            "messagetype" : {
                "stringValue" : "interactive-buttons",
                "kind"        : "stringValue"
            }
        }
    };
    return payload;
};