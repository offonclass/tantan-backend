import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 즐겨찾기 조인 테이블 속성 인터페이스
export interface UserFavoriteMaterialAttributes {
  id: number;
  userId: number;
  lectureMaterialId: number;
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 속성 정의
export interface UserFavoriteMaterialCreationAttributes
  extends Optional<UserFavoriteMaterialAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// 모델 클래스 정의
export class UserFavoriteMaterial
  extends Model<UserFavoriteMaterialAttributes, UserFavoriteMaterialCreationAttributes>
  implements UserFavoriteMaterialAttributes {
  public id!: number;
  public userId!: number;
  public lectureMaterialId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 모델 초기화 및 스키마 설정
UserFavoriteMaterial.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '즐겨찾기 조인 고유 ID'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '사용자 ID (FK: users.id)'
    },
    lectureMaterialId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '교재/폴더 ID (FK: lectureMaterials.id)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'UserFavoriteMaterial',
    tableName: 'userFavoriteMaterials',
    timestamps: true,
    underscored: false,
    indexes: [
      // 중복 즐겨찾기 방지를 위한 복합 유니크 인덱스
      {
        unique: true,
        fields: ['userId', 'lectureMaterialId']
      },
      // 조회 성능 향상을 위한 보조 인덱스
      { fields: ['userId'] },
      { fields: ['lectureMaterialId'] }
    ]
  }
);

export default UserFavoriteMaterial;