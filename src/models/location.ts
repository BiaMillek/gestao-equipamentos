export interface Location {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export function validateLocation(b: any): string[] {
  const e: string[] = [];
  if (typeof b?.name !== 'string' || !b.name.trim()) e.push('name é obrigatório');
  if (b?.description != null && typeof b.description !== 'string') e.push('description deve ser texto');
  if (b?.active != null && typeof b.active !== 'boolean') e.push('active deve ser boolean');
  return e;
}
