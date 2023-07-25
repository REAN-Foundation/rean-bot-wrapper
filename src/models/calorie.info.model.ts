import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Index, HasMany } from 'sequelize-typescript';
import { calorieInfo } from '../refactor/interface/message.interface';
import { CalorieDatabase } from './calorie.db.model';

@Table({
    timestamps : true,
    modelName  : 'CalorieInfo',
    tableName  : 'calorie_info'
})

export class CalorieInfo extends Model implements calorieInfo {

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
        user_id: string;

    @Index
    @Column({
        type : DataType.STRING(256)
    })
        user_message: string;
    
    @Column({
        type : DataType.STRING(512)
    })
        fs_message: string;

    @Column({
        type      : DataType.STRING,
        allowNull : true
    })
        units: string;

    @Column({
        type      : DataType.INTEGER,
        allowNull : true,
    })
        calories: number;

    @Column({
        type      : DataType.INTEGER,
        allowNull : true,
    })
        user_calories: number;

    @Column({
        type      : DataType.STRING,
        allowNull : true,
    })
        meal_type: string;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        negative_feedback: number;

    @Column({
        type         : DataType.INTEGER,
        defaultValue : 0
    })
        calories_updated: number;

    @Column({
        type      : DataType.STRING(2048),
        allowNull : true
    })
        meta_data: string;
    
    @Column({
        type : DataType.DATE,
    })
        record_date: Date;

    @HasMany(() => CalorieDatabase)
        CalorieDatabase: CalorieDatabase[];

}
