import { validateEquipment } from '../models/equipment';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { createController } from './crudController';
export const equipmentController = createController(equipmentRepository, validateEquipment, 'Equipamento');
