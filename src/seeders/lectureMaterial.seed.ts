import { LectureMaterial } from '../models/LectureMaterial';

/**
 * 교재/폴더 시드 데이터 생성
 */
export const seedLectureMaterials = async () => {
  try {
    console.log('📚 교재/폴더 시드 데이터 생성 시작...');

    // 기존 데이터 삭제
    await LectureMaterial.destroy({ where: {} });

    // 루트 카테고리 생성
    const elementaryCategory = await LectureMaterial.create({
      folderName: '초등 교재',
      type: 'category',
      level: 0,
      isActive: true,
      isFavorite: false
    });

    const middleCategory = await LectureMaterial.create({
      folderName: '중등 교재',
      type: 'category',
      level: 0,
      isActive: true,
      isFavorite: false
    });

    // 초등 하위 카테고리 생성
    const elementary1Grade = await LectureMaterial.create({
      folderName: '1학년',
      parentId: elementaryCategory.id,
      type: 'category',
      level: 1,
      isActive: true,
      isFavorite: false
    });

    const elementary2Grade = await LectureMaterial.create({
      folderName: '2학년',
      parentId: elementaryCategory.id,
      type: 'category',
      level: 1,
      isActive: true,
      isFavorite: false
    });

    // 초등 1학년 교재 생성
    await LectureMaterial.create({
      folderName: '기초 문법 1',
      parentId: elementary1Grade.id,
      type: 'book',
      level: 2,
      originalFileName: 'elementary_grammar_1.pdf',
      totalPages: 50,
      isActive: true,
      isFavorite: true
    });

    await LectureMaterial.create({
      folderName: '기초 단어 1',
      parentId: elementary1Grade.id,
      type: 'book',
      level: 2,
      originalFileName: 'elementary_vocabulary_1.pdf',
      totalPages: 30,
      isActive: true,
      isFavorite: false
    });

    // 초등 2학년 교재 생성
    await LectureMaterial.create({
      folderName: '기초 문법 2',
      parentId: elementary2Grade.id,
      type: 'book',
      level: 2,
      originalFileName: 'elementary_grammar_2.pdf',
      totalPages: 60,
      isActive: true,
      isFavorite: false
    });

    // 중등 하위 카테고리 생성
    const middle1Grade = await LectureMaterial.create({
      folderName: '1학년',
      parentId: middleCategory.id,
      type: 'category',
      level: 1,
      isActive: true,
      isFavorite: false
    });

    // 중등 1학년 교재 생성
    await LectureMaterial.create({
      folderName: '중급 문법 1',
      parentId: middle1Grade.id,
      type: 'book',
      level: 2,
      originalFileName: 'middle_grammar_1.pdf',
      totalPages: 80,
      isActive: true,
      isFavorite: true
    });

    console.log('✅ 교재/폴더 시드 데이터 생성 완료!');
    console.log('   - 루트 카테고리: 2개 (초등, 중등)');
    console.log('   - 하위 카테고리: 3개 (초등 1,2학년, 중등 1학년)');
    console.log('   - 교재: 4개 (기초 문법 1,2, 기초 단어 1, 중급 문법 1)');

  } catch (error) {
    console.error('❌ 교재/폴더 시드 데이터 생성 실패:', error);
    throw error;
  }
}; 