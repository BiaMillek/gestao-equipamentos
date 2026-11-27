import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../../errors/AppError";
import { TechnicianService } from "../../services/technicianService";
import { ID, ID2, mockEquipmentRepo, mockTechnicianRepo } from "./helpers";

let techs: ReturnType<typeof mockTechnicianRepo>;
let equipments: ReturnType<typeof mockEquipmentRepo>;
let service: TechnicianService;

async function status(p: Promise<unknown>) {
  try {
    await p;
    return 200;
  } catch (e) {
    return e instanceof AppError ? e.status : 500;
  }
}

beforeEach(() => {
  techs = mockTechnicianRepo();
  equipments = mockEquipmentRepo();
  service = new TechnicianService(techs as any, equipments as any);
});

// Agrupa os testes relacionados ao TechnicianService
describe("TechnicianService", () => {
  it("cria técnico normalizando e-mail e nome", async () => {
    // dados enviados para a criação do técnico
    // chama o serviço (technician)
    await service.create({ name: "  Carlos  ", email: " CARLOS@Empresa.COM " });

    // verifica se os dados enviados ao repositorio correspondem ao esperado
    expect(techs.create).toHaveBeenCalledWith({
      name: "Carlos",
      email: "carlos@empresa.com",
    });
  });

  // Define o comportamento específico de teste
  it("rejeita e-mail inválido (400)", async () => {
    expect(await status(service.create({ name: "A", email: "invalido" }))).toBe(
      400,
    );
  });

  it("rejeita e-mail duplicado (409)", async () => {
    techs.findByEmail.mockResolvedValue({ id: ID2 } as any);
    expect(await status(service.create({ name: "A", email: "a@a.com" }))).toBe(
      409,
    );
  });

  it("permite atualizar mantendo o próprio e-mail", async () => {
    techs.findById.mockResolvedValue({
      id: ID,
      name: "A",
      email: "a@a.com",
      active: true,
    });
    techs.findByEmail.mockResolvedValue({ id: ID } as any);
    expect(
      await status(service.update(ID, { name: "B", email: "a@a.com" })),
    ).toBe(200);
  });

  it("não desativa técnico com equipamentos (409)", async () => {
    techs.findById.mockResolvedValue({
      id: ID,
      name: "A",
      email: "a@a.com",
      active: true,
    });
    equipments.countByTechnician.mockResolvedValue(2);
    expect(
      await status(
        service.update(ID, { name: "A", email: "a@a.com", active: false }),
      ),
    ).toBe(409);
  });

  it("desativa técnico sem equipamentos", async () => {
    techs.findById.mockResolvedValue({
      id: ID,
      name: "A",
      email: "a@a.com",
      active: true,
    });
    expect(
      await status(
        service.update(ID, { name: "A", email: "a@a.com", active: false }),
      ),
    ).toBe(200);
  });

  it("não exclui técnico com equipamentos vinculados (409)", async () => {
    techs.findById.mockResolvedValue({ id: ID });
    equipments.countByTechnician.mockResolvedValue(1);
    expect(await status(service.delete(ID))).toBe(409);
    expect(techs.delete).not.toHaveBeenCalled();
  });

  it("exclui técnico sem vínculos", async () => {
    techs.findById.mockResolvedValue({ id: ID });
    await service.delete(ID);
    expect(techs.delete).toHaveBeenCalledWith(ID);
  });

  it("retorna 404 ao excluir técnico inexistente", async () => {
    techs.findById.mockResolvedValue(null);
    expect(await status(service.delete(ID))).toBe(404);
  });
});
