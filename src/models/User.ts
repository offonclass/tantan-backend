import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

// 사용자 모델의 속성 인터페이스 정의
export interface UserAttributes {
  id: number;
  userId: string; // 로그인 ID (사용자명)
  email?: string; // 이메일 (선택사항)
  phoneNumber?: string; // 폰번호 (선택사항)
  password: string;
  name: string;
  role: 'system_admin' | 'academy_admin' | 'instructor'; // 시스템 관리자, 학원 관리자, 강사
  academyId?: number; // 학원 ID (추후 Academy 모델과 연결할 외래키)
  isActive: boolean;
  isExisted: boolean; // 계정 존재 여부 (소프트 삭제용)
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 생성 시 필요한 속성 (id, timestamps는 자동 생성)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'academyId' | 'email' | 'phoneNumber' | 'isExisted'> {}

// User 모델 클래스 정의
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public userId!: string;
  public email?: string;
  public phoneNumber?: string;
  public password!: string;
  public name!: string;
  public role!: 'system_admin' | 'academy_admin' | 'instructor';
  public academyId?: number;
  public isActive!: boolean;
  public isExisted!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 비밀번호 검증 메서드
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // 비밀번호 해시화 메서드
  public async hashPassword(): Promise<void> {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  // 마지막 로그인 시간 업데이트
  public async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }

  // 소프트 삭제 메서드
  public async softDelete(): Promise<void> {
    this.isExisted = false;
    await this.save();
  }
}

// User 모델 정의 및 테이블 스키마 설정
User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '사용자 고유 ID'
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      },
      comment: '로그인 ID (사용자명)'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: '올바른 이메일 형식이 아닙니다'
        }
      },
      comment: '사용자 이메일 (선택사항)'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      },
      comment: '해시화된 비밀번호'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100]
      },
      comment: '사용자 이름'
    },
    role: {
      type: DataTypes.ENUM('system_admin', 'academy_admin', 'instructor'),
      allowNull: false,
      defaultValue: 'instructor',
      comment: '사용자 역할 (system_admin: 시스템 관리자, academy_admin: 학원 관리자, instructor: 강사)'
    },
    academyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '소속 학원 ID (추후 Academy 모델과 연결할 외래키)'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [0, 20]
      },
      comment: '사용자 폰번호 (선택사항)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '계정 활성화 상태'
    },
    isExisted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '계정 존재 여부 (소프트 삭제용)'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '마지막 로그인 시간'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '계정 생성 시간'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '계정 정보 수정 시간'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false, // camelCase 사용
    indexes: [
      {
        unique: true,
        fields: ['userId']  // 카멜케이스로 변경
      },
      {
        fields: ['academyId']
      },
      {
        fields: ['role']
      }
    ],
    hooks: {
      // 사용자 생성/수정 전 비밀번호 해시화
      beforeCreate: async (user: User) => {
        if (user.password) {
          await user.hashPassword();
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          await user.hashPassword();
        }
      }
    }
  }
);

export default User; 