// import mongoose from 'mongoose';
import { DBMongoose } from '../models/blog';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class MongoDBService{

    constructor(private dbMongoose?: DBMongoose){}

    async mongooseSaveData(userID, message, channel){

        const blog = new this.dbMongoose.Blog({
            userID : userID,
            message : message,
            channel : channel,
            ts : "null"
        });
        blog.save().then((result) => console.log("result",result))
        .catch((err) => console.log(err));

    }

    async mongooseGetData(parameter){
        const response = await this.dbMongoose.Blog.find(parameter);
        return response;
    }

    async mongooseUpdateDocument(id, updatedObject){
        await this.dbMongoose.Blog.findByIdAndUpdate(id, updatedObject, { new: true });
    }

}
