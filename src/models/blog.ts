import mongoose from 'mongoose';

const schema = mongoose.Schema;

const blogSchema = new schema({
    userID : {
        type  : Number,
        required : true
    },
    message : {
        type  : String,
        required : true
    },
    channel : {
        type  : String,
        required : true
    },
    ts : {
        type : String
    }
},{ timestamps  : true });

export class DBMongoose{

    public Blog = mongoose.model('Blog', blogSchema);

}
