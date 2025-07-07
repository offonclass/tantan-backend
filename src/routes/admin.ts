import { Router } from 'express';
import { academyController } from '../controllers/admin/academy.controller';
import { userController } from '../controllers/admin/user.controller';

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

export default router; 