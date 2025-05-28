/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { IIntents } from '../../refactor/interface/intents/intents.interface';
import { IntentType } from '../../refactor/messageTypes/intents/intents.message.types';

@Table(
    {
        timestamps: true,
        modelName: 'Intents',
        tableName: 'intents'
    }
)

export class Intents extends Model implements IIntents {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        autoIncrementalId: number;

    @Column({
        type : DataType.STRING(64),
        allowNull : false
    })
        name: string;

    @Column({
        type : DataType.STRING(128),
        allowNull : false
    })
        code: string;

    @Column({
        type : DataType.STRING(128)
    })
        type: IntentType;

    @Column({
        type : DataType.TEXT()
    })
        Metadata: JSON;
}
