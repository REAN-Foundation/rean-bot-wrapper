import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Index } from 'sequelize-typescript';
import { calorieInfo } from '../refactor/interface/message.interface';

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
        user_id: string

    @Index
    @Column({
        type : DataType.STRING
    })
        user_food_name: string;
    
    @Column({
        type : DataType.STRING
    })
        fs_food_name: string;

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
        type      : DataType.STRING(2048),
        allowNull : true
    })
        meta_data: string;
}