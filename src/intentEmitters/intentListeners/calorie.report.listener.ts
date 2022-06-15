import { Logger } from "../../common/logger";
import { getCalorieReport } from "../../services/calorie.report.service";

export const calorieReport = async ( intent,eventObj ) => {
    return new Promise(async (resolve,reject) => {
        try {
            Logger.instance()
                .log("Calorie report creation");
            
            let res;

            const user_data = await getCalorieReport(eventObj,res);

            resolve(user_data);
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Calorie report creation listener error');
        }
    });
};