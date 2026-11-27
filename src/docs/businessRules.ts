import { AppError } from "../errors/AppError";
import { equipmentRepository } from "../repositories/equipmentRepository";
import { locationRepository } from "../repositories/locationRepository";
import { technicianRepository } from "../repositories/technicianRepository";
import { EquipmentService } from "../services/equipmentService";
import { LocationService } from "../services/locationService";
import { TechnicianService } from "../services/technicianService";

const MISSING = "00000000-0000-4000-8000-000000000000";

const equipments = new EquipmentService(
  equipmentRepository,
  locationRepository,
  technicianRepository,
);
const locations = new LocationService(locationRepository, equipmentRepository);
const technicians = new TechnicianService(
  technicianRepository,
  equipmentRepository,
);

interface Outcome {
  status: number;
  message?: string;
}

/** Executa a ação e devolve o status HTTP equivalente (AppError => status da regra). */
async function attempt(
  fn: () => Promise<unknown>,
  okStatus = 200,
): Promise<Outcome> {
  try {
    await fn();
    return { status: okStatus };
  } catch (e: any) {
    if (e instanceof AppError) return { status: e.status, message: e.message };
    return { status: 500, message: e?.message ?? "Erro inesperado" };
  }
}

/** Cria os dados do cenário (com sufixo único) e os remove no final. */
class Ctx {
  private sfx = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  private n = 0;
  private ids = {
    equipments: [] as string[],
    technicians: [] as string[],
    locations: [] as string[],
  };

  uniq() {
    return `${this.sfx}-${++this.n}`;
  }

  async location(extra: any = {}) {
    const loc = await locations.create({
      name: `RN Local ${this.uniq()}`,
      ...extra,
    });
    this.ids.locations.push(loc.id);
    return loc;
  }

  async technician(extra: any = {}) {
    const tech = await technicians.create({
      name: "RN Técnico",
      email: `rn-${this.uniq()}@teste.com`,
      ...extra,
    });
    this.ids.technicians.push(tech.id);
    return tech;
  }

  body(locationId: string, extra: any = {}) {
    return {
      name: "RN Notebook",
      serial_number: `RN-${this.uniq()}`,
      location_id: locationId,
      ...extra,
    };
  }

  async equipment(locationId: string, extra: any = {}) {
    const body = this.body(locationId, extra);
    const eq = await equipments.create(body);
    this.ids.equipments.push(eq.id);
    return { eq, body };
  }

  async cleanup() {
    for (const id of this.ids.equipments)
      await equipmentRepository.delete(id).catch(() => {});
    for (const id of this.ids.technicians)
      await technicianRepository.delete(id).catch(() => {});
    for (const id of this.ids.locations)
      await locationRepository.delete(id).catch(() => {});
  }
}

export interface BusinessRule {
  id: string;
  entidade: "Equipamentos" | "Técnicos" | "Locais";
  regra: string;
  esperado: number;
  run: (c: Ctx) => Promise<Outcome>;
}

export const businessRules: BusinessRule[] = [
  // ---------- Equipamentos ----------
  {
    id: "equip-serie-duplicada",
    entidade: "Equipamentos",
    esperado: 409,
    regra: "Número de série deve ser único",
    run: async (c) => {
      const loc = await c.location();
      const { body } = await c.equipment(loc.id);
      return attempt(() => equipments.create({ ...body }));
    },
  },
  {
    id: "equip-local-inexistente",
    entidade: "Equipamentos",
    esperado: 422,
    regra: "O local informado deve existir",
    run: async (c) => attempt(() => equipments.create(c.body(MISSING))),
  },
  {
    id: "equip-local-inativo",
    entidade: "Equipamentos",
    esperado: 422,
    regra: "Não é possível alocar equipamento em local inativo",
    run: async (c) => {
      const loc = await c.location({ active: false });
      return attempt(() => equipments.create(c.body(loc.id)));
    },
  },
  {
    id: "equip-tecnico-inexistente",
    entidade: "Equipamentos",
    esperado: 422,
    regra: "O técnico informado deve existir",
    run: async (c) => {
      const loc = await c.location();
      return attempt(() =>
        equipments.create(
          c.body(loc.id, { status: "em_uso", technician_id: MISSING }),
        ),
      );
    },
  },
  {
    id: "equip-tecnico-inativo",
    entidade: "Equipamentos",
    esperado: 422,
    regra: "Não é possível vincular técnico inativo",
    run: async (c) => {
      const loc = await c.location();
      const tech = await c.technician({ active: false });
      return attempt(() =>
        equipments.create(
          c.body(loc.id, { status: "em_uso", technician_id: tech.id }),
        ),
      );
    },
  },
  {
    id: "equip-em-uso-sem-tecnico",
    entidade: "Equipamentos",
    esperado: 400,
    regra: "Status em_uso exige técnico responsável",
    run: async (c) => {
      const loc = await c.location();
      return attempt(() =>
        equipments.create(c.body(loc.id, { status: "em_uso" })),
      );
    },
  },
  {
    id: "equip-disponivel-com-tecnico",
    entidade: "Equipamentos",
    esperado: 422,
    regra: "Equipamento disponível não pode ter técnico responsável",
    run: async (c) => {
      const loc = await c.location();
      const tech = await c.technician();
      return attempt(() =>
        equipments.create(
          c.body(loc.id, { status: "disponivel", technician_id: tech.id }),
        ),
      );
    },
  },
  {
    id: "equip-baixado-nao-reativa",
    entidade: "Equipamentos",
    esperado: 422,
    regra: "Equipamento baixado não pode mudar de status",
    run: async (c) => {
      const loc = await c.location();
      const { eq, body } = await c.equipment(loc.id, { status: "baixado" });
      return attempt(() =>
        equipments.update(eq.id, { ...body, status: "disponivel" }),
      );
    },
  },
  {
    id: "equip-em-uso-nao-exclui",
    entidade: "Equipamentos",
    esperado: 409,
    regra: "Equipamento em uso não pode ser excluído",
    run: async (c) => {
      const loc = await c.location();
      const tech = await c.technician();
      const { eq } = await c.equipment(loc.id, {
        status: "em_uso",
        technician_id: tech.id,
      });
      return attempt(() => equipments.delete(eq.id));
    },
  },
  {
    id: "equip-em-uso-valido",
    entidade: "Equipamentos",
    esperado: 201,
    regra:
      "Caminho feliz: equipamento em uso com técnico ativo e local ativo é criado",
    run: async (c) => {
      const loc = await c.location();
      const tech = await c.technician();
      return attempt(async () => {
        await c.equipment(loc.id, { status: "em_uso", technician_id: tech.id });
      }, 201);
    },
  },

  // ---------- Técnicos ----------
  {
    id: "tec-email-duplicado",
    entidade: "Técnicos",
    esperado: 409,
    regra: "E-mail deve ser único (comparado em minúsculas)",
    run: async (c) => {
      const tech = await c.technician();
      return attempt(() =>
        technicians.create({ name: "Outro", email: tech.email.toUpperCase() }),
      );
    },
  },
  {
    id: "tec-email-normalizado",
    entidade: "Técnicos",
    esperado: 201,
    regra: "E-mail é salvo em minúsculas",
    run: async (c) => {
      const tech = await c.technician({ email: `RN-${c.uniq()}@TESTE.COM` });
      return tech.email === tech.email.toLowerCase()
        ? { status: 201 }
        : { status: 500, message: `E-mail salvo como ${tech.email}` };
    },
  },
  {
    id: "tec-desativar-com-equip",
    entidade: "Técnicos",
    esperado: 409,
    regra: "Técnico responsável por equipamentos não pode ser desativado",
    run: async (c) => {
      const loc = await c.location();
      const tech = await c.technician();
      await c.equipment(loc.id, { status: "em_uso", technician_id: tech.id });
      return attempt(() =>
        technicians.update(tech.id, {
          name: tech.name,
          email: tech.email,
          active: false,
        }),
      );
    },
  },
  {
    id: "tec-excluir-com-equip",
    entidade: "Técnicos",
    esperado: 409,
    regra: "Técnico com equipamentos vinculados não pode ser excluído",
    run: async (c) => {
      const loc = await c.location();
      const tech = await c.technician();
      await c.equipment(loc.id, { status: "em_uso", technician_id: tech.id });
      return attempt(() => technicians.delete(tech.id));
    },
  },

  // ---------- Locais ----------
  {
    id: "local-desativar-com-equip",
    entidade: "Locais",
    esperado: 409,
    regra: "Local com equipamentos (não baixados) não pode ser desativado",
    run: async (c) => {
      const loc = await c.location();
      await c.equipment(loc.id);
      return attempt(() =>
        locations.update(loc.id, { name: loc.name, active: false }),
      );
    },
  },
  {
    id: "local-desativar-so-baixados",
    entidade: "Locais",
    esperado: 200,
    regra: "Local que só guarda equipamentos baixados pode ser desativado",
    run: async (c) => {
      const loc = await c.location();
      await c.equipment(loc.id, { status: "baixado" });
      return attempt(() =>
        locations.update(loc.id, { name: loc.name, active: false }),
      );
    },
  },
  {
    id: "local-excluir-com-equip",
    entidade: "Locais",
    esperado: 409,
    regra: "Local com equipamentos vinculados não pode ser excluído",
    run: async (c) => {
      const loc = await c.location();
      await c.equipment(loc.id);
      return attempt(() => locations.delete(loc.id));
    },
  },
];

export interface RuleResult {
  regra: string;
  entidade: string;
  descricao: string;
  esperado: number;
  obtido: number;
  passou: boolean;
  mensagem: string | null;
}

export async function runRule(rule: BusinessRule): Promise<RuleResult> {
  const c = new Ctx();
  const base = {
    regra: rule.id,
    entidade: rule.entidade,
    descricao: rule.regra,
    esperado: rule.esperado,
  };
  try {
    const out = await rule.run(c);
    return {
      ...base,
      obtido: out.status,
      passou: out.status === rule.esperado,
      mensagem: out.message ?? null,
    };
  } catch (e: any) {
    return {
      ...base,
      obtido: 500,
      passou: false,
      mensagem: `Falha na preparação do cenário: ${e?.message ?? e}`,
    };
  } finally {
    await c.cleanup();
  }
}
