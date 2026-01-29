/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IIntentListeners, HandlerType, ExecutionMode } from '../../refactor/interface/intents/intents.interface';
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
        id: number;

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

    // Dynamic Handler Configuration
    @Column({
        type : DataType.ENUM('function', 'class', 'service'),
        defaultValue : 'function',
        allowNull : false
    })
        handlerType: HandlerType;

    @Column({
        type : DataType.STRING(255)
    })
        handlerPath: string;

    @Column({
        type : DataType.JSON
    })
        handlerConfig: any;

    @Column({
        type : DataType.BOOLEAN,
        defaultValue : true,
        allowNull : false
    })
        enabled: boolean;

    @Column({
        type : DataType.ENUM('sequential', 'parallel'),
        defaultValue : 'sequential',
        allowNull : false
    })
        executionMode: ExecutionMode;
}
