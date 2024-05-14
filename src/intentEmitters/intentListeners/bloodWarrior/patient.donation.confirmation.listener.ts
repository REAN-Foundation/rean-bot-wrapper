import { scoped, Lifecycle } from 'tsyringe';
import { Logger } from '../../../common/logger';
import { dialoflowMessageFormatting } from '../../../services/Dialogflow.service';

@scoped(Lifecycle.ContainerScoped)
export class PatientDonationConfirmationListener {

    public static yesReply = async (intentName, eventObj) => {
        try {
            const dialoflowFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
            return await dialoflowFormatting.triggerIntent("Change_TF_Date",eventObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Trigger intent yes error');
        }
    };

    public static noReply = async (intentName, eventObj) => {
        try {
            const dialoflowFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
            return await dialoflowFormatting.triggerIntent("Need_Blood",eventObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Trigger intent no error');
        }
    };
}
