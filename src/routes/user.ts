import { Router } from 'express';
import { userLectureMaterialController } from '../controllers/user/lectureMaterial.controller';

const router: Router = Router();

/**
 * 사용자용 교재/폴더 관련 라우트
 */

// 교재/폴더 트리 조회
router.post('/get-materials-tree', userLectureMaterialController.getTree);

// 교재 상세 정보 조회
router.get('/material/:id', userLectureMaterialController.getMaterialDetail);

export default router; 