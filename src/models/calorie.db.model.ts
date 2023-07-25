import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Index, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { calorieDatabase } from '../refactor/interface/message.interface';
import { CalorieInfo } from './calorie.info.model';

@Table({
    timestamps : true,
    modelName  : 'CalorieDB',
    tableName  : 'calorie_database'
})

export class CalorieDatabase extends Model implements calorieDatabase {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER
    })
        autoIncrementalID: number;
    
    @ForeignKey(() => CalorieInfo)
    @Column({
        type : DataType.INTEGER,
    })
        message_id: number;

    @BelongsTo(() => CalorieInfo)
        CalorieInfo: CalorieInfo;

    @Index
    @Column({
        type : DataType.STRING
    })
        food_name: string;
    
    @Column({
        type : DataType.STRING
    })
        fs_db_name: string;

    @Column({
        type      : DataType.INTEGER,
        allowNull : true,
    })
        calories: number;

    @Column({
        type      : DataType.INTEGER,
        allowNull : true,
    })
        value: number;

    @Column({
        type      : DataType.STRING(2048),
        allowNull : true
    })
        meta_data: string;

}
