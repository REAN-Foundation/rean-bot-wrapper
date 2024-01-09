/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { assessmentSessionLogs } from '../refactor/interface/message.interface';

@Table({
    timestamps : true,
    modelName  : 'AssessmentSessionLogs',
    tableName  : 'assessment_session_logs',
})
export class AssessmentSessionLogs extends Model implements assessmentSessionLogs {
    
    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER
    })
        autoIncrementalID: number;

    @Column({
        type : DataType.STRING
    })
        userPlatformId: string;

    @Column({
        type : DataType.STRING
    })
        patientUserId: string;

    @Column({
        type : DataType.STRING
    })
        assessmentTemplateId: string;

    @Column({
        type : DataType.STRING
    })
        assesmentId: string;

    @Column({
        type : DataType.STRING
    })
        assesmentNodeId: string;
    
    @Column({
        type : DataType.STRING
    })
        userResponseType: string;

    @Column({
        type : DataType.STRING
    })
        userResponse: string;
    
    @Column({
        type : DataType.DATE
    })
        userResponseTime: Date;

    @Column({
        type : DataType.STRING
    })
        userMessageId: string;

}
