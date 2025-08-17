// 모든 모델들을 중앙에서 관리하는 파일
import { sequelize } from '../config/database';
import User from './User';
import Academy from './Academy';
import LectureMaterial from './LectureMaterial';
import Page from './Page';
import PdfUploadSession from './PdfUploadSession';
import Audio from './Audio';
import UserFavoriteMaterial from './UserFavoriteMaterial';

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

// LectureMaterial - LectureMaterial 관계 (자기참조, N:1)
LectureMaterial.belongsTo(LectureMaterial, {
  foreignKey: 'parentId',
  as: 'parent',
  onDelete: 'CASCADE',  // 상위 폴더 삭제 시 하위 항목도 모두 삭제
  onUpdate: 'CASCADE'
});

LectureMaterial.hasMany(LectureMaterial, {
  foreignKey: 'parentId',
  as: 'children',
  onDelete: 'CASCADE'  // 상위 폴더 삭제 시 하위 항목도 모두 삭제
});

// LectureMaterial - Page 관계 (1:N)
LectureMaterial.hasMany(Page, {
  foreignKey: 'lectureMaterialId',
  as: 'pages',
  onDelete: 'CASCADE',  // 교재 삭제 시 페이지도 함께 삭제
  onUpdate: 'CASCADE'
});

Page.belongsTo(LectureMaterial, {
  foreignKey: 'lectureMaterialId',
  as: 'material'
});

// Page - Audio 관계 (1:N)
Page.hasMany(Audio, {
  foreignKey: 'pageId',
  as: 'audios',
  onDelete: 'CASCADE',  // 페이지 삭제 시 오디오도 함께 삭제
  onUpdate: 'CASCADE'
});

Audio.belongsTo(Page, {
  foreignKey: 'pageId',
  as: 'page'
});

// PdfUploadSession - LectureMaterial 관계 (N:1)
PdfUploadSession.belongsTo(LectureMaterial, {
  foreignKey: 'parentId',
  as: 'parent',
  onDelete: 'SET NULL'  // 상위 폴더 삭제 시 세션의 parentId를 NULL로 설정
});

// User - LectureMaterial 즐겨찾기 관계 (N:N)
User.belongsToMany(LectureMaterial, {
  through: UserFavoriteMaterial,
  as: 'favoriteMaterials',
  foreignKey: 'userId',
  otherKey: 'lectureMaterialId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

LectureMaterial.belongsToMany(User, {
  through: UserFavoriteMaterial,
  as: 'favoritedBy',
  foreignKey: 'lectureMaterialId',
  otherKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 모든 모델들을 객체로 export
export const models = {
  User,
  Academy,
  LectureMaterial,
  Page,
  PdfUploadSession,
  Audio,
  UserFavoriteMaterial
};

// Sequelize 인스턴스도 export
export { sequelize };

// 개별 모델들도 export (편의성을 위해)
export { User, Academy, LectureMaterial, Page, PdfUploadSession, Audio, UserFavoriteMaterial };

export default models; 