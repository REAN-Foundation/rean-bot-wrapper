
export const sendTelegramButtonService = async (buttons) => {
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
                                values : [
                                    {
                                        structValue : {
                                            fields : {
                                                text : {
                                                    stringValue : buttons[0],
                                                    kind        : "stringValue",
                                                },
                                                callback_data : {
                                                    stringValue : buttons[1],
                                                    kind        : "stringValue",
                                                },
                                            },
                                        },
                                        kind : "structValue",
                                    },
                                    {
                                        structValue : {
                                            fields : {
                                                callback_data : {
                                                    stringValue : buttons[3],
                                                    kind        : "stringValue",
                                                },
                                                text : {
                                                    stringValue : buttons[2],
                                                    kind        : "stringValue",
                                                },
                                            },
                                        },
                                        kind : "structValue",
                                    },
                                ],
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
