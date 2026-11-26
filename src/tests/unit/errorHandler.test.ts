import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { errorHandler, notFound } from '../../middlewares/errorHandler';

function res() {
  const r: any = {};
  r.status = vi.fn(() => r);
  r.json = vi.fn(() => r);
  return r;
}
const call = (err: any) => { const r = res(); errorHandler(err, {} as any, r, vi.fn()); return r; };

describe('errorHandler', () => {
  it('responde com status do AppError', () => {
    const r = call(new AppError(422, 'regra', ['x']));
    expect(r.status).toHaveBeenCalledWith(422);
    expect(r.json).toHaveBeenCalledWith({ error: 'regra', details: ['x'] });
  });
  it('traduz violação de FK (23503) em 409', () => expect(call({ code: '23503' }).status).toHaveBeenCalledWith(409));
  it('traduz duplicidade (23505) em 409', () => expect(call({ code: '23505' }).status).toHaveBeenCalledWith(409));
  it('traduz JSON inválido em 400', () => expect(call({ type: 'entity.parse.failed' }).status).toHaveBeenCalledWith(400));
  it('erro desconhecido vira 500', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(call(new Error('boom')).status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
  it('notFound responde 404', () => {
    const r = res(); notFound({} as any, r);
    expect(r.status).toHaveBeenCalledWith(404);
  });
});
