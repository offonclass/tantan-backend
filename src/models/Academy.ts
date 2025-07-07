import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 가맹학원 모델의 속성 인터페이스 정의
export interface AcademyAttributes {
  id: number;
  campusName: string;      // 캠퍼스명
  region: string;          // 지역명
  contactNumber?: string;  // 담당자 번호 (선택)
  isActive: boolean;       // 활성화 상태
  isExisted: boolean;      // 존재 여부 (삭제 시 false)
  createdAt: Date;         // 생성일
  updatedAt: Date;         // 수정일
}

// 가맹학원 생성 시 필요한 속성 (id, timestamps는 자동 생성)
export interface AcademyCreationAttributes extends Optional<AcademyAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isExisted' | 'contactNumber'> {}

// Academy 모델 클래스 정의
export class Academy extends Model<AcademyAttributes, AcademyCreationAttributes> implements AcademyAttributes {
  public id!: number;
  public campusName!: string;
  public region!: string;
  public contactNumber!: string;
  public isActive!: boolean;
  public isExisted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 학원 비활성화 메서드
  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  // 학원 활성화 메서드
  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  // 학원 정보 업데이트 메서드
  public async updateInfo(data: Partial<Pick<AcademyAttributes, 'campusName' | 'region' | 'contactNumber'>>): Promise<void> {
    if (data.campusName) this.campusName = data.campusName;
    if (data.region) this.region = data.region;
    if (data.contactNumber !== undefined) this.contactNumber = data.contactNumber;
    await this.save();
  }

  // 학원 삭제 메서드 (isExisted = false)
  public async softDelete(): Promise<void> {
    this.isExisted = false;
    await this.save();
  }
}

// Academy 모델 정의 및 테이블 스키마 설정
Academy.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '가맹학원 고유 ID'
    },
    campusName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      },
      comment: '캠퍼스명'
    },
    region: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [2, 255],
        notEmpty: true
      },
      comment: '지역명 (예: 서울 강남구)'
    },
    contactNumber: {
      type: DataTypes.STRING(20),
      allowNull: true, // 선택사항으로 변경
      validate: {
        is: /^010-\d{4}-\d{4}$/, // 010-0000-0000 형식 검증
      },
      comment: '담당자 연락처 (010-0000-0000 형식, 선택사항)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '학원 활성화 상태'
    },
    isExisted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '학원 존재 여부 (삭제 시 false)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '학원 등록일'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '학원 정보 수정일'
    }
  },
  {
    sequelize,
    modelName: 'Academy',
    tableName: 'academies',
    timestamps: true,
    underscored: false, // camelCase 사용
    indexes: [
      {
        fields: ['campusName']  // 캠퍼스명 검색 최적화
      },
      {
        fields: ['region']       // 지역별 검색 최적화
      },
      {
        fields: ['isActive']    // 활성화 상태 필터링 최적화
      },
      {
        fields: ['isExisted']   // 존재 여부 필터링 최적화
      },
      {
        fields: ['createdAt']   // 생성일 정렬 최적화
      }
    ],
    hooks: {
      // 학원 생성 전 데이터 검증
      beforeCreate: async (academy: Academy) => {
        // 캠퍼스명 트리밍 및 정규화
        academy.campusName = academy.campusName.trim();
        academy.region = academy.region.trim();
        if (academy.contactNumber) {
          academy.contactNumber = academy.contactNumber.trim();
        }
        
      },
      // 학원 수정 전 데이터 검증
      beforeUpdate: async (academy: Academy) => {
        if (academy.changed('campusName')) {
          academy.campusName = academy.campusName.trim();
        }
        if (academy.changed('region')) {
          academy.region = academy.region.trim();
        }
        if (academy.changed('contactNumber') && academy.contactNumber) {
          academy.contactNumber = academy.contactNumber.trim();
        }
        
      }
    }
  }
);

export default Academy; 