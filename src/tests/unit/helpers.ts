import { vi } from 'vitest';

export const ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
export const ID2 = '11111111-1111-4111-8111-111111111111';
export const ID3 = '22222222-2222-4222-8222-222222222222';

export const mockCrudRepo = () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(async (p: any) => ({ id: ID, ...p })),
  update: vi.fn(async (id: string, p: any) => ({ id, ...p })),
  delete: vi.fn(async () => true),
});

export const mockEquipmentRepo = () => ({
  ...mockCrudRepo(),
  findBySerialNumber: vi.fn(async () => null),
  countByLocation: vi.fn(async () => 0),
  countByTechnician: vi.fn(async () => 0),
});

export const mockTechnicianRepo = () => ({
  ...mockCrudRepo(),
  findByEmail: vi.fn(async () => null),
});
