import type { Equipment } from '../models/equipment';
import type { Technician } from '../models/technician';

/** Contrato genérico de persistência (permite trocar/mocar a implementação). */
export interface CrudRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(payload: Partial<T>): Promise<T>;
  update(id: string, payload: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface EquipmentRepositoryPort extends CrudRepository<Equipment> {
  findBySerialNumber(serialNumber: string): Promise<Equipment | null>;
  countByLocation(locationId: string, excludeBaixado?: boolean): Promise<number>;
  countByTechnician(technicianId: string): Promise<number>;
}

export interface TechnicianRepositoryPort extends CrudRepository<Technician> {
  findByEmail(email: string): Promise<Technician | null>;
}
