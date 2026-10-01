import { Router } from 'express';

export function crudRouter(c: {
  list: any; getById: any; create: any; update: any; remove: any;
}) {
  const r = Router();
  r.get('/', c.list);
  r.get('/:id', c.getById);
  r.post('/', c.create);
  r.put('/:id', c.update);
  r.delete('/:id', c.remove);
  return r;
}
