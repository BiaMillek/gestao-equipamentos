import { AppError } from '../errors/AppError';
import { Technician, validateTechnician } from '../models/technician';
import type { EquipmentRepositoryPort, TechnicianRepositoryPort } from '../repositories/interfaces';
import { BaseService } from './baseService';

export class TechnicianService extends BaseService<Technician> {
  protected fields = ['name', 'email', 'active'];

  constructor(private technicians: TechnicianRepositoryPort, private equipments: EquipmentRepositoryPort) {
    super(technicians, 'Técnico');
  }

  protected validate(body: any) {
    return validateTechnician(body);
  }

  protected normalize(data: any) {
    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
    return data;
  }

  protected async beforeSave(data: any, current?: Technician) {
    // Regra: e-mail único entre os técnicos.
    if (data.email) {
      const other = await this.technicians.findByEmail(data.email);
      if (other && other.id !== current?.id) throw new AppError(409, 'Já existe um técnico com este e-mail');
    }
    // Regra: não desativar técnico que ainda é responsável por equipamentos.
    if (current && data.active === false && current.active) {
      if ((await this.equipments.countByTechnician(current.id)) > 0)
        throw new AppError(409, 'Não é possível desativar um técnico responsável por equipamentos');
    }
  }

  // Regra: não excluir técnico com equipamentos vinculados.
  protected async beforeDelete(current: Technician) {
    if ((await this.equipments.countByTechnician(current.id)) > 0)
      throw new AppError(409, 'Não é possível excluir um técnico com equipamentos vinculados');
  }
}
