import { createUserStat } from './statistics/UserStat.service';

export class WhatsappStatistics{
    
    saveRequestStatistics = async (req, message) => {
        const user_data = {
            name: req.body.contacts[0].profile.name,
            platform: "Whatsapp",
            contact: req.body.contacts[0].wa_id,
            chat_message_id: req.body.messages[0].id,
            direction: 'In',
            message_type: req.body.messages[0].type,
            message_content: message
        };
        createUserStat(user_data);
    }
    
    saveResponseStatistics(req, response, service_response, message, image_url = null) {
        response = JSON.parse(response)
        const user_data = {
            name: req.body.contacts[0].profile.name,
            platform: "Whatsapp",
            contact: req.body.contacts[0].wa_id,
            chat_message_id: response.messages[0].id,
            direction: 'Out',
            message_type: image_url ? "image" : "text",
            message_content: message,
            image_url: image_url,
            raw_response_object: service_response.result && service_response.result.fulfillmentMessages ? JSON.stringify(service_response.result.fulfillmentMessages) : '',
            intent: service_response.result && service_response.result.intent ? service_response.result.intent.displayName : ''
        };
        createUserStat(user_data);
    }

}

export class TelegramStatistics{
    saveRequestStatistics(req, message) {

        const user_data = {
            name: req.from.first_name + " "+ req.from.last_name,
            platform: "Telegram",
            contact: req.from.id,
            chat_message_id: req.message_id,
            direction: 'In',
            message_type: "text",
            message_content: message
        };
        createUserStat(user_data);
    }
    
    saveResponseStatistics(req, response, service_response, message, image_url = null) {
        const user_data = {
            name: req.from.first_name + " "+ req.from.last_name,
            platform: "Telegram",
            contact: req.from.id,
            chat_message_id: response.messages_id,
            direction: 'Out',
            message_type: image_url ? "image" : "text",
            message_content: message,
            image_url: image_url,
            raw_response_object: service_response.result && service_response.result.fulfillmentMessages ? JSON.stringify(service_response.result.fulfillmentMessages) : '',
            intent: service_response.result && service_response.result.intent ? service_response.result.intent.displayName : ''
        };
        createUserStat(user_data);
    }
}