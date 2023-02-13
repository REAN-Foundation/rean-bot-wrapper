import { Iresponse } from "../refactor/interface/message.interface";

export const commonResponseMessageFormat = () => {
    const response_message: Iresponse = {
        name                : null,
        platform            : null,
        chat_message_id     : null,
        direction           : "Out",
        input_message       : null,
        message_type        : null,
        intent              : null,
        messageBody         : null,
        messageImageUrl     : null,
        messageImageCaption : null,
        sessionId           : null,
        messageText         : null
    };
    return response_message;
};