import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { feedbackmessage } from '../refactor/interface/message.interface';

@Table({
    timestamps: true,
    modelName: 'UserFeedback',
    tableName: 'user_feedback'
})
export class UserFeedback extends Model implements feedbackmessage {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type: DataType.INTEGER
    })
    id?: number;

    @Column({
        type: DataType.STRING
    })
    userId: string;

    @Column({
        type: DataType.STRING
    })
    message: string;

    @Column({
        type: DataType.STRING
    })
    channel: string;

    @Column({
        type: DataType.STRING
    })
    ts: string;

}
