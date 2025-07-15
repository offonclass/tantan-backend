import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Page 모델의 속성 인터페이스 정의
export interface PageAttributes {
  id: number;
  uuid: string;
  lectureMaterialId: number;
  pageNumber: number;
  fileName: string;
  s3Key: string;
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 속성 정의
interface PageCreationAttributes extends Optional<PageAttributes, 'id' | 'uuid' | 'createdAt' | 'updatedAt'> {}

// Page 모델 클래스 정의
export class Page extends Model<PageAttributes, PageCreationAttributes> implements PageAttributes {
  public id!: number;
  public uuid!: string;
  public lectureMaterialId!: number;
  public pageNumber!: number;
  public fileName!: string;
  public s3Key!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Page 모델 정의 및 테이블 스키마 설정
Page.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '페이지 고유 ID'
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      comment: '페이지 UUID'
    },
    lectureMaterialId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '소속 교재 ID'
    },
    pageNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '페이지 번호'
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '이미지 파일명 (예: page-001.webp)'
    },
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'S3 전체 경로'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '생성 시간'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '수정 시간'
    }
  },
  {
    sequelize,
    modelName: 'Page',
    tableName: 'pages',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
      {
        unique: true,
        fields: ['lectureMaterialId', 'pageNumber']
      },
      {
        fields: ['s3Key']
      }
    ]
  }
); 

export default Page; 