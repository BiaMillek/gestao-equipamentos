# TI Estoque API

## 1. Descrição
API REST para **gerenciamento de estoque de equipamentos do setor de TI**. Resolve o problema de controle disperso de notebooks, monitores, periféricos etc., permitindo saber **onde** cada equipamento está, **qual técnico** é responsável e qual seu **status** (disponível, em uso, em manutenção, baixado).
Domínio: gestão de ativos de TI.

## 2. Integrantes
- Bianca Mazepa Millek
- Gustavo Britto Triaquim

## 3. Tecnologias
Node.js, TypeScript, Express, Supabase, PostgreSQL, Vitest, Supertest, @vitest/coverage-v8, Swagger/OpenAPI (swagger-ui-express), Git, dotenv, cors, tsx.

## 4. Entidades e relacionamento
**Location (locations)**: id, name, description, active
**Technician (technicians)**: id, name, email, active
**Equipment (equipments)**: id, name, brand, model, serial_number, status, location_id, technician_id, active

- Um Local possui vários Equipamentos; cada Equipamento está em um Local (`location_id`, obrigatório).
- Um Técnico é responsável por vários Equipamentos; cada Equipamento pode ter um Técnico (`technician_id`, opcional; obrigatório se `status = em_uso`).
- Status permitidos: `disponivel`, `em_uso`, `manutencao`, `baixado`.

## 5. Estrutura
```
src/
├── config/        # conexão Supabase
├── controllers/   # camada HTTP (traduz requisição/resposta, chama o Service)
├── docs/          # especificação Swagger/OpenAPI
├── errors/        # AppError
├── middlewares/   # tratamento de erros e 404
├── models/        # interfaces e validações de formato
├── repositories/  # acesso ao Supabase/PostgreSQL (classes)
├── routes/        # rotas Express
├── services/      # regras de negócio (classes)
├── tests/         # unit/ (Services com mocks) e integration/ (Supertest)
├── app.ts
└── server.ts
database/schema.sql
vitest.config.ts
```

Fluxo: `Route → Controller → Service (regras) → Repository → Supabase`. Os Services recebem os repositories por construtor (injeção de dependência), o que permite usar mocks nos testes unitários.

## 6. Configuração e execução
```bash
git clone <url-do-repositorio>
cd ti-estoque-api
npm install
cp .env.example .env   # preencha com suas credenciais
npm run dev
```

## 7. Variáveis de ambiente
| Variável | Descrição |
|---|---|
| PORT | Porta da API (padrão 3000) |
| SUPABASE_URL | URL do projeto Supabase |
| SUPABASE_KEY | Chave de acesso do Supabase |

O `.env` real **não** é versionado (ver `.gitignore`).

## 8. Banco de dados
Execute `database/schema.sql` no SQL Editor do Supabase. Cria as tabelas `locations`, `technicians` e `equipments` (FKs para as duas primeiras, IDs UUID, `serial_number` e `email` únicos, `status` com CHECK).

## 9. Regras de negócio
**Equipamentos**
- Número de série único (409).
- O local informado deve existir e estar ativo (422); o técnico, quando informado, deve existir e estar ativo (422).
- `status = em_uso` exige técnico (400); `status = disponivel` não pode ter técnico (422).
- Equipamento `baixado` não pode mudar de status (422).
- Equipamento `em_uso` não pode ser excluído (409).

**Técnicos**
- E-mail único e normalizado em minúsculas (409).
- Não pode ser desativado nem excluído se for responsável por equipamentos (409).

**Locais**
- Não pode ser desativado se tiver equipamentos (não baixados) nem excluído se tiver equipamentos vinculados (409).

## 10. Endpoints
Recursos: `/equipments`, `/locations`, `/technicians` (mesmo padrão para os três).

| Método | Endpoint | Descrição | Sucesso |
|---|---|---|---|
| GET | /{recurso} | Lista todos | 200 |
| GET | /{recurso}/:id | Consulta por ID | 200 |
| POST | /{recurso} | Cadastra | 201 |
| PUT | /{recurso}/:id | Atualiza | 200 |
| DELETE | /{recurso}/:id | Remove | 204 |

Erros: 400 (validação/ID inválido), 404 (não encontrado), 409 (conflito/duplicidade/registro em uso), 422 (regra de negócio não atendida), 500.
Documentação interativa: `GET /api-docs` (JSON em `/api-docs.json`).
Obs.: `GET /equipments` retorna também `location` e `technician` (nome).

## 11. Exemplos
**POST /locations**
```json
{ "name": "Almoxarifado TI", "description": "Sala 101, bloco A", "active": true }
```
**POST /technicians**
```json
{ "name": "Carlos Silva", "email": "carlos@empresa.com", "active": true }
```
**POST /equipments**
```json
{
  "name": "Notebook Dell Latitude",
  "brand": "Dell",
  "model": "Latitude 5440",
  "serial_number": "SN-000123",
  "status": "em_uso",
  "location_id": "<uuid-do-local>",
  "technician_id": "<uuid-do-tecnico>",
  "active": true
}
```
**PUT /equipments/:id** (envia o objeto completo, ex.: mudar para manutenção)
```json
{
  "name": "Notebook Dell Latitude",
  "serial_number": "SN-000123",
  "status": "manutencao",
  "location_id": "<uuid-do-local>"
}
```

## 12. Testes automatizados e cobertura
Ferramentas: **Vitest**, **Supertest** e **@vitest/coverage-v8**.

- `src/tests/unit/`: testes unitários dos Services, validadores e tratador de erros (repositories mockados, sem banco).
- `src/tests/integration/`: testes de integração dos endpoints das 3 entidades (Supertest + Supabase real).

```bash
npm test                 # todos os testes
npm run test:unit        # somente unitários
npm run test:integration # somente integração
npm run test:coverage    # testes + relatório de cobertura (falha se < 60%)
```
O relatório fica em `coverage/` (abra `coverage/index.html`). Limiar configurado em `vitest.config.ts`: 60% em linhas, instruções, funções e branches. Excluídos da medição apenas os testes e `src/server.ts` (ponto de entrada que só chama `listen`).

**Cuidados com o banco:** os testes de integração usam o Supabase do `.env` (use um projeto/banco de testes). Cada execução cria registros com sufixo único e os remove ao final (`afterAll`), podendo ser executados várias vezes.

**Cobertura alcançada:** _(preencher com o resultado de `npm run test:coverage`)_

| Métrica | Cobertura |
|---|---|
| Statements | __% |
| Branches | __% |
| Functions | __% |
| Lines | __% |

## 13. Documentação Swagger
Com a API rodando (`npm run dev`), acesse **http://localhost:3000/api-docs**. Lá é possível ver todos os endpoints, os schemas, exemplos e testar as requisições pelo botão *Try it out*.


## CREATE TABLE DO SUPABASE

-- =========================================
-- TI ESTOQUE API - ESTRUTURA DO BANCO
-- =========================================

-- 1. TABELA DE LOCALIZAÇÕES
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. TABELA DE TÉCNICOS
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. TABELA DE EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS public.equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(150) NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'disponivel',

    location_id UUID NOT NULL,
    technician_id UUID,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_equipment_location
        FOREIGN KEY (location_id)
        REFERENCES public.locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_equipment_technician
        FOREIGN KEY (technician_id)
        REFERENCES public.technicians(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_equipment_status
        CHECK (status IN (
            'disponivel',
            'em_uso',
            'manutencao',
            'baixado'
        ))
);

-- =========================================
-- ÍNDICES PARA RELACIONAMENTOS
-- =========================================

CREATE INDEX IF NOT EXISTS idx_equipments_location
    ON public.equipments(location_id);

CREATE INDEX IF NOT EXISTS idx_equipments_technician
    ON public.equipments(technician_id);

