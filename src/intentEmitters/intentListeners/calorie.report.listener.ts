import { Logger } from "../../common/logger";
import { GetCalorieReport } from "../../services/calorie.report.service";

export const calorieReport = async ( intent,eventObj ) => {
    const getCalorieReport:GetCalorieReport = eventObj.container.resolve(GetCalorieReport);
    try {
        Logger.instance()
            .log("Calorie report creation");
        
        let res;
        const user_data = await getCalorieReport.getCalorieReport(eventObj,res);

        return user_data;
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Calorie report creation listener error');
        throw new Error("Calorie report listener error");
    }
};
