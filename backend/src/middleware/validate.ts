import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestField = 'body' | 'query' | 'params';

/**
 * Middleware: валидация запроса через Zod
 */
export const validate = (schema: ZodSchema, field: RequestField = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[field]);
      req[field] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          message: 'Ошибка валидации',
          errors,
        });
        return;
      }
      next(error);
    }
  };
};
