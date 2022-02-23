import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { message } from '../refactor/interface/message.interface';

@Table({
    timestamps : true,
    modelName  : 'UserRequest',
    tableName  : 'user_request'
})
export class UserRequest extends Model implements message {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER
    })
        id?: number;

    @Column({
        type : DataType.STRING(256)
    })
        name: string;

    @Column({
        type : DataType.STRING(256)
    })
        platform: string;

    @Column({
        type : DataType.STRING(256)
    })
        sessionId: string;

    @Column({
        type : DataType.STRING(256)
    })
        chat_message_id: string;

    @Column({
        type : DataType.STRING(256)
    })
        direction: string;

    @Column({
        type : DataType.STRING(256)
    })
        type: string;

    @Column({
        type : DataType.STRING(256)
    })
        messageBody: string;

    @Column({
        type : DataType.STRING(256)
    })
        latlong: string;

    @Column({
        type : DataType.STRING(256)
    })
        replyPath: string;
}
