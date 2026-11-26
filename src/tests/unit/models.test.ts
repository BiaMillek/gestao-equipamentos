import { describe, expect, it } from 'vitest';
import { validateEquipment } from '../../models/equipment';
import { validateLocation } from '../../models/location';
import { validateTechnician } from '../../models/technician';
import { isUuid } from '../../models/validators';
import { ID } from './helpers';

describe('validadores dos models', () => {
  it('isUuid aceita UUID e rejeita outros valores', () => {
    expect(isUuid(ID)).toBe(true);
    expect(isUuid('123')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('validateEquipment aceita objeto válido', () => {
    expect(validateEquipment({ name: 'A', serial_number: 'S', location_id: ID })).toEqual([]);
  });

  it('validateEquipment retorna todos os erros', () => {
    const errors = validateEquipment({ status: 'x', technician_id: '1', active: 'a' });
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });

  it('validateTechnician valida e-mail', () => {
    expect(validateTechnician({ name: 'A', email: 'a@a.com' })).toEqual([]);
    expect(validateTechnician({ name: '', email: 'x' })).toHaveLength(2);
  });

  it('validateLocation valida description', () => {
    expect(validateLocation({ name: 'A', description: 5 })).toEqual(['description deve ser texto']);
  });
});
