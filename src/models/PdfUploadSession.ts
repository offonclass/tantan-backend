import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

// PDF 업로드 세션 모델의 속성 인터페이스 정의
export interface PdfUploadSessionAttributes {
  id: number;
  uploadId: string;
  tempKey: string;
  materialName: string;
  parentId?: number;
  status: 'pending' | 'completed' | 'failed';
  originalFileName: string;
  fileSize: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 생성 시 필요한 속성 (id, timestamps는 자동 생성)
export interface PdfUploadSessionCreationAttributes extends Optional<PdfUploadSessionAttributes, 
  'id' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'uploadId' | 'tempKey'
> {}

// PdfUploadSession 모델 클래스 정의
export class PdfUploadSession extends Model<PdfUploadSessionAttributes, PdfUploadSessionCreationAttributes> implements PdfUploadSessionAttributes {
  public id!: number;
  public uploadId!: string;
  public tempKey!: string;
  public materialName!: string;
  public parentId?: number;
  public status!: 'pending' | 'completed' | 'failed';
  public originalFileName!: string;
  public fileSize!: number;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// PdfUploadSession 모델 정의 및 테이블 스키마 설정
PdfUploadSession.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '업로드 세션 고유 ID'
    },
    uploadId: {
      type: DataTypes.UUID,
      defaultValue: () => crypto.randomUUID(),
      allowNull: false,
      unique: true,
      comment: '업로드 세션 UUID'
    },
    tempKey: {
      type: DataTypes.STRING(500),
      allowNull: true,  // 초기에는 null 허용, 나중에 업데이트
      comment: 'S3 임시 저장 경로'
    },
    materialName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      },
      comment: '교재 표시 이름'
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '상위 폴더 ID'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '업로드 상태'
    },
    originalFileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '원본 PDF 파일명'
    },
    fileSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '파일 크기 (bytes)'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,  // nullable로 변경
      comment: '업로드 세션 만료 시간 (선택사항)'
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
    modelName: 'PdfUploadSession',
    tableName: 'pdf_upload_sessions',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['uploadId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiresAt']  // 인덱스는 유지
      }
    ]
  }
);

export default PdfUploadSession; 