// 모든 모델들을 중앙에서 관리하는 파일
import { sequelize } from '../config/database';
import User from './User';

// 모델들 간의 관계 설정이 필요한 경우 여기서 정의
// 예: User.hasMany(Academy), Academy.belongsTo(User) 등

// 모든 모델들을 객체로 export
export const models = {
  User,
  // 추후 Academy, PDF, Report 모델 등 추가 예정
};

// Sequelize 인스턴스도 export
export { sequelize };

// 개별 모델들도 export (편의성을 위해)
export { User };

export default models; 