import { VerifyBridgeService } from "../../../services/bloodWrrior/verify.bridge.service";

export const VerifyBloodBridge = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        const verifyBridgeService: VerifyBridgeService = eventObj.container.resolve(VerifyBridgeService);
        try {
            let result = null;
            result = await verifyBridgeService.VerifyBridge(eventObj);
            console.log(result);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
