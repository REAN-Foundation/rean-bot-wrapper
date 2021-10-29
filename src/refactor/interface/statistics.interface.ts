export interface requestStatistics{
    name : String;
    platform : String;
    contact : String;
    chat_message_id : String;
    direction : String;
    message_type : String;
    message_content : String;
}

export interface responseStatistics{
    name : String;
    platform : String;
    contact : String;
    chat_message_id : String;
    direction : String;
    message_type : String;
    message_content : String;
    image_url : String;
    raw_response_object : String;
    intent : String;
}

export interface saveStatisticsInterface{
    saveRequestStatistics(req, message);
    saveResponseStatistics(req, response, service_response, message, image_url);
}