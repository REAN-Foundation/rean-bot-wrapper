import needle from 'needle';
import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { autoInjectable } from 'tsyringe';
import { UserFeedback } from '../../models/user.feedback.model';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import { ChatMessage } from '../../models/chat.message.model';

@autoInjectable()
export class ClickUpTask{

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService) { }

    async createTask(rdsData,responseUserFeedback,imageLink:string = null,postTopic:string = null){
        const listID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_LIST_ID");
        const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        const createTaskUrl = `https://api.clickup.com/api/v2/list/${listID}/task`;
        const options = getRequestOptions();
        const CLICKUP_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_AUTHENTICATION");
        options.headers["Authorization"] =  CLICKUP_AUTHENTICATION;
        options.headers["Content-Type"] = `application/json`;
        let topic:any = null;
        if (postTopic){
            topic = postTopic;
        }
        else {
            topic = rdsData[rdsData.length - 1].dataValues.messageContent;
        }
        const obj = {
            "name"            : topic,
            "status"          : "TO DO",
            "priority"        : 3,
            "due_date"        : null,
            "due_date_time"   : false,
            "start_date_time" : false,
            "notify_all"      : true,
            "parent"          : null,
            "tags"            : [clientName],
            "links_to"        : null
        };

        if (imageLink !== null) {
            obj["markdown_description"] = `![This is an image](${imageLink})`;
        }

        const response = await needle("post", createTaskUrl, obj, options);

        // console.log("response status", response.statusCode);
        console.log("body", response.body.id);
        if (responseUserFeedback){
            const objID = responseUserFeedback[responseUserFeedback.length - 1].dataValues.id;
            console.log("objId", objID);
            await UserFeedback.update({ taskID: response.body.id }, { where: { id: objID } })
                .then(() => { console.log("updated"); })
                .catch(error => console.log("error on update", error));
            await UserFeedback.update({ messageContent: topic }, { where: { id: objID } })
                .then(() => { console.log("updated"); })
                .catch(error => console.log("error on update", error));
            return response;
        }
        const taskID = response.body.id;
        return taskID;
    }

    async taskAttachment(taskID, imageLink){

        //For now attachment is only image
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
        })
            .then(() => console.log('success'))
            .catch((e) => console.log('fail',e.response.status));
        
    }

    async postCommentOnTask(taskID,comment){
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

    }
}
