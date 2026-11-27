import { AppError } from "../errors/AppError";
import { isUuid } from "../models/validators";
import type { CrudRepository } from "../repositories/interfaces";

/**
 * Serviço genérico: concentra validação, regras de negócio e orquestração do CRUD.
 * Cada entidade herda e sobrescreve os "hooks" com suas regras específicas.
 */
export abstract class BaseService<T extends { id: string }> {
  constructor(
    protected repo: CrudRepository<T>,
    protected label: string,
  ) {}

  /** Campos que podem ser gravados (ignora id, created_at e qualquer outro campo). */
  protected abstract fields: string[];
  protected abstract validate(body: any): string[];

  /** Normaliza os dados (trim, lowercase...) antes das regras. */
  protected normalize(body: any): any {
    return body;
  }
  /** Regras de negócio executadas antes de criar/atualizar. */
  protected async beforeSave(_data: any, _current?: T): Promise<void> {}
  /** Regras de negócio executadas antes de excluir. */
  protected async beforeDelete(_current: T): Promise<void> {}

  protected assertId(id: string): void {
    if (!isUuid(id)) throw new AppError(400, "ID inválido: deve ser um UUID");
  }

  private pick(body: any): any {
    const data: any = {};
    for (const f of this.fields) if (body[f] !== undefined) data[f] = body[f];
    return this.normalize(data);
  }

  private check(body: any): void {
    const errors = this.validate(body);
    if (errors.length) throw new AppError(400, "Dados inválidos", errors);
  }

  async list(): Promise<T[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<T> {
    this.assertId(id);
    const item = await this.repo.findById(id);
    if (!item) throw new AppError(404, `${this.label} não encontrado(a)`);
    return item;
  }

  async create(body: any): Promise<T> {
    const data = this.pick(body);
    this.check(data);
    await this.beforeSave(data);
    return this.repo.create(data);
  }

  async update(id: string, body: any): Promise<T> {
    this.assertId(id);

    const current = await this.getById(id);
    const data = this.pick(body);

    this.check(data);
    await this.beforeSave(data, current);

    const item = await this.repo.update(id, data);
    if (!item) throw new AppError(404, `${this.label} não encontrado(a)`);
    return item;
  }

  async delete(id: string): Promise<void> {
    const current = await this.getById(id);
    await this.beforeDelete(current);
    const removed = await this.repo.delete(id);
    if (!removed) throw new AppError(404, `${this.label} não encontrado(a)`);
  }
}
