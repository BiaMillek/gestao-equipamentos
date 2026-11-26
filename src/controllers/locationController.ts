import { equipmentRepository } from '../repositories/equipmentRepository';
import { locationRepository } from '../repositories/locationRepository';
import { LocationService } from '../services/locationService';
import { CrudController } from './crudController';
export const locationController = new CrudController(new LocationService(locationRepository, equipmentRepository));
