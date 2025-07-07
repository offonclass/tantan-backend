import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

// 사용자 모델의 속성 인터페이스 정의
export interface UserAttributes {
  id: number;
  user_id: string; // 로그인 ID (사용자명)
  email?: string; // 이메일 (선택사항)
  phone_number?: string; // 폰번호 (선택사항)
  password: string;
  name: string;
  role: 'system_admin' | 'academy_admin' | 'instructor'; // 시스템 관리자, 학원 관리자, 강사
  academy_id?: number; // 학원 ID (추후 Academy 모델과 연결할 외래키)
  is_active: boolean;
  is_existed: boolean; // 계정 존재 여부 (소프트 삭제용)
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// 사용자 생성 시 필요한 속성 (id, timestamps는 자동 생성)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'last_login_at' | 'academy_id' | 'email' | 'phone_number' | 'is_existed'> {}

// User 모델 클래스 정의
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public user_id!: string;
  public email?: string;
  public phone_number?: string;
  public password!: string;
  public name!: string;
  public role!: 'system_admin' | 'academy_admin' | 'instructor';
  public academy_id?: number;
  public is_active!: boolean;
  public is_existed!: boolean;
  public last_login_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
    this.last_login_at = new Date();
    await this.save();
  }

  // 소프트 삭제 메서드
  public async softDelete(): Promise<void> {
    this.is_existed = false;
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
    user_id: {
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
    academy_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '소속 학원 ID (추후 Academy 모델과 연결할 외래키)'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [0, 20]
      },
      comment: '사용자 폰번호 (선택사항)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '계정 활성화 상태'
    },
    is_existed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '계정 존재 여부 (소프트 삭제용)'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '마지막 로그인 시간'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '계정 생성 시간'
    },
    updated_at: {
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
    indexes: [
      {
        unique: true,
        fields: ['user_id']  // underscored: true 때문에 snake_case 사용
      },
      {
        fields: ['academy_id']
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