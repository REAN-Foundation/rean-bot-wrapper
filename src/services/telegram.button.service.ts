export const sendTelegramButtonService = async (buttons) => {
    const objects = [];

    for (let i = 0; i < buttons.length; i += 2) {
        const buttonObject = {
            structValue: {
                fields: {
                    reply: {
                        structValue: {
                            fields: {
                                title: {
                                    stringValue: buttons[i],
                                    kind: "stringValue",
                                },
                                id: {
                                    stringValue: buttons[i + 1],
                                    kind: "stringValue",
                                },
                            },
                        },
                        kind: "structValue",
                    },
                },
            },
            kind: "structValue",
        };
        objects.push(buttonObject);
    }

    const payload = {
        fields: {
            messagetype: {
                stringValue: "interactive-buttons",
                kind: "stringValue",
            },
            buttons: {
                listValue: {
                    values: objects,
                },
                kind: "listValue",
            },
        },
    };

    return payload;

};

