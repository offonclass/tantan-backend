// 모든 모델들을 중앙에서 관리하는 파일
import { sequelize } from '../config/database';
import User from './User';
import Academy from './Academy';

// 모델들 간의 관계 설정
// User - Academy 관계 (N:1)
User.belongsTo(Academy, { 
  foreignKey: 'academyId', 
  as: 'academy',
  onDelete: 'SET NULL',  // 학원 삭제 시 사용자의 academyId를 NULL로 설정
  onUpdate: 'CASCADE'    // 학원 ID 변경 시 사용자의 academyId도 함께 업데이트
});

Academy.hasMany(User, { 
  foreignKey: 'academyId', 
  as: 'users',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// 모든 모델들을 객체로 export
export const models = {
  User,
  Academy,
  // 추후 PDF, Report 모델 등 추가 예정
};

// Sequelize 인스턴스도 export
export { sequelize };

// 개별 모델들도 export (편의성을 위해)
export { User, Academy };

export default models; 