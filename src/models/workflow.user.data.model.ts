/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { IworkflowUserData } from '../refactor/interface/workflow.user.data.interfce';

@Table({
    timestamps : true,
    modelName  : 'WorkflowUserData',
    tableName  : 'workflow_user_data'
})
export class WorkflowUserData extends Model implements IworkflowUserData {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        id?: number;

    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        chatSessionId: number;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        userPlatformId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        channelType: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        messageType: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        messageId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        eventTimestamp: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        schemaId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        schemaInstanceId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        schemaName: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        nodeInstanceId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        nodeId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        actionId: string;

    @Column({
        type : DataType.JSON,
        allowNull : true
    })
        metaData: any;
}
