import { equipmentRepository } from '../repositories/equipmentRepository';
import { locationRepository } from '../repositories/locationRepository';
import { technicianRepository } from '../repositories/technicianRepository';
import { EquipmentService } from '../services/equipmentService';
import { CrudController } from './crudController';
export const equipmentController = new CrudController(
  new EquipmentService(equipmentRepository, locationRepository, technicianRepository)
);
