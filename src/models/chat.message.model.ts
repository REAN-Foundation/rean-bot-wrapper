/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IchatMessage } from '../refactor/interface/message.interface';
import { ChatSession } from './chat.session';

@Table(
    {
        timestamps : true,
        modelName  : 'ChatMessage',
        tableName  : 'chat_message'
    }
)
export class ChatMessage extends Model implements IchatMessage {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        id?: number;

    @ForeignKey(() => ChatSession)
    @Column({
        type      : DataType.INTEGER,
        allowNull : true
    })
        chatSessionID?: number;

    @BelongsTo(() => ChatSession)
        ChatSession: ChatSession;

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
        userPlatformID: string;

    @Column({
        type : DataType.STRING(256)
    })
        intent: string;

    @Column({
        type : DataType.STRING(256)
    })
        direction: string;

    @Column({
        type : DataType.STRING(256)
    })
        messageType: string;

    @Column({
        type : DataType.STRING(256)
    })
        messageId: string;

    @Column({
        type : DataType.TEXT()
    })
        messageContent: string;

    @Column({
        type : DataType.STRING(1024)
    })
        imageContent: string;

    @Column({
        type : DataType.STRING(1024)
    })
        imageUrl: string;

    @Column({
        type : DataType.STRING(1024)
    })
        responseMessageID: string;

    @Column({
        type : DataType.DATE
    })
        whatsappResponseStatusSentTimestamp : Date;

    @Column({
        type : DataType.DATE
    })
        whatsappResponseStatusDeliveredTimestamp : Date;

    @Column({
        type : DataType.DATE
    })
        whatsappResponseStatusReadTimestamp : Date;

    @Column({
        type : DataType.STRING
    })
        supportchannelName : string;

    @Column({
        type : DataType.STRING
    })
        supportChannelTaskID : string;

    @Column({
        type : DataType.BOOLEAN
    })
        humanHandoff : string;

    @Column({
        type : DataType.STRING
    })
        feedbackType: string;

    @Column({
        type : DataType.STRING
    })
        messageFlag: string;

}
