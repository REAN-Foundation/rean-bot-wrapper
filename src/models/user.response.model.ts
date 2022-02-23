import { Table, Column, Model, DataType, HasMany, IsNull, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { response } from '../refactor/interface/message.interface'; 

@Table({
    timestamps      : true,
    modelName       : 'UserResponse',
    tableName       : 'user_response'
})
export class UserResponse extends Model implements response{

    @AutoIncrement
    @PrimaryKey
    @Column({
        type         : DataType.INTEGER
    })
    id?: number

    @Column({
        type         : DataType.STRING(256)
    })
    name: string;

    @Column({
        type         : DataType.STRING(256)
    })
    platform: string;

    @Column({
        type         : DataType.STRING(256)
    })
    sessionId: string;

    @Column({
        type         : DataType.STRING(256)
    })
    chat_message_id: string;

    @Column({
        type         : DataType.STRING(256)
    })
    direction: string;

    @Column({
        type         : DataType.STRING(256)
    })
    input_message: any;

    @Column({
        type         : DataType.STRING(256)
    })
    message_type: string;

    @Column({
        type         : DataType.STRING(256)
    })
    messageBody: string;

    @Column({
        type         : DataType.TEXT
    })
    messageText: string;

    @Column({
        type         : DataType.TEXT
    })
    raw_response_object: string;

    @Column({
        type         : DataType.STRING(256)
    })
    intent: string;

    @Column({
        type         : DataType.STRING(256)
    })
    messageImageUrl: string;

    @Column({
        type         : DataType.TEXT
    })
    messageImageCaption: string;
}