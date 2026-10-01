import { supabase } from '../config/supabase';

export class BaseRepository<T> {
  constructor(private table: string, private select = '*') {}

  async findAll(): Promise<T[]> {
    const { data, error } = await supabase.from(this.table).select(this.select).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as T[];
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await supabase.from(this.table).select(this.select).eq('id', id).maybeSingle();
    if (error) throw error;
    return data as unknown as T | null;
  }

  async create(payload: Partial<T>): Promise<T> {
    const { data, error } = await supabase.from(this.table).insert(payload as any).select().single();
    if (error) throw error;
    return data as T;
  }

  async update(id: string, payload: Partial<T>): Promise<T | null> {
    const { data, error } = await supabase.from(this.table).update(payload as any).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as T | null;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await supabase.from(this.table).delete().eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data !== null;
  }
}
