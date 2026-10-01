import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Rota não encontrada' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.code === '23503')
    return res.status(409).json({ error: 'Operação viola relacionamento (chave estrangeira inexistente ou registro em uso)' });
  if (err?.code === '23505')
    return res.status(409).json({ error: 'Valor duplicado em campo único' });
  if (err?.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'JSON inválido' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
