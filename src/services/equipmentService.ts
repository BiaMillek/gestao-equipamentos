import { AppError } from '../errors/AppError';
import { Equipment, validateEquipment } from '../models/equipment';
import type {
  CrudRepository,
  EquipmentRepositoryPort,
} from '../repositories/interfaces';
import type { Location } from '../models/location';
import type { Technician } from '../models/technician';
import { BaseService } from './baseService';

export class EquipmentService extends BaseService<Equipment> {
  protected fields = ['name', 'brand', 'model', 'serial_number', 'status', 'location_id', 'technician_id', 'active'];

  constructor(
    private equipments: EquipmentRepositoryPort,
    private locations: CrudRepository<Location>,
    private technicians: CrudRepository<Technician>
  ) {
    super(equipments, 'Equipamento');
  }

  protected validate(body: any) {
    return validateEquipment(body);
  }

  protected normalize(data: any) {
    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.serial_number === 'string') data.serial_number = data.serial_number.trim();
    return data;
  }

  protected async beforeSave(data: any, current?: Equipment) {
    const merged: any = { ...(current ?? {}), ...data };
    const status = merged.status ?? 'disponivel';

    // Regra: número de série único.
    if (data.serial_number) {
      const other = await this.equipments.findBySerialNumber(data.serial_number);
      if (other && other.id !== current?.id) throw new AppError(409, 'Já existe um equipamento com este número de série');
    }

    // Regra: o local deve existir e estar ativo.
    const location = await this.locations.findById(merged.location_id);
    if (!location) throw new AppError(422, 'O local informado não existe');
    if (!location.active && current?.location_id !== merged.location_id)
      throw new AppError(422, 'Não é possível alocar equipamento em um local inativo');

    // Regra: o técnico (quando informado) deve existir e estar ativo.
    if (merged.technician_id) {
      const technician = await this.technicians.findById(merged.technician_id);
      if (!technician) throw new AppError(422, 'O técnico informado não existe');
      if (!technician.active && current?.technician_id !== merged.technician_id)
        throw new AppError(422, 'Não é possível vincular um técnico inativo');
    }

    // Regra: equipamento disponível não pode ter técnico responsável.
    if (status === 'disponivel' && merged.technician_id)
      throw new AppError(422, 'Equipamento disponível não pode ter técnico responsável');

    // Regra: equipamento baixado não pode voltar a ser utilizado.
    if (current?.status === 'baixado' && status !== 'baixado')
      throw new AppError(422, 'Equipamento baixado não pode ter o status alterado');
  }

  // Regra: equipamento em uso não pode ser excluído.
  protected async beforeDelete(current: Equipment) {
    if (current.status === 'em_uso')
      throw new AppError(409, 'Não é possível excluir um equipamento em uso');
  }
}
