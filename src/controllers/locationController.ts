import { validateLocation } from '../models/location';
import { locationRepository } from '../repositories/locationRepository';
import { createController } from './crudController';
export const locationController = createController(locationRepository, validateLocation, 'Local');
