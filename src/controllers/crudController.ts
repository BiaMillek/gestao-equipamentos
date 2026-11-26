import { NextFunction, Request, Response } from 'express';

interface CrudService {
  list(): Promise<unknown[]>;
  getById(id: string): Promise<unknown>;
  create(body: any): Promise<unknown>;
  update(id: string, body: any): Promise<unknown>;
  delete(id: string): Promise<void>;
}

type Handler = (req: Request, res: Response) => Promise<void>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

/** Controller genérico: só traduz HTTP <-> Service (sem regras de negócio). */
export class CrudController {
  constructor(private service: CrudService) {}

  list = wrap(async (_req, res) => {
    res.status(200).json(await this.service.list());
  });
  getById = wrap(async (req, res) => {
    res.status(200).json(await this.service.getById(req.params.id));
  });
  create = wrap(async (req, res) => {
    res.status(201).json(await this.service.create(req.body));
  });
  update = wrap(async (req, res) => {
    res.status(200).json(await this.service.update(req.params.id, req.body));
  });
  remove = wrap(async (req, res) => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  });
}
