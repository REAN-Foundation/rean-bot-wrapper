/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table(
    {
        timestamps : true,
        modelName  : 'ChatDailyStat',
        tableName  : 'chat_daily_stat'
    }
)
export class ChatDailyStat extends Model {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        id?: number;

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
