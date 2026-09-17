/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table(
    {
        timestamps : true,
        modelName  : 'ChatDailyContentStat',
        tableName  : 'chat_daily_content_stat',
        indexes    : [
            {
                unique : true,
                fields : ['statDate', 'messageContentNormalized']
            }
        ]
    }
)
export class ChatDailyContentStat extends Model {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        id?: number;

    @Column({
        type      : DataType.DATEONLY,
        allowNull : false
    })
        statDate: string;

    @Column({
        type      : DataType.STRING(300),
        allowNull : false
    })
        messageContentNormalized: string;

    @Column({
        type      : DataType.TEXT,
        allowNull : false
    })
        messageContentSample: string;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        occurrenceCount: number;

}
