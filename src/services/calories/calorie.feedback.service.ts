/* eslint-disable max-len */
import { CalorieDatabase } from '../../models/calorie.db.model';
import { CalorieInfo } from '../../models/calorie.info.model';
import { Op } from 'sequelize';
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { Lifecycle, inject, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class CalorieFeedback {

    constructor (
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}
    
    async updateCalories(req,sessionId){
        try {
            var new_calorie_value = 0;
            const update_info = req.body.queryResult.parameters;
            const calorieInfoRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(CalorieInfo);
            const calorieDatabaseRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(CalorieDatabase);
            const message_id = await calorieInfoRepository.findOne(
                {
                    where : {
                        negative_feedback : 1,
                        user_id           : sessionId
                    },
                    order : [['updatedAt','DESC']],
                    limit : 1,
                }
            ).then(function (record) {
                return record;
            });
            const no_of_items = await calorieDatabaseRepository.findAll(
                {
                    where : {
                        message_id : message_id.autoIncrementalID
                    }
                }
            ).then(function (record_db) {
                return record_db;
            });
            if (no_of_items.length === 1 && !update_info.food) {
                update_info.food = {};
                update_info.food.name = no_of_items[0].food_name;
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    `Please enter the calorie value for ${no_of_items[0].food_name}`
                                ]
                            }
                        }
                    ],
                    "followupEventInput" : {
                        "name"         : "calorie_info",
                        "languageCode" : "en-US",
                        "parameters"   : update_info
                    }
                };
                return data;
            } else if (no_of_items.length > 1 && !update_info.food) {
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    `Which food item do you want to update the calories of?`
                                ]
                            }
                        }
                    ],
                    "followupEventInput" : {
                        "name"         : "calorie_info",
                        "languageCode" : "en-US",
                        "parameters"   : update_info
                    }
                };
                return data;
            } else if (update_info.food && !update_info.updatedCalories) {
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    `Please enter the calorie value for ${update_info.food.name}`
                                ]
                            }
                        }
                    ],
                    "followupEventInput" : {
                        "name"         : "calorie_info",
                        "languageCode" : "en-US",
                        "parameters"   : update_info
                    }
                };
                return data;
            }
            console.log("It is done");

            if ( no_of_items.length === 1) {
                const single_update = await calorieInfoRepository.findOne(
                    {
                        where : {
                            negative_feedback : 1,
                            user_id           : sessionId
                        },
                        order : [['updatedAt','DESC']],
                        limit : 1
                    }
                ).then(function (record_single) {
                    return record_single.update({
                        user_calories    : update_info.updatedCalories,
                        calories_updated : 1
                    });
                });
                new_calorie_value = single_update.user_calories;
            } else {
                const updated_item = await calorieDatabaseRepository.findOne({
                    where : {
                        food_name  : { [Op.like]: `${update_info.food.name}`},
                        message_id : message_id.autoIncrementalID
                    },
                    limit : 1
                }).then(function (update_record) {
                    return update_record;
                });

                // eslint-disable-next-line max-len
                new_calorie_value = message_id.user_calories - (updated_item.calories * updated_item.value) + (update_info.updatedCalories * updated_item.value);
                await calorieInfoRepository.findOne({
                    where : {
                        negative_feedback : 1,
                        user_id           : sessionId
                    },
                    order : [['updatedAt','DESC']],
                    limit : 1
                }).then( function (record) {
                    return record.update({
                        user_calories    : new_calorie_value,
                        calories_updated : 1
                    });
                });
            }

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : {
                            "text" : [
                                `Your calorie value for ${update_info.food.name} been updated to ${update_info.updatedCalories}. Your new calorie value for the above items is ${new_calorie_value}. Thank you for the feedback.`
                            ]
                        }
                    }
                ]
            };
            return data;
        } catch (error) {
            console.log(error,500,"Calorie Negative Feedback Service Error");
            throw new Error("Calorie Negative Feedback Service Error");
        }
    }
