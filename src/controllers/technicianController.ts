import { validateTechnician } from '../models/technician';
import { technicianRepository } from '../repositories/technicianRepository';
import { createController } from './crudController';
export const technicianController = createController(technicianRepository, validateTechnician, 'Técnico');
