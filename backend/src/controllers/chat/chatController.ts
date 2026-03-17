import { Request, Response, NextFunction } from 'express';
import { processMessage, ChatMessage } from '../../services/chatbot';
import { sendSuccess } from '../../utils/apiResponse';

export const sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Сообщение не может быть пустым' });
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Сообщение слишком длинное (макс. 500 символов)' });
    }

    // Use provided sessionId or generate one
    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const response = await processMessage(sid, message.trim());

    sendSuccess(res, {
      sessionId: sid,
      message: response,
    });
  } catch (error) {
    next(error);
  }
};
