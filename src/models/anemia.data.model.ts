import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, IsUUID } from 'sequelize-typescript';
import { anemiaDataRecord } from '../refactor/interface/message.interface';
import { v4 } from 'uuid';

@Table({
    timestamps : true,
    modelName  : 'AnemiaDataRecord',
    tableName  : 'anemia_data_record',
    })
export class AnemiaDataRecord extends Model implements anemiaDataRecord {
    
    @IsUUID(4)
    @PrimaryKey
    @Column({
          type : DataType.UUID,
          defaultValue : () => {
              return v4();
          },
          allowNull : false
      })
          id: string;

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
        patientId: string

    @Column({
        type: DataType.FLOAT
    })
        pridictedHb: number;
    
            @Column({
        type: DataType.FLOAT
    })
        exactHb: number;

    @Column({
       type: DataType.STRING
    })
        originalImagePath : string

    @Column({
       type: DataType.STRING
    })
        bucketImagePath : string
        
    @Column({
       type: DataType.STRING
    })
        segmentedImagePath : string

}
