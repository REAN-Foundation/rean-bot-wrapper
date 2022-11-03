import dfff from '../libs/dialogflow-fulfillment';
import { CalorieInfo } from "../models/calorie.info.model";
import { SequelizeClient } from '../connection/sequelizeClient';
import sequelize = require("sequelize");
import { Op } from "sequelize";

export const getCalorieReport = async (req,res) => {

    const userId = req.body.originalDetectIntentRequest.payload.userId;

    const agent = new dfff.WebhookClient({
        request  : req,
        response : res
    });

    async function createTable(agent) {

        var today = new Date();
        var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate()-1);
        var last_week = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);
        var last_month = new Date(today.getFullYear(), today.getMonth()-1 , today.getDate());
        var three_month = new Date(today.getFullYear(), today.getMonth()-3, today.getDate());
    
        const yesterday_data = await getDataForReport(yesterday,today,userId);
        const week_data = await getDataForReport(last_week,today,userId);
        const month_data = await getDataForReport(last_month,today,userId);
        const three_month_data = await getDataForReport(three_month,today,userId);

        let string = '<!DOCTYPE html>';
        string += '<html>';
        string += '<body style="width: 600px; height:300px; padding: 20px;">';
        string += '<style> table,th,td{border-collapse:collapse;}';
        string += 'td {text-align: center;}</style>';
        string += '<div style="display: flex">';
        string += '<img src="{{imageSourceREAN}}" style="margin-top: -5px; width: 100px; height: 100px; margin-left: 40px; margin-right: 40px;">';
        string += '</div>';
        string += '<div style="display: flex;">';
        string += '<div align="center" style="width:100%;"> <p style="font-size:35px; padding-bottom:5px;"><span style="background-color:#b5f0b5;width: 100px;">Your Calorie Information</span></p> </div>';
        string += '</div>';

        string += '<div align="right" style="width:100%"> <p><span style="font-size:15px; padding-right:10px; padding-top:-15px;">N/A = Not Available</span></p></div>';
        string += '<div style="width:100%">';
        string += '<table style="width:100%; border:1px solid;">';
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
        string += '</table>';
        string = string + '</body>' + '</html>';

        console.log(string);

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

    async function getDataForReport(from_date,to_date,sessionId){
        const data = await CalorieInfo.findAll({
            attributes : [
                [sequelize.fn('SUM', sequelize.col('calories')), 'total_calories']
            ],
            where : {
                user_id   : sessionId,
                createdAt : {
                    [Op.between] : [from_date.toISOString(), to_date.toISOString()]
                }
            }
        });
        if (!data[0].get().total_calories) {
            data[0].get().total_calories = "N/A";
        }
        return data;
    }

    console.log("TESTING");
    const intentMap = new Map();
    console.log('Hello');
    intentMap.set('calorie.report.creation', createTable);
    return await agent.handleRequest(intentMap);
};