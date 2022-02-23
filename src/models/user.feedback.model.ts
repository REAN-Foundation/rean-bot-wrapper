import { Table, Column, Model, DataType, HasMany, IsNull, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { feedbackmessage } from '../refactor/interface/message.interface'; 

@Table({
    timestamps      : true,
    modelName       : 'UserFeedback',
    tableName       : 'user_feedback'
})
export class UserFeedback extends Model implements feedbackmessage{

    @AutoIncrement
    @PrimaryKey
    @Column({
        type         : DataType.INTEGER
    })
    id?: number

    @Column({
        type         : DataType.STRING
    })
    userId: String;

    @Column({
        type         : DataType.STRING
    })
    message: String;

    @Column({
        type         : DataType.STRING
    })
    channel: String;

    @Column({
        type         : DataType.STRING
    })
    ts: String;

}
