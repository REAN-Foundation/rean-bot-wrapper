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

export const sendApiButtonService = async (buttons) => {
    const payload = {
        "fields" : {
            "buttons" : {
                "listValue" : {
                    "values" : [
                        {
                            "structValue" : {
                                "fields" : {
                                    "type" : {
                                        "stringValue" : "reply",
                                        "kind"        : "stringValue"
                                    },
                                    "reply" : {
                                        "structValue" : {
                                            "fields" : {
                                                "id" : {
                                                    "stringValue" : buttons[1],
                                                    "kind"        : "stringValue"
                                                },
                                                "title" : {
                                                    "stringValue" : buttons[0],
                                                    "kind"        : "stringValue"
                                                }
                                            }
                                        },
                                        "kind" : "structValue"
                                    }
                                }
                            },
                            "kind" : "structValue"
                        },
                        {
                            "structValue" : {
                                "fields" : {
                                    "reply" : {
                                        "structValue" : {
                                            "fields" : {
                                                "title" : {
                                                    "stringValue" : buttons[2],
                                                    "kind"        : "stringValue"
                                                },
                                                "id" : {
                                                    "stringValue" : buttons[3],
                                                    "kind"        : "stringValue"
                                                }
                                            }
                                        },
                                        "kind" : "structValue"
                                    },
                                    "type" : {
                                        "stringValue" : "reply",
                                        "kind"        : "stringValue"
                                    }
                                }
                            },
                            "kind" : "structValue"
                        }
                    ]
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

export const templateButtonService = async (buttonId) => {
    const payloadButtons = [
        {
            "type"       : "button",
            "sub_type"   : "quick_reply",
            "index"      : "0",
            "parameters" : [
                {
                    "type"    : "payload",
                    "payload" : buttonId[0]
    
                }
            ]
        },
        {
            "type"       : "button",
            "sub_type"   : "quick_reply",
            "index"      : "1",
            "parameters" : [
                {
                    "type"    : "payload",
                    "payload" : buttonId[1]
                }
            ]
        }
    ];

    return payloadButtons;
};
