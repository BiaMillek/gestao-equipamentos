import { AppError } from '../errors/AppError';
import { Location, validateLocation } from '../models/location';
import type { CrudRepository, EquipmentRepositoryPort } from '../repositories/interfaces';
import { BaseService } from './baseService';

export class LocationService extends BaseService<Location> {
  protected fields = ['name', 'description', 'active'];

  constructor(repo: CrudRepository<Location>, private equipments: EquipmentRepositoryPort) {
    super(repo, 'Local');
  }

  protected validate(body: any) {
    return validateLocation(body);
  }

  protected normalize(data: any) {
    if (typeof data.name === 'string') data.name = data.name.trim();
    return data;
  }

  // Regra: não é possível desativar um local que ainda guarda equipamentos (não baixados).
  protected async beforeSave(data: any, current?: Location) {
    if (current && data.active === false && current.active) {
      if ((await this.equipments.countByLocation(current.id, true)) > 0)
        throw new AppError(409, 'Não é possível desativar um local que possui equipamentos');
    }
  }

  // Regra: não é possível excluir um local que possui equipamentos vinculados.
  protected async beforeDelete(current: Location) {
    if ((await this.equipments.countByLocation(current.id)) > 0)
      throw new AppError(409, 'Não é possível excluir um local que possui equipamentos vinculados');
  }
}
