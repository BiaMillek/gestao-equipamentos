import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { isUuid } from '../models/equipment';
import { BaseRepository } from '../repositories/baseRepository';

type Validator = (body: any) => string[];
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

function getId(req: Request): string {
  const id = req.params.id;
  if (!isUuid(id)) throw new AppError(400, 'ID inválido: deve ser um UUID');
  return id;
}

function check(body: any, validate: Validator) {
  const errors = validate(body);
  if (errors.length) throw new AppError(400, 'Dados inválidos', errors);
}

export function createController<T>(repo: BaseRepository<T>, validate: Validator, label: string) {
  const notFound = () => new AppError(404, `${label} não encontrado(a)`);
  return {
    list: wrap(async (_req, res) => { res.status(200).json(await repo.findAll()); }),
    getById: wrap(async (req, res) => {
      const item = await repo.findById(getId(req));
      if (!item) throw notFound();
      res.status(200).json(item);
    }),
    create: wrap(async (req, res) => {
      check(req.body, validate);
      res.status(201).json(await repo.create(req.body));
    }),
    update: wrap(async (req, res) => {
      const id = getId(req);
      check(req.body, validate);
      const { id: _ignored, ...payload } = req.body;
      const item = await repo.update(id, payload);
      if (!item) throw notFound();
      res.status(200).json(item);
    }),
    remove: wrap(async (req, res) => {
      if (!(await repo.delete(getId(req)))) throw notFound();
      res.status(204).send();
    }),
  };
}
