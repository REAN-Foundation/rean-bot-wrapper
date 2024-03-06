/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Index, HasMany } from 'sequelize-typescript';
import { consentInfo } from '../refactor/interface/message.interface';

@Table({
    timestamps : true,
    modelName  : 'ConsentInfo',
    tableName  : 'consentinfo'
})

export class ConsentInfo extends Model implements consentInfo {
  
    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER
    })
        autoIncrementalID: number;
    
    @Column({
        type : DataType.STRING,
        allowNull : true
    })
        Language: string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
        LanguageCode: string;

    @Column({
        type : DataType.STRING,
    })
        WebsiteURL: string;

    @Column({
        type : DataType.TEXT(),
    })
        MessageContent: string;

}
