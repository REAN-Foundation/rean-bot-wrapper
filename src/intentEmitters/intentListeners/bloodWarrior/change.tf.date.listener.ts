import { ChangeTransfusionDateService } from "../../../services/bloodWrrior/chnage.transfusion.date.service";

export const ChangeTransfusionDate = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const changeTransfusionDateService: ChangeTransfusionDateService = eventObj.container.resolve(ChangeTransfusionDateService);
    try {
        let result = null;
        result = await changeTransfusionDateService.ChangeTransfusionDate(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
