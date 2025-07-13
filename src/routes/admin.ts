import { Router } from 'express';
import { academyController } from '../controllers/admin/academy.controller';
import { userController } from '../controllers/admin/user.controller';
import { lectureMaterialController } from '../controllers/admin/lectureMaterial.controller';
import { pdfUploadController } from '../controllers/admin/pdfUpload.controller';

const router: Router = Router();

// 가맹학원 관리 라우트 (단순 데이터 송수신)
router.post('/get-academies', academyController.getAcademies);
router.post('/create-academy', academyController.createAcademy);
router.post('/update-academy', academyController.updateAcademy);
router.post('/delete-academy', academyController.deleteAcademy);

// 사용자 계정 관리 라우트 (단순 데이터 송수신)
router.post('/get-users', userController.getUsers);
router.post('/create-user', userController.createUser);
router.post('/update-user', userController.updateUser);
router.post('/delete-user', userController.deleteUser);

// 교재/폴더 관리 라우트 (단순 데이터 송수신)
router.post('/get-materials-tree', lectureMaterialController.getTree);
router.post('/create-material', lectureMaterialController.createMaterial);
router.post('/update-material', lectureMaterialController.updateMaterial);
router.post('/delete-material', lectureMaterialController.deleteMaterial);

// PDF 업로드 관련 라우트
router.post('/get-pdf-upload-url', pdfUploadController.getUploadUrl);      // Presigned URL 발급
router.post('/conversion-complete', pdfUploadController.conversionComplete);      // Presigned URL 발급
router.get('/pdf-conversion/:uuid', pdfUploadController.subscribeToConversion);      // SSE 연결

export default router; 