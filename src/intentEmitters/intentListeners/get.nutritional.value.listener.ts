
import { Logger } from '../../common/logger';
import { NutritionalValue } from '../../services/get.nutritional.value.service'

export const GetNutritionalValue = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('GetNutritionalValue Listener !!!!!');
        const nutritionalValue = eventObj.container.resolve(NutritionalValue);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const getNutritionalValue = nutritionalValue.getNutritionalValue(eventObj);
        const data = {
            "fulfillmentMessages" : [
                {
                    "text" : {
                        "text" : [
                            "Please give us a moment"
                        ]
                    }
                }
            ]
        };
        return data;
        
    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'GetNutritionalValue Listener Error!');
        throw new Error("GetNutritionalValue listener error");
    }

};
