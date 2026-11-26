import { supabase } from '../config/supabase';
import { Technician } from '../models/technician';
import { BaseRepository } from './baseRepository';
import type { TechnicianRepositoryPort } from './interfaces';

export class TechnicianRepository extends BaseRepository<Technician> implements TechnicianRepositoryPort {
  constructor() {
    super('technicians');
  }

  async findByEmail(email: string): Promise<Technician | null> {
    const { data, error } = await supabase.from(this.table).select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data as Technician | null;
  }
}

export const technicianRepository = new TechnicianRepository();
