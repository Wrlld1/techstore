import { Router } from 'express';
import { sendChatMessage } from '../controllers/chat/chatController';

const router = Router();

router.post('/message', sendChatMessage);

export default router;
