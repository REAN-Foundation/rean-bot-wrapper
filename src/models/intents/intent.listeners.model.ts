/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IIntentListeners } from '../../refactor/interface/intents/intents.interface';
import { Intents } from './intents.model';
@Table(
    {
        timestamps: true,
        modelName: 'IntentListeners',
        tableName: 'intent_listeners'
    }
)

export class IntentListeners extends Model implements IIntentListeners {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        declare id: number;

    @ForeignKey(() => Intents)
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        intentId: number;

    @BelongsTo(() => Intents)
        Intents: Intents;

    @Column({
        type : DataType.STRING(128),
        allowNull : false
    })
        listenerCode: string;

    @Column({
        type : DataType.INTEGER
    })
        sequence: number;
}
