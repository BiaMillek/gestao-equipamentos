import { equipmentRepository } from '../repositories/equipmentRepository';
import { technicianRepository } from '../repositories/technicianRepository';
import { TechnicianService } from '../services/technicianService';
import { CrudController } from './crudController';
export const technicianController = new CrudController(new TechnicianService(technicianRepository, equipmentRepository));
