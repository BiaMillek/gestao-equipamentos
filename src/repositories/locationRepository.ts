import { Location } from '../models/location';
import { BaseRepository } from './baseRepository';
export const locationRepository = new BaseRepository<Location>('locations');
