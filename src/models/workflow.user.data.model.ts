/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    CreatedAt,
    UpdatedAt
} from 'sequelize-typescript';

//////////////////////////////////////////////////////////////////////////

@Table({
    timestamps : true,
    modelName  : 'WorkflowUserData',
    tableName  : 'workflow_user_data'
})
export default class WorkflowUserData extends Model {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
    id?: number;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    TenantId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    EventType: string;

    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
    ChatSessionId: number;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    UserPlatformId: string;

    @Column({
        type : DataType.STRING(32),
        allowNull : true,
    })
    PhoneNumber: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    ChannelType: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    MessageType: string;

    @Column({
        type : DataType.BOOLEAN,
        allowNull : false
    })
    IsMessageFromUser: boolean;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    MessageId: string;

    @Column({
        type : DataType.DATE,
        allowNull : false
    })
    EventTimestamp: Date;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    SchemaId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    SchemaInstanceId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    SchemaName: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
    NodeInstanceId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : true
    })
    NodeId: string;

    @Column({
        type : DataType.STRING(256),
        allowNull : true
    })
    NodeActionId: string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    TextMessage: string;

    @Column({
        type : DataType.JSON,
        allowNull : true
    })
    Location: any;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    ImageUrl: string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    AudioUrl: string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    VideoUrl: string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    FileUrl: string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    Question: string;

    @Column({
        type : DataType.JSON,
        allowNull : true
    })
    QuestionOptions: any;

    @Column({
        type : DataType.JSON,
        allowNull : true
    })
    QuestionResponse: any;

    @Column({
        type : DataType.JSON,
        allowNull : true
    })
    Placeholders: any;

    @Column({
        type : DataType.JSON,
        allowNull : true
    })
    Payload: any;

    @Column({type: DataType.DATE})
    @CreatedAt
    CreatedAt: Date;

    @Column({type: DataType.DATE})
    @UpdatedAt
    UpdatedAt: Date;

}
