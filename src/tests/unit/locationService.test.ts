import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../errors/AppError';
import { LocationService } from '../../services/locationService';
import { ID, mockCrudRepo, mockEquipmentRepo } from './helpers';

let repo: ReturnType<typeof mockCrudRepo>;
let equipments: ReturnType<typeof mockEquipmentRepo>;
let service: LocationService;

async function status(p: Promise<unknown>) {
  try { await p; return 200; } catch (e) { return e instanceof AppError ? e.status : 500; }
}

beforeEach(() => {
  repo = mockCrudRepo();
  equipments = mockEquipmentRepo();
  service = new LocationService(repo as any, equipments as any);
});

describe('LocationService', () => {
  it('cria local e remove espaços do nome', async () => {
    await service.create({ name: '  Almox  ', description: 'Sala 1' });
    expect(repo.create).toHaveBeenCalledWith({ name: 'Almox', description: 'Sala 1' });
  });

  it('rejeita nome vazio (400)', async () => {
    expect(await status(service.create({ name: '   ' }))).toBe(400);
  });

  it('rejeita active não booleano (400)', async () => {
    expect(await status(service.create({ name: 'A', active: 'sim' }))).toBe(400);
  });

  it('não desativa local com equipamentos (409)', async () => {
    repo.findById.mockResolvedValue({ id: ID, name: 'A', active: true });
    equipments.countByLocation.mockResolvedValue(3);
    expect(await status(service.update(ID, { name: 'A', active: false }))).toBe(409);
  });

  it('desativa local vazio', async () => {
    repo.findById.mockResolvedValue({ id: ID, name: 'A', active: true });
    expect(await status(service.update(ID, { name: 'A', active: false }))).toBe(200);
  });

  it('não exclui local com equipamentos (409)', async () => {
    repo.findById.mockResolvedValue({ id: ID });
    equipments.countByLocation.mockResolvedValue(1);
    expect(await status(service.delete(ID))).toBe(409);
  });

  it('exclui local sem equipamentos', async () => {
    repo.findById.mockResolvedValue({ id: ID });
    await service.delete(ID);
    expect(repo.delete).toHaveBeenCalledWith(ID);
  });
});
