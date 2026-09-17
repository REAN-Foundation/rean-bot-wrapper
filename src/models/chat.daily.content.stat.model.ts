/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID } from 'sequelize-typescript';
import { v4 } from 'uuid';

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
