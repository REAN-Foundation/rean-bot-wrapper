import needle from 'needle';
import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import { EntityManagerProvider } from '../entity.manager.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class ClickUpTask{

    private description = null;

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) { }

    // eslint-disable-next-line max-len
    async createTask(responseChatMessage = null, postTopic:string = null, description:string = null, priority = null, ClickupListID = null,tag = ''){
        try {
            let listID = null;
            if (ClickupListID){
                listID = ClickupListID;
            }
            else {
                listID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_LIST_ID");
            }
            const createTaskUrl = `https://api.clickup.com/api/v2/list/${listID}/task`;
            const options = getRequestOptions();
            const CLICKUP_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
            options.headers["Authorization"] =  CLICKUP_AUTHENTICATION;
            options.headers["Content-Type"] = `application/json`;
            let topic:any = null;
            if (postTopic){
                topic = postTopic;
                
            }
            else if (responseChatMessage?.length >= 1 ){
                topic = responseChatMessage[responseChatMessage.length - 1].dataValues.messageContent;
            }
            else {
                topic = "New User";
            }
            const obj = {
                "name"                 : topic,
                "status"               : "TO DO",
                "priority"             : priority,
                "due_date"             : null,
                "due_date_time"        : false,
                "start_date_time"      : false,
                "notify_all"           : true,
                "parent"               : null,
                "tags"                 : [tag],
                "links_to"             : null,
                "markdown_description" : description
            };
            if (description === null) {

                obj["markdown_description"] = `User details not found`;
            }
            if (tag === '') {
                obj["tags"] = [];
            }
            const response = await needle("post", createTaskUrl, obj, options);
            if (response.statusCode !== 200) {
                console.log("Error in creating the ClickUp Task");
                console.log(response);
            }
            const taskID = response.body.id;
            console.log(`task has been created with ${taskID}`);
            return taskID;
        } catch (error) {
            console.log("Error while creating the task on ClickUp", error);
        }
    }

    async taskAttachment(taskID, imageLink){

        //For now attachment is only image
        try {
            const form = new FormData();
            const filename = crypto.randomBytes(16).toString('hex');
            
            form.append(filename, '');
            form.append('attachment', fs.createReadStream(imageLink));
            
            const headers = form.getHeaders();
            headers.Authorization = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
            
            await axios({
                method : 'post',
                url    : `https://api.clickup.com/api/v2/task/${taskID}/attachment`,
                data   : form,
                headers,
            });
        }
        catch (error){
            console.log(error);
        }
    }

    async postCommentOnTask(taskID,comment){
        try {
            const createTaskUrl = `https://api.clickup.com/api/v2/task/${taskID}/comment`;
            const options = getRequestOptions();
            const CLICKUP_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
            options.headers["Authorization"] =  CLICKUP_AUTHENTICATION;
            options.headers["Content-Type"] = `application/json`;
            const obj = {
                "comment_text" : comment,
                "notify_all"   : true
            };
            await needle("post", createTaskUrl, obj, options);
            console.log("comment has been added in the task");
        }
        catch (error){
            console.log(error);
        }

    }

    async updateTask(taskID,priority,user_details, topic = null,tag = null){
        try {
            const updateTaskUrl = `https://api.clickup.com/api/v2/task/${taskID}`;
            const options = getRequestOptions();
            const CLICKUP_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
            options.headers["Authorization"] =  CLICKUP_AUTHENTICATION;
            options.headers["Content-Type"] = `application/json`;
            const obj = {
                "status"               : "TO DO",
                "priority"             : priority,
                "due_date"             : null,
                "due_date_time"        : false,
                "start_date_time"      : false,
                "notify_all"           : true,
                "parent"               : null,
                "links_to"             : null,
                "tags"                 : [tag],
                "markdown_description" : user_details,
                "name"                 : topic
            };
    
            await needle("put", updateTaskUrl, obj, options);
        }
        catch (error){
            console.log(error);
        }
        
    }

    async updateTag(taskID: string, intent = '') {
        try {
            const clientTags = JSON.parse(this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_TAGS"));
            if (clientTags) {
                const exists = clientTags.includes(intent);
                if (exists) {
                    const updateTaskUrl = `https://api.clickup.com/api/v2/task/${taskID}/tag/${intent}`;
                    const options = getRequestOptions();
                    const CLICKUP_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
                    options.headers["Authorization"] =  CLICKUP_AUTHENTICATION;
                    options.headers["Content-Type"] = `application/json`;
                    const response = await needle("post", updateTaskUrl, {}, options);
                    console.log(response);
                }
            }
        } catch (error) {
            console.log("Error while updating the clickup tags.");
        }
    }
    async updateTagInFeedback(taskID: string, intent = '') {
        try {
            const updateTaskUrl = `https://api.clickup.com/api/v2/task/${taskID}/tag/${intent}`;
            const options = getRequestOptions();
            const CLICKUP_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
            options.headers["Authorization"] =  CLICKUP_AUTHENTICATION;
            options.headers["Content-Type"] = `application/json`;
            const response = await needle("post", updateTaskUrl, {}, options);
            console.log(response);
        } catch (error) {
            console.log("Error while updating the clickup tags.");
        }
    }
    
}
