import { Lifecycle, scoped, inject } from 'tsyringe';
import dfff from '../libs/dialogflow-fulfillment';
import { CalorieInfo } from "../models/calorie.info.model";
import sequelize = require("sequelize");
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class GetCalorieReport {

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {}

    async getCalorieReport(req,res) {
        const userId = req.body.originalDetectIntentRequest.payload.userId;

        const agent = new dfff.WebhookClient({
            request  : req,
            response : res
        });
    
        console.log("TESTING");
        const intentMap = new Map();
        console.log('Hello');
        intentMap.set('calorie.report.creation', (agent) => this.createTable(agent,userId));
        return await agent.handleRequest(intentMap);
    }

    async createTable(agent,userId) {

        var today = new Date();
        var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate()-1);
        var last_week = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);
        var last_month = new Date(today.getFullYear(), today.getMonth()-1 , today.getDate());
        var three_month = new Date(today.getFullYear(), today.getMonth()-3, today.getDate());
        
        const yesterday_data = await this.getDataForReport(yesterday,today,userId);
        const week_data = await this.getDataForReport(last_week,today,userId);
        const month_data = await this.getDataForReport(last_month,today,userId);
        const three_month_data = await this.getDataForReport(three_month,today,userId);
    
        // For daily report
        const week_of_day = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];
        const meal_type = [
            "Breakfast",
            "Lunch",
            "Dinner",
            "Snacks",
            "Total"
        ];
    
        console.log("Daily Test");
        const daily_data = await this.getDailyDataForReport(userId);
    
        const DAYLENGTH = week_of_day.length;
        const DATELENGTH = meal_type.length;
        const table = new Array(DAYLENGTH + 1);
    
        for (let i = 0; i < table.length; i++) {
            table[i] = new Array(DATELENGTH + 1);
        }
    
        for (let i = 1; i < DATELENGTH + 1; i++ ) {
            table[0][i] = meal_type[i - 1];
        }
        for (let i = 1; i < DAYLENGTH + 1; i++) {
            table[i][0] = week_of_day[i - 1];
        }
    
        for (const daily of daily_data) {
            for ( let i = 1; i < DAYLENGTH + 1; i++) {
                var total = 0;
                if (daily.meal_type === meal_type[i - 1]) {
                    table[daily.daynumber][i] = parseInt(daily.total_calories);
                }
                let temp = 0;
                for (let j = 1; j < DATELENGTH + 1; j++){
                    temp++;
                    if (daily.meal_type === "NA" && daily.daynumber === i) {
                        table[daily.daynumber][DATELENGTH] = parseInt(daily.total_calories);
                    }
                    if (!table[i][j]) {
                        table[i][j] = 0;
                    }
                }
            }
        }
    
        for ( let i = 1; i < DAYLENGTH + 1; i++){
            var total = 0;
            for (let j = 1; j < DATELENGTH + 1; j++){
                if ( j < DATELENGTH ) {
                    total += table[i][j];
                } else {
                    table[i][j] += total;
                }
            }
        }
    
        let string = '<!DOCTYPE html>';
        string += '<html>';
        string += '<body style="width: 600px; height:800px; padding: 20px;">';
        string += '<style> table,th,td{border-collapse:collapse; border: 1px solid black;}';
        string += 'td {text-align: center;}</style>';
        string += '<div style="display: flex">';
        string += '<img src="{{imageSourceREAN}}" style="margin-top: -5px; width: 100px; height: 100px; margin-left: 40px; margin-right: 40px;">';
        string += '</div>';
        string += '<div style="display: flex;">';
        string += '<div align="center" style="width:100%;"> <p style="font-size:35px; padding-bottom:5px;"><span style="background-color:#b5f0b5;width: 100px;">Your Calorie Information</span></p> </div>';
        string += '</div>';
    
        string += '<div align="right" style="width:100%"> <p><span style="font-size:15px; padding-right:10px; padding-top:-15px;">N/A = Not Available</span></p></div>';
        string += '<div style="width:100%; padding-bottom:10px;">';
    
        string += '<table style="width:100%; border:1px solid; padding-bottom:10px;">';
            
        for ( let i=0; i < table.length; i++){
            string += '<tr>';
            for (let j = 0; j < table[0].length; j++){
                if (i===0 || j === 0){
                    string += '<td style="background-color:#cbc3e3; padding-left:2px;">';
                    string += '<span style="font-size: 20px;">';
                    if (!table[i][j]){
                        string += '<b>' + '' + '</b>';
                    } else {
                        string += '<b>' + table[i][j] + '</b>';
                    }
                    string += '</span></td>';
                } else {
                    string += '<td>';
                    string += table[i][j];
                    string += '</td>';
                }
            }
        }
        string += '</table></div>';
    
        string += '<div style="width:100%; padding-top:10px;">';
        string += '<table style="width:100%; border:1px solid; padding-top:10px;">';
        string += '<tr><span style="font-size: 20px"><td style="background-color:#E8E8E8; padding-left:2px"></td>';
        string += '<td style="background-color:#E8E8E8;">Yesterday</td>';
        string += '<td style="background-color:#E8E8E8;">Last Week</td>';
        string += '<td style="background-color:#E8E8E8;">Last Month</td>';
        string += '<td style="background-color:#E8E8E8;">Last 3 Months</td></span></tr>';
        string += '<tr><span style="font-size:16px;">';
        string += '<td> Calories (kcal) </td>';
        string += '<td>' + yesterday_data[0].get().total_calories + '</td>';
        string += '<td>' + week_data[0].get().total_calories + '</td>';
        string += '<td>' + month_data[0].get().total_calories + '</td>';
        string += '<td>' + three_month_data[0].get().total_calories + '</td>';
        string += '</span></tr>';
        string += '</table></div>';
        string = string + '</body>' + '</html>';
    
        // const table = await createTable();
        const payload = {
            "telegram" : {
                "text"       : string,
                "parse_mode" : "HTML"
            }
        };
    
        agent.add(new dfff.Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
        agent.add("Your calorie report.");
    }

    async getDataForReport(from_date,to_date,sessionId){
        // eslint-disable-next-line max-len
        const calorieInfoRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(CalorieInfo);
        const f_date = from_date.getFullYear() + '-' + (from_date.getMonth() + 1) + '-' + from_date.getDate();
        const t_date = to_date.getFullYear() + '-' + (to_date.getMonth() + 1) + '-' + to_date.getDate();
        const data = await calorieInfoRepository.findAll({
            attributes : [
                [sequelize.fn('SUM', sequelize.col('calories')), 'total_calories']
            ],
            where : sequelize.literal(`user_id = ${sessionId} AND record_date >= '${f_date} 00:00:00' AND record_date < '${t_date} 00:00:00'`)
        });
        if (!data[0].get().total_calories) {
            data[0].get().total_calories = "N/A";
        }
        return data;
    }

    async getDailyDataForReport(sessionId){
        // eslint-disable-next-line max-len
        const calorieInfoRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(CalorieInfo);
        const data = await calorieInfoRepository.findAll({
            attributes :[
                [sequelize.fn('SUM', sequelize.col('calories')), 'total_calories'],
                [sequelize.fn('DAYOFWEEK',sequelize.col('record_date')),'daynumber'],
                [sequelize.fn('WEEKOFYEAR',sequelize.col('record_date')),'weeknumber'],
                'meal_type',
            ],
            where : sequelize.literal(`user_id = ${sessionId} AND WEEKOFYEAR(record_date) = WEEKOFYEAR(NOW())`),
            group : ['daynumber','meal_type']
        }).then(data => {
            return JSON.parse(JSON.stringify(data));
        });
        return data;
    }
}
