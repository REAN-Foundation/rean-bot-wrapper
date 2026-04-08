/* eslint-disable max-len */
import { Logger } from '../../common/logger';
import { AnemiaModelCommunication } from '../../services/anemia.service';
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';

export const getAnemiaSegmentationResult = async (intent, eventObj) => {
    
    try {
        const dialogflowService: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
        Logger.instance()
            .log('Calling Eye Image Quality Check Service !!!!!!');
        const AnemiaModelObj: AnemiaModelCommunication = eventObj.container.resolve(AnemiaModelCommunication);
        AnemiaModelObj.Segmentation(eventObj);
        const response = await dialogflowService.making_response("GettingSegmentatedImage");
        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'eye Image Quality Check Listner Error!');
    }

};
