import { BloodBridgeStatusService } from "../../../services/bloodWrrior/blood.bridge.status.service";

export const BloodBridgeStatusListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const bloodBridgeStatusService: BloodBridgeStatusService = eventObj.container.resolve(BloodBridgeStatusService);
    try {
        let result = null;
        result = await bloodBridgeStatusService.bloodBridgeStatus(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
