/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IMessageStatus } from '../refactor/interface/message.interface';
import { ChatMessage } from './chat.message.model';

@Table(
    {
        timestamps: true,
        modelName: 'MessageStatus',
        tableName: 'message_status'
    }
)

export class MessageStatus extends Model implements IMessageStatus {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type    : DataType.INTEGER,
        allowNull : false
    })
        autoIncrementalID?: number;

    @ForeignKey(() => ChatMessage)
    @Column({
        type  : DataType.INTEGER,
        allowNull : true
    })
        chatMessageId: number;

    @BelongsTo(() => ChatMessage)
        chatMessage: ChatMessage;

    @Column({
        type: DataType.STRING(256),
        allowNull: true
    })
        channel: string;

    @Column({
        type: DataType.STRING(256),
        allowNull: true
    })
        messageStatus: string;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
        messageSentTimestamp: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
        messageDeliveredTimestamp: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
        messageReadTimestamp: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
        messageRepliedTimestamp: Date;
}
