import { supabase } from '../config/supabase';
import { Equipment } from '../models/equipment';
import { BaseRepository } from './baseRepository';
import type { EquipmentRepositoryPort } from './interfaces';

export class EquipmentRepository extends BaseRepository<Equipment> implements EquipmentRepositoryPort {
  constructor() {
    super('equipments', '*, location:locations(id,name), technician:technicians(id,name)');
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment | null> {
    const { data, error } = await supabase.from(this.table).select('*').eq('serial_number', serialNumber).maybeSingle();
    if (error) throw error;
    return data as Equipment | null;
  }

  async countByLocation(locationId: string, excludeBaixado = false): Promise<number> {
    let query = supabase.from(this.table).select('id', { count: 'exact', head: true }).eq('location_id', locationId);
    if (excludeBaixado) query = query.neq('status', 'baixado');
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async countByTechnician(technicianId: string): Promise<number> {
    const { count, error } = await supabase
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('technician_id', technicianId);
    if (error) throw error;
    return count ?? 0;
  }
}

export const equipmentRepository = new EquipmentRepository();
