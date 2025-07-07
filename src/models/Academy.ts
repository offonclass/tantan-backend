import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 가맹학원 모델의 속성 인터페이스 정의
export interface AcademyAttributes {
  id: number;
  campus_name: string;     // 캠퍼스명
  region: string;          // 지역명
  contact_number?: string; // 담당자 번호 (선택)
  is_active: boolean;      // 활성화 상태
  is_existed: boolean;     // 존재 여부 (삭제 시 false)
  created_at: Date;        // 생성일
  updated_at: Date;        // 수정일
}

// 가맹학원 생성 시 필요한 속성 (id, timestamps는 자동 생성)
export interface AcademyCreationAttributes extends Optional<AcademyAttributes, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'is_existed' | 'contact_number'> {}

// Academy 모델 클래스 정의
export class Academy extends Model<AcademyAttributes, AcademyCreationAttributes> implements AcademyAttributes {
  public id!: number;
  public campus_name!: string;
  public region!: string;
  public contact_number!: string;
  public is_active!: boolean;
  public is_existed!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // 학원 비활성화 메서드
  public async deactivate(): Promise<void> {
    this.is_active = false;
    await this.save();
  }

  // 학원 활성화 메서드
  public async activate(): Promise<void> {
    this.is_active = true;
    await this.save();
  }

  // 학원 정보 업데이트 메서드
  public async updateInfo(data: Partial<Pick<AcademyAttributes, 'campus_name' | 'region' | 'contact_number'>>): Promise<void> {
    if (data.campus_name) this.campus_name = data.campus_name;
    if (data.region) this.region = data.region;
    if (data.contact_number !== undefined) this.contact_number = data.contact_number;
    await this.save();
  }

  // 학원 삭제 메서드 (is_existed = false)
  public async softDelete(): Promise<void> {
    this.is_existed = false;
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
    campus_name: {
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
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true, // 선택사항으로 변경
      validate: {
        is: /^010-\d{4}-\d{4}$/, // 010-0000-0000 형식 검증
      },
      comment: '담당자 연락처 (010-0000-0000 형식, 선택사항)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '학원 활성화 상태'
    },
    is_existed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '학원 존재 여부 (삭제 시 false)'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '학원 등록일'
    },
    updated_at: {
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
    indexes: [
      {
        fields: ['campus_name']  // 캠퍼스명 검색 최적화
      },
      {
        fields: ['region']       // 지역별 검색 최적화
      },
      {
        fields: ['is_active']    // 활성화 상태 필터링 최적화
      },
      {
        fields: ['is_existed']   // 존재 여부 필터링 최적화
      },
      {
        fields: ['created_at']   // 생성일 정렬 최적화
      }
    ],
    hooks: {
      // 학원 생성 전 데이터 검증
      beforeCreate: async (academy: Academy) => {
        // 캠퍼스명 트리밍 및 정규화
        academy.campus_name = academy.campus_name.trim();
        academy.region = academy.region.trim();
        if (academy.contact_number) {
          academy.contact_number = academy.contact_number.trim();
        }
        
      },
      // 학원 수정 전 데이터 검증
      beforeUpdate: async (academy: Academy) => {
        if (academy.changed('campus_name')) {
          academy.campus_name = academy.campus_name.trim();
        }
        if (academy.changed('region')) {
          academy.region = academy.region.trim();
        }
        if (academy.changed('contact_number') && academy.contact_number) {
          academy.contact_number = academy.contact_number.trim();
        }
        
      }
    }
  }
);

export default Academy; 