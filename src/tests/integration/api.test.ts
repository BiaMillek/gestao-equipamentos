import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../app';
import { supabase } from '../../config/supabase';

/**
 * Testes de integração: usam o Supabase configurado no .env.
 * Todos os registros têm sufixo único e são removidos no afterAll.
 */
const run = Date.now().toString();
const MISSING = '00000000-0000-4000-8000-000000000000';
const created = { equipments: [] as string[], technicians: [] as string[], locations: [] as string[] };

let locationId: string;
let technicianId: string;

const newEquipment = (suffix: string, extra: any = {}) => ({
  name: `Notebook ${suffix}`, brand: 'Dell', model: 'Latitude',
  serial_number: `SN-${run}-${suffix}`, location_id: locationId, ...extra,
});

async function makeEquipment(suffix: string, extra: any = {}) {
  const res = await request(app).post('/equipments').send(newEquipment(suffix, extra));
  if (res.status === 201) created.equipments.push(res.body.id);
  return res;
}

beforeAll(async () => {
  const loc = await request(app).post('/locations').send({ name: `Local ${run}`, description: 'teste' });
  locationId = loc.body.id; created.locations.push(locationId);
  const tech = await request(app).post('/technicians').send({ name: `Tec ${run}`, email: `tec-${run}@teste.com` });
  technicianId = tech.body.id; created.technicians.push(technicianId);
});

afterAll(async () => {
  // limpeza direta no banco (ordem respeita as chaves estrangeiras)
  for (const id of created.equipments) await supabase.from('equipments').delete().eq('id', id);
  for (const id of created.technicians) await supabase.from('technicians').delete().eq('id', id);
  for (const id of created.locations) await supabase.from('locations').delete().eq('id', id);
});

describe('Geral', () => {
  it('GET / retorna status ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  it('rota inexistente retorna 404', async () => {
    expect((await request(app).get('/nada')).status).toBe(404);
  });
  it('JSON malformado retorna 400', async () => {
    const res = await request(app).post('/locations').set('Content-Type', 'application/json').send('{ruim');
    expect(res.status).toBe(400);
  });
  it('Swagger disponível em /api-docs e /api-docs.json', async () => {
    expect((await request(app).get('/api-docs.json')).body.openapi).toBeDefined();
    expect((await request(app).get('/api-docs/')).status).toBe(200);
  });
});

describe('Locais (/locations)', () => {
  let id: string;
  it('POST cria local (201)', async () => {
    const res = await request(app).post('/locations').send({ name: `Sala ${run}`, description: 'Bloco A' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: `Sala ${run}`, active: true });
    id = res.body.id; created.locations.push(id);
  });
  it('POST sem nome retorna 400', async () => {
    const res = await request(app).post('/locations').send({});
    expect(res.status).toBe(400);
    expect(res.body.details).toContain('name é obrigatório');
  });
  it('GET lista locais (200)', async () => {
    const res = await request(app).get('/locations');
    expect(res.status).toBe(200);
    expect(res.body.some((l: any) => l.id === id)).toBe(true);
  });
  it('GET por id (200)', async () => {
    const res = await request(app).get(`/locations/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });
  it('GET id inválido (400) e inexistente (404)', async () => {
    expect((await request(app).get('/locations/abc')).status).toBe(400);
    expect((await request(app).get(`/locations/${MISSING}`)).status).toBe(404);
  });
  it('PUT atualiza (200)', async () => {
    const res = await request(app).put(`/locations/${id}`).send({ name: `Sala B ${run}` });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(`Sala B ${run}`);
  });
  it('PUT inexistente retorna 404', async () => {
    expect((await request(app).put(`/locations/${MISSING}`).send({ name: 'x' })).status).toBe(404);
  });
  it('DELETE remove (204) e depois retorna 404', async () => {
    expect((await request(app).delete(`/locations/${id}`)).status).toBe(204);
    expect((await request(app).get(`/locations/${id}`)).status).toBe(404);
    expect((await request(app).delete(`/locations/${id}`)).status).toBe(404);
  });
});

describe('Técnicos (/technicians)', () => {
  let id: string;
  const email = () => `tecnico-${run}@teste.com`;
  it('POST cria técnico (201) com e-mail normalizado', async () => {
    const res = await request(app).post('/technicians').send({ name: 'Maria', email: email().toUpperCase() });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email());
    id = res.body.id; created.technicians.push(id);
  });
  it('POST com e-mail inválido retorna 400', async () => {
    expect((await request(app).post('/technicians').send({ name: 'X', email: 'x' })).status).toBe(400);
  });
  it('POST com e-mail duplicado retorna 409', async () => {
    expect((await request(app).post('/technicians').send({ name: 'Y', email: email() })).status).toBe(409);
  });
  it('GET lista e consulta por id (200)', async () => {
    const list = await request(app).get('/technicians');
    expect(list.status).toBe(200);
    expect(list.body.some((t: any) => t.id === id)).toBe(true);
    const one = await request(app).get(`/technicians/${id}`);
    expect(one.status).toBe(200);
    expect(one.body.name).toBe('Maria');
  });
  it('GET inexistente retorna 404', async () => {
    expect((await request(app).get(`/technicians/${MISSING}`)).status).toBe(404);
  });
  it('PUT atualiza (200)', async () => {
    const res = await request(app).put(`/technicians/${id}`).send({ name: 'Maria Souza', email: email() });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Maria Souza');
  });
  it('DELETE remove (204)', async () => {
    expect((await request(app).delete(`/technicians/${id}`)).status).toBe(204);
    expect((await request(app).get(`/technicians/${id}`)).status).toBe(404);
  });
});

describe('Equipamentos (/equipments)', () => {
  let id: string;
  it('POST cria equipamento (201) com status padrão disponivel', async () => {
    const res = await makeEquipment('a');
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('disponivel');
    id = res.body.id;
  });
  it('POST sem campos obrigatórios retorna 400', async () => {
    expect((await request(app).post('/equipments').send({})).status).toBe(400);
  });
  it('GET lista equipamentos com local relacionado', async () => {
    const res = await request(app).get('/equipments');
    expect(res.status).toBe(200);
    const item = res.body.find((e: any) => e.id === id);
    expect(item.location.id).toBe(locationId);
  });
  it('GET por id (200), inválido (400) e inexistente (404)', async () => {
    const res = await request(app).get(`/equipments/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.serial_number).toBe(`SN-${run}-a`);
    expect((await request(app).get('/equipments/xyz')).status).toBe(400);
    expect((await request(app).get(`/equipments/${MISSING}`)).status).toBe(404);
  });
  it('PUT atualiza status para manutencao (200)', async () => {
    const res = await request(app).put(`/equipments/${id}`).send(newEquipment('a', { status: 'manutencao' }));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('manutencao');
  });
  it('PUT inexistente retorna 404', async () => {
    expect((await request(app).put(`/equipments/${MISSING}`).send(newEquipment('z'))).status).toBe(404);
  });
  it('DELETE remove (204) e depois retorna 404', async () => {
    const res = await makeEquipment('del');
    expect((await request(app).delete(`/equipments/${res.body.id}`)).status).toBe(204);
    expect((await request(app).get(`/equipments/${res.body.id}`)).status).toBe(404);
  });

  describe('regras de negócio', () => {
    it('número de série duplicado retorna 409', async () => {
      expect((await makeEquipment('a')).status).toBe(409);
    });
    it('local inexistente retorna 422', async () => {
      const res = await request(app).post('/equipments').send(newEquipment('loc', { location_id: MISSING }));
      expect(res.status).toBe(422);
    });
    it('técnico inexistente retorna 422', async () => {
      const res = await makeEquipment('tec', { status: 'em_uso', technician_id: MISSING });
      expect(res.status).toBe(422);
    });
    it('status em_uso sem técnico retorna 400', async () => {
      expect((await makeEquipment('uso0', { status: 'em_uso' })).status).toBe(400);
    });
    it('status disponivel com técnico retorna 422', async () => {
      expect((await makeEquipment('disp', { status: 'disponivel', technician_id: technicianId })).status).toBe(422);
    });
    it('equipamento em uso não pode ser excluído (409) e bloqueia exclusão de técnico e local', async () => {
      const res = await makeEquipment('uso', { status: 'em_uso', technician_id: technicianId });
      expect(res.status).toBe(201);
      expect((await request(app).delete(`/equipments/${res.body.id}`)).status).toBe(409);
      expect((await request(app).delete(`/technicians/${technicianId}`)).status).toBe(409);
      expect((await request(app).delete(`/locations/${locationId}`)).status).toBe(409);
    });
    it('equipamento baixado não pode ser reativado (422)', async () => {
      const res = await makeEquipment('baixa', { status: 'baixado' });
      expect(res.status).toBe(201);
      const upd = await request(app).put(`/equipments/${res.body.id}`).send(newEquipment('baixa', { status: 'disponivel' }));
      expect(upd.status).toBe(422);
    });
    it('local com equipamentos não pode ser desativado (409)', async () => {
      const res = await request(app).put(`/locations/${locationId}`).send({ name: `Local ${run}`, active: false });
      expect(res.status).toBe(409);
    });
  });
});
