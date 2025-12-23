/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IChatMessageSensitivity } from '../refactor/interface/message.interface';
import { ChatMessage } from './chat.message.model';

@Table(
    {
        timestamps : true,
        modelName  : 'ChatMessageSensitivity',
        tableName  : 'chat_message_sensitivity'
    }
)
export class ChatMessageSensitivity
    extends Model
    implements IChatMessageSensitivity {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        id?: number;

    @ForeignKey(() => ChatMessage)
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        chatMessageID: number;

    @BelongsTo(() => ChatMessage)
        ChatMessage: ChatMessage;

    @Column({
        type      : DataType.STRING(64),
        allowNull : false
    })
        sensitivity: string;
}
