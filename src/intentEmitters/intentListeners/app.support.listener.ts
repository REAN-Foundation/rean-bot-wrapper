import { BloodGlucoseService } from "../../services/biometrics/blood.glucose.service";
import { BloodPressureService } from "../../services/biometrics/blood.pressure.service";
import { BloodOxygenSaturationService } from "../../services/biometrics/blood.oxygen.saturation.service";
import { BodyHeightService } from "../../services/biometrics/body.height.service";
import { BodyTemperatureService } from "../../services/biometrics/body.temperature.service";
import { BodyWeightService } from "../../services/biometrics/body.weight.service";
import { PulseService } from "../../services/biometrics/pulse.service";

export class AppSupportListener {

    public static handleIntent = async (intent, eventObj) => {
        var response = null;
        
        try {
            switch (intent) {
            case 'BloodGlucose.update': {
                const bloodGlucoseService = eventObj.container.resolve(BloodGlucoseService);
                response = await bloodGlucoseService.updateBloodGlucoseInfoService(eventObj);
                break;
            }
            case 'BloodGlucose.AskCreate':
            case 'BloodGlucose.Create': {
                const bloodGlucoseService = eventObj.container.resolve(BloodGlucoseService);
                response = await bloodGlucoseService.createBloodGlucoseInfoService(eventObj);
                break;
            }
            case 'BloodPressure.update': {
                const bloodPressureService = eventObj.container.resolve(BloodPressureService);
                response = await bloodPressureService.updateBloodPressureInfoService(eventObj);
                break;
            }
            case 'BloodPressure.AskCreate':
            case 'BloodPressure.Create': {
                const bloodPressureService = eventObj.container.resolve(BloodPressureService);
                response = await bloodPressureService.createBloodPressureInfoService(eventObj);
                break;
            }
            case 'BloodOxygenSaturation.update': {
                const bloodOxygenSaturationService = eventObj.container.resolve(BloodOxygenSaturationService);
                response = await bloodOxygenSaturationService.updateBloodOxygenSaturationInfoService(eventObj);
                break;
            }
            case 'BloodOxygenSaturation.AskCreate':
            case 'BloodOxygenSaturation.Create': {
                const bloodOxygenSaturationService = eventObj.container.resolve(BloodOxygenSaturationService);
                response = await bloodOxygenSaturationService.createBloodOxygenSaturationInfoService(eventObj);
                break;
            }
            case 'BodyHeight.update': {
                const bodyHeightService = eventObj.container.resolve(BodyHeightService);
                response = await bodyHeightService.updateBodyHeightInfoService(eventObj);
                break;
            }
            case 'BodyHeight.AskCreate':
            case 'BodyHeight.Create': {
                const bodyHeightService = eventObj.container.resolve(BodyHeightService);
                response = await bodyHeightService.createBodyHeightInfoService(eventObj);
                break;
            }
            case 'Weight.update': {
                const bodyWeightService = eventObj.container.resolve(BodyWeightService);
                response = await bodyWeightService.updateBodyWeightInfoService(eventObj);
                break;
            }
            case 'Weight.AskCreate':
            case 'Weight.Create': {
                const bodyWeightService = eventObj.container.resolve(BodyWeightService);
                response = await bodyWeightService.createBodyWeightInfoService(eventObj);
                break;
            }
            case 'BodyTemperature.update': {
                const bodyTemperatureService = eventObj.container.resolve(BodyTemperatureService);
                response = await bodyTemperatureService.updateBodyTemperatureInfoService(eventObj);
                break;
            }
            case 'BodyTemperature.AskCreate':
            case 'BodyTemperature.Create': {
                const bodyTemperatureService = eventObj.container.resolve(BodyTemperatureService);
                response = await bodyTemperatureService.createBodyTemperatureInfoService(eventObj);
                break;
            }
            case 'Pulse.update': {
                const pulseService = eventObj.container.resolve(PulseService);
                response = await pulseService.updatePulseInfoService(eventObj);
                break;
            }
            case 'Pulse.AskCreate':
            case 'Pulse.Create': {
                const pulseService = eventObj.container.resolve(PulseService);
                response = await pulseService.createPulseInfoService(eventObj);
                break;
            }
            
            }
            if (!response) {
                throw new Error('Biometrics Info Listener Error!');
            }
            return response.message;
        } catch (error) {
            throw new Error(`Handle biometrics intent ${error}`);
        }

    };

}
