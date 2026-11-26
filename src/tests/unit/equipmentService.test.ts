import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../errors/AppError';
import { EquipmentService } from '../../services/equipmentService';
import { ID, ID2, ID3, mockCrudRepo, mockEquipmentRepo } from './helpers';

let equipments: ReturnType<typeof mockEquipmentRepo>;
let locations: ReturnType<typeof mockCrudRepo>;
let technicians: ReturnType<typeof mockCrudRepo>;
let service: EquipmentService;

const valid = { name: 'Notebook', serial_number: 'SN-1', location_id: ID2 };

async function status(promise: Promise<unknown>) {
  try { await promise; return 200; } catch (e) { return e instanceof AppError ? e.status : 500; }
}

beforeEach(() => {
  equipments = mockEquipmentRepo();
  locations = mockCrudRepo();
  technicians = mockCrudRepo();
  locations.findById.mockResolvedValue({ id: ID2, name: 'Almox', active: true });
  technicians.findById.mockResolvedValue({ id: ID3, name: 'Carlos', email: 'c@c.com', active: true });
  service = new EquipmentService(equipments as any, locations as any, technicians as any);
});

describe('EquipmentService - criação', () => {
  it('cria equipamento válido e remove campos não permitidos', async () => {
    const created = await service.create({ ...valid, id: 'hack', created_at: 'x' });
    expect(equipments.create).toHaveBeenCalledWith({ name: 'Notebook', serial_number: 'SN-1', location_id: ID2 });
    expect(created.name).toBe('Notebook');
  });

  it('rejeita dados inválidos com 400 e lista de detalhes', async () => {
    await expect(service.create({})).rejects.toMatchObject({ status: 400, details: expect.any(Array) });
    expect(equipments.create).not.toHaveBeenCalled();
  });

  it('exige técnico quando status = em_uso', async () => {
    expect(await status(service.create({ ...valid, status: 'em_uso' }))).toBe(400);
  });

  it('rejeita número de série duplicado (409)', async () => {
    equipments.findBySerialNumber.mockResolvedValue({ id: ID, serial_number: 'SN-1' });
    expect(await status(service.create(valid))).toBe(409);
  });

  it('rejeita local inexistente (422)', async () => {
    locations.findById.mockResolvedValue(null);
    expect(await status(service.create(valid))).toBe(422);
  });

  it('rejeita local inativo (422)', async () => {
    locations.findById.mockResolvedValue({ id: ID2, active: false });
    expect(await status(service.create(valid))).toBe(422);
  });

  it('rejeita técnico inexistente (422)', async () => {
    technicians.findById.mockResolvedValue(null);
    expect(await status(service.create({ ...valid, status: 'em_uso', technician_id: ID3 }))).toBe(422);
  });

  it('rejeita técnico inativo (422)', async () => {
    technicians.findById.mockResolvedValue({ id: ID3, active: false });
    expect(await status(service.create({ ...valid, status: 'em_uso', technician_id: ID3 }))).toBe(422);
  });

  it('rejeita equipamento disponível com técnico (422)', async () => {
    expect(await status(service.create({ ...valid, status: 'disponivel', technician_id: ID3 }))).toBe(422);
  });

  it('aceita equipamento em uso com técnico ativo', async () => {
    expect(await status(service.create({ ...valid, status: 'em_uso', technician_id: ID3 }))).toBe(200);
  });
});

describe('EquipmentService - consulta, atualização e exclusão', () => {
  it('lista equipamentos', async () => {
    equipments.findAll.mockResolvedValue([{ id: ID }]);
    expect(await service.list()).toEqual([{ id: ID }]);
  });

  it('rejeita ID inválido (400)', async () => {
    expect(await status(service.getById('abc'))).toBe(400);
  });

  it('retorna 404 quando não encontra', async () => {
    equipments.findById.mockResolvedValue(null);
    expect(await status(service.getById(ID))).toBe(404);
  });

  it('atualiza equipamento existente', async () => {
    equipments.findById.mockResolvedValue({ id: ID, ...valid, status: 'disponivel' });
    const updated = await service.update(ID, { ...valid, status: 'manutencao' });
    expect(updated.status).toBe('manutencao');
  });

  it('permite manter o mesmo número de série ao atualizar o próprio registro', async () => {
    equipments.findById.mockResolvedValue({ id: ID, ...valid, status: 'disponivel' });
    equipments.findBySerialNumber.mockResolvedValue({ id: ID });
    expect(await status(service.update(ID, valid))).toBe(200);
  });

  it('não permite reativar equipamento baixado (422)', async () => {
    equipments.findById.mockResolvedValue({ id: ID, ...valid, status: 'baixado', location_id: ID2 });
    expect(await status(service.update(ID, { ...valid, status: 'disponivel' }))).toBe(422);
  });

  it('não permite excluir equipamento em uso (409)', async () => {
    equipments.findById.mockResolvedValue({ id: ID, status: 'em_uso' });
    expect(await status(service.delete(ID))).toBe(409);
    expect(equipments.delete).not.toHaveBeenCalled();
  });

  it('exclui equipamento disponível', async () => {
    equipments.findById.mockResolvedValue({ id: ID, status: 'disponivel' });
    await service.delete(ID);
    expect(equipments.delete).toHaveBeenCalledWith(ID);
  });
});
