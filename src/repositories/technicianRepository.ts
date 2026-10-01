import { Technician } from '../models/technician';
import { BaseRepository } from './baseRepository';
export const technicianRepository = new BaseRepository<Technician>('technicians');
