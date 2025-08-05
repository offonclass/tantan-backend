import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

// Audio 모델의 속성 인터페이스 정의
export interface AudioAttributes {
  id: number;
  uuid: string;
  pageId: number;
  audioName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  s3Key: string;
  uploadedBy?: number;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 선택적 속성 정의
interface AudioCreationAttributes extends Optional<AudioAttributes, 'id' | 'uuid' | 'duration' | 'uploadedBy' | 'sortOrder' | 'createdAt' | 'updatedAt'> {}

// Audio 모델 클래스 정의
export class Audio extends Model<AudioAttributes, AudioCreationAttributes> implements AudioAttributes {
  public id!: number;
  public uuid!: string;
  public pageId!: number;
  public audioName!: string;
  public originalFileName!: string;
  public fileSize!: number;
  public mimeType!: string;
  public duration?: number;
  public s3Key!: string;
  public uploadedBy?: number;
  public sortOrder?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Audio 모델 정의 및 테이블 스키마 설정
Audio.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '오디오 고유 ID'
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: () => crypto.randomUUID(),
      allowNull: false,
      unique: true,
      comment: '오디오 UUID'
    },
    pageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '소속 페이지 ID (외래키)'
    },
    audioName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      },
      comment: '오디오 표시 이름'
    },
    originalFileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '원본 오디오 파일명'
    },
    fileSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '파일 크기 (bytes)'
    },
    mimeType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'MIME 타입 (audio/mpeg, audio/wav 등)'
    },
    duration: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '재생 시간 (초)'
    },
    s3Key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'S3 전체 경로'
    },
    uploadedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '업로드한 관리자 ID'
    },
    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '같은 페이지 내 정렬 순서'
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
    modelName: 'Audio',
    tableName: 'audios',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
      {
        fields: ['pageId']
      },
      {
        fields: ['pageId', 'sortOrder']
      },
      {
        fields: ['s3Key']
      },
      {
        fields: ['uploadedBy']
      }
    ]
  }
);

export default Audio; 