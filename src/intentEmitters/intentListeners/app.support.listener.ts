import { createBloodGlucoseInfoService, updateBloodGlucoseInfoService } from "../../services/biometrics/blood.glucose.service";
import { createBloodPressureInfoService, updateBloodPressureInfoService } from "../../services/biometrics/blood.pressure.service";
import { createBloodOxygenSaturationInfoService, updateBloodOxygenSaturationInfoService } from "../../services/biometrics/blood.oxygen.saturation.service";
import { createBodyHeightInfoService, updateBodyHeightInfoService } from "../../services/biometrics/body.height.service";
import { createBodyTemperatureInfoService, updateBodyTemperatureInfoService } from "../../services/biometrics/body.temperature.service";
import { createBodyWeightInfoService, updateBodyWeightInfoService } from "../../services/biometrics/body.weight.service";
import { createPulseInfoService, updatePulseInfoService } from "../../services/biometrics/pulse.service";

export class AppSupportListener {

    public static handleIntent = async (intent, eventObj) => {
        var response = null;
        try {
            switch (intent) {
            case 'BloodGlucose.update': {
                response = await updateBloodGlucoseInfoService(eventObj);
                break;
            }
            case 'BloodGlucose.Create': {
                response = await createBloodGlucoseInfoService(eventObj);
                break;
            }
            case 'BloodPressure.update': {
                response = await updateBloodPressureInfoService(eventObj);
                break;
            }
            case 'BloodPressure.Create': {
                response = await createBloodPressureInfoService(eventObj);
                break;
            }
            case 'BloodOxygenSaturation.update': {
                response = await updateBloodOxygenSaturationInfoService(eventObj);
                break;
            }
            case 'BloodOxygenSaturation.Create': {
                response = await createBloodOxygenSaturationInfoService(eventObj);
                break;
            }
            case 'BodyHeight.update': {
                response = await updateBodyHeightInfoService(eventObj);
                break;
            }
            case 'BodyHeight.Create': {
                response = await createBodyHeightInfoService(eventObj);
                break;
            }
            case 'BodyWeight.update': {
                response = await updateBodyWeightInfoService(eventObj);
                break;
            }
            case 'BodyWeight.Create': {
                response = await createBodyWeightInfoService(eventObj);
                break;
            }
            case 'BodyTemperature.update': {
                response = await updateBodyTemperatureInfoService(eventObj);
                break;
            }
            case 'BodyTemperature.Create': {
                response = await createBodyTemperatureInfoService(eventObj);
                break;
            }
            case 'Pulse.update': {
                response = await updatePulseInfoService(eventObj);
                break;
            }
            case 'Pulse.Create': {
                response = await createPulseInfoService(eventObj);
                break;
            }
            
            }
            if (!response) {
                throw new Error('Biometrics Info Listener Error!');
            }
            return response;
        } catch (error) {
            throw new Error('Handle Intent Error!');
        }

    }

}
