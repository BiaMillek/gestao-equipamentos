export interface Technician {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export function validateTechnician(b: any): string[] {
  const e: string[] = [];
  if (typeof b?.name !== 'string' || !b.name.trim()) e.push('name é obrigatório');
  if (typeof b?.email !== 'string' || !/^\S+@\S+\.\S+$/.test(b.email)) e.push('email inválido');
  if (b?.active != null && typeof b.active !== 'boolean') e.push('active deve ser boolean');
  return e;
}
