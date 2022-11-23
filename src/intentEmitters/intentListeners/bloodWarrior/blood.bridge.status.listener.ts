import { BloodBridgeStatusService } from "../../../services/bloodWrrior/blood.bridge.status.service";
const bloodBridgeStatusService: BloodBridgeStatusService  = new BloodBridgeStatusService;

export const BloodBridgeStatusListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await bloodBridgeStatusService.bloodBridgeStatus(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
