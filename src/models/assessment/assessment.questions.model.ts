/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { IAssessmentQuestions } from '../../refactor/interface/assessment/assessment.questions.interface';

@Table(
    {
        timestamps : true,
        modelName : 'AssessmentQuestions',
        tableName : 'assessment_questions'
    }
)

export class AssessmentQuestions extends Model implements IAssessmentQuestions {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        id: number;

    @Column({
        type : DataType.STRING(64),
        allowNull : false
    })
        assessmentQuestionId: string;

    @Column({
        type : DataType.STRING(64),
        allowNull : false
    })
        assessmentId: string;
    
    @Column({
        type : DataType.STRING(64)
    })
        assessmentTemplateId: string;

    @Column({
        type : DataType.TEXT()
    })
        questions: string;

    @Column({
        type : DataType.TEXT()
    })
        options: string;

    @Column({
        type : DataType.STRING(64)
    })
        platformMessageId: string;
}
