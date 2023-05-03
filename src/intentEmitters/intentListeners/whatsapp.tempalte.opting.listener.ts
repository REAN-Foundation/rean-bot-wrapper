import { Logger } from '../../common/logger';
import { WhatsAppOptingOption } from '../../services/template.opting.option';

export const WhatsAppTemplateOpting = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log(`${intent} Intent!!!`);

        let response = null;
        const optingOption : WhatsAppOptingOption = eventObj.container.resolve(WhatsAppOptingOption);
        response = await optingOption.whatsAppOptingOptions(eventObj.body, intent);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error("Whatsapp opting option service failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, `${intent} Intent Error!`);
        throw new Error("Whatsapp template option listener error");
    }
};
