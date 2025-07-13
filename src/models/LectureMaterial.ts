import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

// 교재 모델의 속성 인터페이스 정의
export interface LectureMaterialAttributes {
  id: number;
  uuid: string;
  folderName: string;
  parentId?: number;
  level: number;
  sortOrder?: number;
  type: 'category' | 'book';
  originalFileName?: string;
  totalPages?: number;
  uploadedBy?: number;
  isActive: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 교재 생성 시 필요한 속성 (id, timestamps는 자동 생성)
export interface LectureMaterialCreationAttributes extends Optional<LectureMaterialAttributes, 
  'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'parentId' | 'originalFileName' | 'totalPages' | 'uploadedBy' | 'sortOrder'> {}

// LectureMaterial 모델 클래스 정의
export class LectureMaterial extends Model<LectureMaterialAttributes, LectureMaterialCreationAttributes> 
  implements LectureMaterialAttributes {
  
  public id!: number;
  public uuid!: string;
  public folderName!: string;
  public parentId?: number;
  public level!: number;
  public sortOrder?: number;
  public type!: 'category' | 'book';
  public originalFileName?: string;
  public totalPages?: number;
  public uploadedBy?: number;
  public isActive!: boolean;
  public isFavorite!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 하위 항목 조회 메서드
  public async getChildren(): Promise<LectureMaterial[]> {
    return LectureMaterial.findAll({
      where: {
        parentId: this.id,
        isActive: true
      },
      order: [['sortOrder', 'ASC']]
    });
  }

  // 상위 항목 조회 메서드
  public async getParent(): Promise<LectureMaterial | null> {
    if (!this.parentId) return null;
    return LectureMaterial.findOne({
      where: {
        id: this.parentId,
        isActive: true
      }
    });
  }

  // 소프트 삭제 메서드
  public async softDelete(): Promise<void> {
    this.isActive = false;
    await this.save();
  }
}

// LectureMaterial 모델 정의 및 테이블 스키마 설정
LectureMaterial.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '교재/폴더 고유 ID'
    },
    uuid: {
      type: DataTypes.STRING(36),
      defaultValue: () => crypto.randomUUID(),
      allowNull: false,
      unique: true,
      comment: 'S3 저장소 폴더명으로 사용될 UUID'
    },
    folderName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      },
      comment: '사용자에게 보여질 폴더/교재 이름'
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '상위 폴더 ID (self-referencing)'
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '폴더 깊이 (0: 루트, 1: 1단계, ...)'
    },
    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '같은 레벨 내 정렬 순서 (선택사항)'
    },
    type: {
      type: DataTypes.ENUM('category', 'book'),
      allowNull: false,
      comment: '항목 유형 (category: 폴더, book: 교재)'
    },
    originalFileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '원본 PDF 파일명'
    },
    totalPages: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '총 페이지 수'
    },
    uploadedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '업로드한 관리자 ID'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '활성화 상태'
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '즐겨찾기 여부'
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
    modelName: 'LectureMaterial',
    tableName: 'lectureMaterials',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
      {
        fields: ['parentId', 'sortOrder']
      },
      {
        fields: ['type']
      },
      {
        fields: ['uploadedBy']
      },
      {
        fields: ['isFavorite']  // 즐겨찾기 필터링을 위한 인덱스
      }
    ]
  }
);

export default LectureMaterial; 