export interface requestStatistics{
    name : string;
    platform : string;
    contact : string;
    chat_message_id : string;
    direction : string;
    message_type : string;
    message_content : string;
}

export interface responseStatistics{
    name : string;
    platform : string;
    contact : string;
    chat_message_id : string;
    direction : string;
    message_type : string;
    message_content : string;
    image_url : string;
    raw_response_object : string;
    intent : string;
}

export interface saveStatisticsInterface{
    saveRequestStatistics(req, message);
    saveResponseStatistics(req, response, service_response, message, image_url);
}
