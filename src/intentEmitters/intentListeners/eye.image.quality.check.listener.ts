/* eslint-disable max-len */
import { Logger } from '../../common/logger';
import { CallEyeImageQualityCheckModel } from '../../services/call.eye.image.quality.check';

// import { container } from 'tsyringe';

export const eyeImageQualityCheckListener = async (intent, eventObj) => {
    const callEyeImageQualityCheckModel: CallEyeImageQualityCheckModel = eventObj.container.resolve(CallEyeImageQualityCheckModel);
    try {
        Logger.instance()
            .log('Calling Eye Image Quality Check Service !!!!!!');
        


        const messageFromModel = callEyeImageQualityCheckModel.getEyeImageQualityCheckModelResponse(eventObj.body.queryResult.queryText,eventObj);
        console.log(messageFromModel);
        
        const data = {
            "fulfillmentMessages" : [
                {
                    "text" : {
                        "text" : [
                            "We are getting your result"
                        ]
                    }
                }
            ]
        };
        return data;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'eye Image Quality Check Listner Error!');
    }

};
