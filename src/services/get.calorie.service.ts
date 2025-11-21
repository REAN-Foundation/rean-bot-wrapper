import { Lifecycle, inject, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { CalorieInfo } from "../models/calorie.info.model";
import { CalorieDatabase } from "../models/calorie.db.model";
import requestCalorie from 'request';
import { EntityManagerProvider } from "./entity.manager.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class GetCalories {

    // eslint-disable-next-line max-len
    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) {}

    async getCalorieData(req,queryText,payload){

        try {
            const request = req;
            var serving_data = {};
            let value = 1;
            var date_update = new Date().toISOString().slice(0, 19).replace('T', ' ');
            console.log("We are here in the get Calorie data of the things");

            // eslint-disable-next-line init-declarations
            let meal_type:string;

            if (req.meal_type){
                meal_type = req.meal_type;
            } else {
                meal_type = "NA";
            }
            if (req.date){
                date_update = new Date(req.date).toISOString().slice(0,19).replace('T',' ');
            }

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const access_data = await this.main();
            const access_token2 = JSON.stringify(access_data);
            const response_data = JSON.parse(access_token2);

            const access_token = response_data.body.access_token;

            const query_result = request;
            const meta_data = [];

            const food_names = [];
            const calories_array = [];
            const reply_text = [];

            const calorieUser = {
                user_id      : payload.userId,
                user_message : queryText,
            };
            // eslint-disable-next-line max-len
            const calorieInfoRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironment)).getRepository(CalorieInfo);
            const calorie_user_saved = await calorieInfoRepository.create(calorieUser);
            const table_id = calorie_user_saved.autoIncrementalID;

            for (const foodName of query_result.food){
                const search_term = {
                    'name' : foodName.food_name.name,
                };
                food_names.push(search_term);
                const food_search = JSON.parse(JSON.stringify(await this.mainSearch(access_token,search_term.name)));

                // For future purpose
                // if (!filesystem.existsSync(`calorieMetaData/${search_term.name}.json`)){
                // eslint-disable-next-line max-len
                //     filesystem.writeFile(`calorieMetaData/${search_term.name}.json`, JSON.stringify(food_search), err => {
                //         if (err) throw err;
                //         console.log(`${search_term.name} saved to json`);
                //     });
                // }

                const food_body = JSON.parse(food_search.body);
                const food_id = food_body.foods.food[0].food_id;
                console.log("The food id is" + food_id);
                const food_details = JSON.parse(JSON.stringify(await this.mainGetFood(access_token,food_id)));
                const food = JSON.parse(food_details.body);
                const servings = food.food.servings;

                if (!foodName.value && !foodName.unit) {
                    console.log("No quantity has been defined");
                    let calories = '0';
                    let food_description = '';
                    if (servings.serving.serving_description){
                        food_description = servings.serving.serving_description;
                        calories = servings.serving.calories;
                        serving_data = servings.serving;
                    } else {
                        food_description = servings.serving[0].serving_description;
                        calories = servings.serving[0].calories;
                        serving_data = servings.serving[0];
                        console.log("Many servings");
                    }
                    calories_array.push(parseInt(calories));
                    const temp = {
                        'food_name' : search_term.name,
                        'calories'  : parseInt(calories),
                        'data'      : serving_data,
                    };
                    // eslint-disable-next-line max-len
                    await this.saveToDB(table_id,search_term.name,food.food.food_name,calories,value,serving_data);
                    meta_data.push(temp);
                    const reply = `${search_term.name.toLowerCase()} ${food_description.toLowerCase()} is ${parseInt(calories)} calories`;
                    reply_text.push(reply);
                } else if (!foodName.unit && foodName.value){
                    value = parseInt(foodName.value);
                    console.log("Quantity has been defined");
                    let calories = '0';
                    let food_description = '';
                    if (servings.serving.serving_description){
                        food_description = servings.serving.serving_description;
                        calories = servings.serving.calories;
                        serving_data = servings.serving;
                        console.log("Only 1 serving");
                    } else {
                        food_description = servings.serving[0].serving_description;
                        calories = servings.serving[0].calories;
                        serving_data = servings.serving[0];
                        console.log("Many servings");
                    }
                    calories_array.push(parseInt(calories) * parseInt(foodName.value));
                    const temp = {
                        'food_name' : search_term.name,
                        'calories'  : parseInt(calories),
                        'data'      : serving_data,
                    };
                    // eslint-disable-next-line max-len
                    await this.saveToDB(table_id,search_term.name,food.food.food_name,calories,value,serving_data);
                    meta_data.push(temp);
                    const reply = `${search_term.name.toLowerCase()} ${food_description.toLowerCase()} is ${parseInt(calories)} calories`;
                    reply_text.push(reply);

                } else {
                    console.log("Here in else of unit");

                    const matched_serving = await this.getUnitData(servings.serving,foodName.unit);
                    let match = {
                        "calories"            : "0",
                        "serving_description" : 'Item not found!',
                        "number_of_units"     : "1",
                    };
                    console.log(typeof(matched_serving));
                    if (matched_serving.calories === "0"){
                        match = servings.serving[0];
                    } else {
                        match = matched_serving;

                    }
                    serving_data = match;
                    const volumes = ["ml","g","kg"];

                    const calories = match.calories;
                    var temp_cal = 0;
                    if (!foodName.value){
                        calories_array.push(parseInt(calories));
                        temp_cal = parseInt(calories);
                    } else {
                        value = parseInt(foodName.value);
                        if (volumes.includes(foodName.unit)) {
                            const unit_volume = parseInt(calories)/parseInt(match.number_of_units);
                            const per_volume_cal = (unit_volume * foodName.value).toFixed(1);
                            calories_array.push(parseInt(per_volume_cal));
                            temp_cal = parseInt(per_volume_cal);
                        } else {
                            calories_array.push(parseInt(calories) * foodName.value);
                            temp_cal = parseInt(calories) * foodName.value;
                        }
                    }
                    const temp = {
                        'food_name' : search_term.name,
                        'calories'  : temp_cal,
                        'data'      : serving_data
                    };
                    // eslint-disable-next-line max-len
                    await this.saveToDB(table_id,search_term.name,food.food.food_name,calories,value,serving_data);
                    meta_data.push(temp);
                    const reply = `${search_term.name.toLowerCase()} ${match.serving_description} is ${calories} calories`;
                    reply_text.push(reply);

                }

            }

            const total_calories = calories_array.reduce((a,b) => a + b);

            const text = 'The calorie content for ' +  reply_text.join(',') + '. Your total calorie intake based on the provided food items  and quantity is ' + total_calories + ' kcal (estimated).';
            const findit = await calorieInfoRepository.findOne(
                {
                    where : {
                        autoIncrementalID : table_id
                    },
                }).then(function (record) {
                return record.update({
                    fs_message    : text,
                    units         : null,
                    calories      : parseInt(total_calories),
                    user_calories : parseInt(total_calories),
                    meal_type     : meal_type,
                    meta_data     : JSON.stringify(meta_data),
                    record_date   : date_update
                });
            });
            console.log(findit);
            const data = {
                "text"      : text,
                "meta_data" : JSON.parse(JSON.stringify(meta_data)),
            };
            return data;
        } catch (error) {
            console.log(error);
            console.log('Food Info info Listener Error!');
        }
    }

    async mainSearch(access_token,search_term) {
        var method = 'foods.search';
        var search = search_term;
        var format = 'json';
        var max_results = 5;
        const url = 'https://platform.fatsecret.com/rest/server.api?method=' + method + '&search_expression=' + search + '&format=' + format + '&max_results=' + max_results;

        var options = {
            method  : 'POST',
            url     : url,
            headers : {
                'content-type'  : 'application/json',
                'Authorization' : `Bearer ${access_token}`
            }
        };
        const  res = await this.doRequest(options);

        return res;
    }

    async mainGetFood(access_token,food_id) {
        var method = 'food.get.v2';
        var format = 'json';
        const url = 'https://platform.fatsecret.com/rest/server.api?method=' + method + '&food_id=' + food_id + '&format=' + format;

        var options = {
            method  : 'POST',
            url     : url,
            headers : {
                'content-type'  : 'application/json',
                'Authorization' : `Bearer ${access_token}`
            }
        };
        const  res = await this.doRequest(options);

        return res;
    }

    async getUnitData(servings,serving_unit){
        var unit_found = {
            "calories"            : "0",
            "serving_description" : 'Item not found!',
            "number_of_units"     : "1",
        };
        var default_serve = {
            "calories"            : "0",
            "serving_description" : 'Item not found!',
            "number_of_units"     : "1",
        };
        for (var unit of servings){

            if (unit['measurement_description'].match(serving_unit)){
                unit_found =  unit;
                break;
            } else if (unit['measurement_description'].match('serving')) {
                default_serve = unit;
                break;
            } else {
                continue;
            }
        }
        if (unit_found){
            return unit_found;
        } else if (default_serve) {
            return default_serve;
        } else {
            return unit_found;
        }
    }

    async saveToDB(table_id,name,food_name,calories,value,serving_data) {
        const calorieDB = {
            message_id : table_id,
            food_name  : name,
            fs_db_name : food_name,
            calories   : parseInt(calories),
            value      : value,
            meta_data  : JSON.stringify(serving_data),
        };
        // eslint-disable-next-line max-len
        const calorieDatabaseRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironment)).getRepository(CalorieDatabase);
        await calorieDatabaseRepository.create(calorieDB);
    }

    async main() {

        const clientID = await this.clientEnvironment.getClientEnvironmentVariable("FS_CLIENT_ID");
        const clientSecret = await this.clientEnvironment.getClientEnvironmentVariable("FS_CLIENT_SECRET");

        var options = {
            method : 'POST',
            url    : 'https://oauth.fatsecret.com/connect/token',
            auth   : {
                user     : clientID,
                password : clientSecret
            },
            headers : { 'content-type': 'application/json'},
            form    : {
                'grant_type' : 'client_credentials',
                'scope'      : 'basic'
            },
            json : true
        };
        const  res = await this.doRequest(options);

        return res;
    }

    async doRequest(url) {
        return new Promise(function (resolve, reject) {
            requestCalorie(url, function (error, res, body) {
                if (!error && res.statusCode == 200) {
                    const data = {
                        'body' : body
                    };
                    resolve(data);
                } else {
                    reject(error);
                }
            });
        });
    }
}

