export const STATUSES = ['disponivel', 'em_uso', 'manutencao', 'baixado'] as const;
export type EquipmentStatus = (typeof STATUSES)[number];

export interface Equipment {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serial_number: string;
  status: EquipmentStatus;
  location_id: string;
  technician_id?: string | null;
  active: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: any) => typeof v === 'string' && UUID.test(v);

export function validateEquipment(b: any): string[] {
  const e: string[] = [];
  if (typeof b?.name !== 'string' || !b.name.trim()) e.push('name é obrigatório');
  if (typeof b?.serial_number !== 'string' || !b.serial_number.trim()) e.push('serial_number é obrigatório');
  if (b?.status != null && !STATUSES.includes(b.status)) e.push(`status deve ser um de: ${STATUSES.join(', ')}`);
  if (!isUuid(b?.location_id)) e.push('location_id deve ser um UUID válido');
  if (b?.technician_id != null && !isUuid(b.technician_id)) e.push('technician_id deve ser um UUID válido');
  if (b?.status === 'em_uso' && b?.technician_id == null) e.push('technician_id é obrigatório quando status = em_uso');
  if (b?.active != null && typeof b.active !== 'boolean') e.push('active deve ser boolean');
  return e;
}
