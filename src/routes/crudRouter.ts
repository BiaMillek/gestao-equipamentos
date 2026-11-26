import { Router } from 'express';
import type { CrudController } from '../controllers/crudController';

export function crudRouter(c: CrudController) {
  const r = Router();
  r.get('/', c.list);
  r.get('/:id', c.getById);
  r.post('/', c.create);
  r.put('/:id', c.update);
  r.delete('/:id', c.remove);
  return r;
}
