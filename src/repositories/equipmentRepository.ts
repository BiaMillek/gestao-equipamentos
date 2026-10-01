import { Equipment } from '../models/equipment';
import { BaseRepository } from './baseRepository';
export const equipmentRepository = new BaseRepository<Equipment>(
  'equipments',
  '*, location:locations(id,name), technician:technicians(id,name)'
);
