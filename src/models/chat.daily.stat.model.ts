/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID } from 'sequelize-typescript';
import { v4 } from 'uuid';

@Table(
    {
        timestamps : true,
        modelName  : 'ChatDailyStat',
        tableName  : 'chat_daily_stat'
    }
)
export class ChatDailyStat extends Model {

    @IsUUID(4)
    @PrimaryKey
    @Column({
        type         : DataType.UUID,
        defaultValue : () => {
            return v4();
        },
        allowNull : false
    })
        id: string;

    @Column({
        type      : DataType.DATEONLY,
        allowNull : false,
        unique    : true
    })
        statDate: string;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        messagesReceived: number;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        messagesSent: number;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        uniqueMessagesReceivedCount: number;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        newUsersCount: number;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        questionsAskedCount: number;

}
