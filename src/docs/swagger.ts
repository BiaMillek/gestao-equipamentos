// src/docs/swagger.ts
import { businessRules } from "./businessRules";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description:
    "UUID do registro (copie do campo `id` da resposta do POST ou do GET de listagem)",
};

const errorResp = (description: string, example?: any) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      ...(example ? { example } : {}),
    },
  },
});

const arrayOf = (name: string) => ({
  type: "array",
  items: { $ref: `#/components/schemas/${name}` },
});
const json = (schema: any, extra: any = {}) => ({
  "application/json": { schema, ...extra },
});

const uuidEx = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const missingId = "00000000-0000-4000-8000-000000000000";

type Examples = Record<
  string,
  { summary: string; description?: string; value: any }
>;

interface CrudConfig {
  tag: string;
  base: string;
  schema: string;
  input: string;
  singular: string;
  plural: string;
  postExamples: Examples;
  putExamples: Examples;
  notes: { post: string; get: string; put: string; delete: string };
  errors: { post: any[]; put: any[]; delete: any[] };
}

function crudPaths(c: CrudConfig) {
  const bodyOf = (examples: Examples) => ({
    required: true,
    content: json({ $ref: `#/components/schemas/${c.input}` }, { examples }),
  });
  const ref = { $ref: `#/components/schemas/${c.schema}` };
  const [e400, e409, e422] = c.errors.post;
  const [p400, p409, p422] = c.errors.put;
  const [d409] = c.errors.delete;

  return {
    [`/${c.base}`]: {
      get: {
        tags: [c.tag],
        summary: `Lista todos(as) os(as) ${c.plural}`,
        description: c.notes.get,
        responses: {
          200: {
            description:
              "Lista retornada com sucesso (pode ser um array vazio)",
            content: json(arrayOf(c.schema)),
          },
        },
      },
      post: {
        tags: [c.tag],
        summary: `Cadastra ${c.singular}`,
        description: c.notes.post,
        requestBody: bodyOf(c.postExamples),
        responses: {
          201: { description: "Criado com sucesso", content: json(ref) },
          400: errorResp("Dados inválidos", e400),
          409: errorResp("Conflito (duplicidade)", e409),
          422: errorResp("Regra de negócio não atendida", e422),
        },
      },
    },
    [`/${c.base}/{id}`]: {
      get: {
        tags: [c.tag],
        summary: `Consulta ${c.singular} por ID`,
        parameters: [idParam],
        description: `**Como testar:** use o \`id\` retornado no POST (200); envie \`abc\` (400); envie \`${missingId}\` (404).`,
        responses: {
          200: { description: "Encontrado", content: json(ref) },
          400: errorResp("ID inválido", {
            error: "ID inválido: deve ser um UUID",
          }),
          404: errorResp("Não encontrado", {
            error: "Registro não encontrado(a)",
          }),
        },
      },
      put: {
        tags: [c.tag],
        summary: `Atualiza ${c.singular}`,
        parameters: [idParam],
        description: c.notes.put,
        requestBody: bodyOf(c.putExamples),
        responses: {
          200: { description: "Atualizado com sucesso", content: json(ref) },
          400: errorResp("Dados ou ID inválidos", p400),
          404: errorResp("Não encontrado", {
            error: "Registro não encontrado(a)",
          }),
          409: errorResp("Conflito (duplicidade ou regra de negócio)", p409),
          422: errorResp("Regra de negócio não atendida", p422),
        },
      },
      delete: {
        tags: [c.tag],
        summary: `Remove ${c.singular}`,
        parameters: [idParam],
        description: c.notes.delete,
        responses: {
          204: { description: "Removido com sucesso (sem corpo)" },
          400: errorResp("ID inválido", {
            error: "ID inválido: deve ser um UUID",
          }),
          404: errorResp("Não encontrado", {
            error: "Registro não encontrado(a)",
          }),
          409: errorResp(
            "Registro em uso (possui vínculos ou regra impede a exclusão)",
            d409,
          ),
        },
      },
    },
  };
}

const guide = [
  "# TI Estoque API",
  "API REST para gerenciamento de estoque de equipamentos de TI (locais, técnicos e equipamentos).",
  "",
  "---",
  "## 📋 Passo a passo para testar",
  "",
  '### 1. Configurar o Supabase (único "login" do projeto)',
  "A API **não tem login/token próprio**: o servidor acessa o Supabase com as credenciais do `.env`. Por isso **não existe botão *Authorize*** nesta página. Configure uma vez:",
  "",
  "1. Acesse [supabase.com](https://supabase.com), entre na conta e abra (ou crie) um projeto **exclusivo para testes**.",
  "2. Vá em **SQL Editor**, cole o conteúdo de `database/schema.sql` e clique em **Run**. Isso cria `locations`, `technicians` e `equipments`.",
  "3. Vá em **Project Settings > API** e copie a **Project URL** e a chave (`anon` ou `service_role`).",
  "4. Crie o arquivo `.env` na raiz do projeto:",
  "",
  "```",
  "PORT=3000",
  "SUPABASE_URL=https://SEU-PROJETO.supabase.co",
  "SUPABASE_KEY=sua-chave-aqui",
  "```",
  "",
  "> Se aparecer erro 500 com `row-level security` ou `permission denied`, desative o RLS das 3 tabelas ou use a chave `service_role` (somente no servidor; nunca versione o `.env`).",
  "",
  "### 2. Subir a API",
  "```",
  "npm install",
  "npm run dev",
  "```",
  "Deve aparecer `API rodando em http://localhost:3000`. Esta página fica em `http://localhost:3000/api-docs`.",
  "",
  "### 3. Testar pelo Swagger (botão *Try it out*)",
  '1. **GET /** → *Try it out* → *Execute*: deve retornar `200` com `{ "status": "ok" }`.',
  "2. **POST /locations**: em *Request body* escolha o exemplo `valido` no seletor **Examples** → *Execute* → **copie o `id`** da resposta (`201`).",
  "3. **POST /technicians**: exemplo `valido` → *Execute* → **copie o `id`** (`201`).",
  "4. **POST /equipments**: exemplo `valido_em_uso`; **troque** `location_id` e `technician_id` pelos ids copiados e deixe o `serial_number` inédito → `201`.",
  "5. **GET /equipments**: confira o equipamento com `location` e `technician` embutidos (`200`).",
  "6. **PUT /equipments/{id}**: cole o `id`, use o exemplo `manutencao` (com os ids reais) → `200`.",
  "7. **DELETE** na ordem inversa: equipamento → técnico → local (`204`). Excluir antes disso retorna `409`.",
  "",
  "> O corpo é sempre JSON (`Content-Type: application/json`, já definido pelo Swagger). O PUT exige o objeto completo.",
  "",
  "**Atalho para as regras de negócio:** use a seção **Regras de Negócio** (`POST /regras-negocio/{regra}` ou `POST /regras-negocio/executar`). Não precisa copiar ids: o cenário cria os dados, testa a regra e limpa o banco.",
  "",
  "### 4. Cenários de erro (use os exemplos nomeados de cada POST/PUT)",
  "| Cenário | Endpoint | Como provocar | Status |",
  "|---|---|---|---|",
  "| Campos obrigatórios ausentes | POST qualquer | exemplo `erro_400_sem_campos` (`{}`) | 400 |",
  "| ID inválido | GET/PUT/DELETE `/{id}` | `id = abc` | 400 |",
  "| Não encontrado | GET/PUT/DELETE `/{id}` | `id = " +
    missingId +
    "` | 404 |",
  "| E-mail inválido | POST /technicians | exemplo `erro_400_email_invalido` | 400 |",
  "| E-mail duplicado | POST /technicians | exemplo `valido` com e-mail já cadastrado | 409 |",
  "| Série duplicada | POST /equipments | repetir o `serial_number` já criado | 409 |",
  "| `em_uso` sem técnico | POST /equipments | exemplo `erro_400_em_uso_sem_tecnico` | 400 |",
  "| `disponivel` com técnico | POST /equipments | exemplo `erro_422_disponivel_com_tecnico` | 422 |",
  "| Local/técnico inexistente | POST /equipments | exemplo `erro_422_local_inexistente` | 422 |",
  "| Baixado não volta a ser usado | PUT /equipments/{id} | equipamento `baixado` → status `disponivel` | 422 |",
  "| Excluir equipamento em uso | DELETE /equipments/{id} | equipamento com status `em_uso` | 409 |",
  "| Excluir técnico/local com equipamentos | DELETE | técnico/local vinculado a equipamento | 409 |",
  "| Desativar local/técnico com equipamentos | PUT | enviar `active: false` | 409 |",
  "| JSON malformado | POST qualquer | corpo `{ruim` (via curl/Postman) | 400 |",
  "",
  "### 5. Testes automatizados",
  "```",
  "npm test                  # todos",
  "npm run test:unit         # unitários (sem banco, repositórios mockados)",
  "npm run test:integration  # integração (Supertest + Supabase do .env)",
  "npm run test:coverage     # cobertura (mínimo 60%); relatório em coverage/index.html",
  "```",
  "",
  "**Unitários** (`src/tests/unit/`) — não usam banco:",
  "- `equipmentService.test.ts`: criação, série única (409), local/técnico inexistente ou inativo (422), `em_uso` sem técnico (400), `disponivel` com técnico (422), baixado (422), exclusão de equipamento em uso (409).",
  "- `technicianService.test.ts`: normalização de e-mail/nome, e-mail inválido (400) e duplicado (409), desativar/excluir com equipamentos (409), 404.",
  "- `locationService.test.ts`: trim do nome, validações, desativar/excluir local com equipamentos (409).",
  "- `models.test.ts` e `errorHandler.test.ts`: validadores, UUID, tradução de erros (23503/23505 → 409, JSON inválido → 400, desconhecido → 500, 404).",
  "",
  "**Integração** (`src/tests/integration/api.test.ts`) — chamam os endpoints reais:",
  "- Geral: `GET /`, rota inexistente (404), JSON malformado (400), `/api-docs` e `/api-docs.json`.",
  "- CRUD completo de `/locations`, `/technicians` e `/equipments` (201, 200, 204, 400, 404).",
  "- Regras de negócio: 409 (série/e-mail duplicados, em uso, vínculos), 422 (local/técnico inexistente, disponível com técnico, baixado) e 400 (`em_uso` sem técnico).",
  "- Cada execução cria registros com sufixo único e os apaga no `afterAll`.",
  "",
  "> ⚠️ Os testes de integração gravam no Supabase do `.env`: use sempre um projeto de testes.",
].join("\n");

const err = (error: string, details?: string[]) => ({
  error,
  ...(details ? { details } : {}),
});

const ruleTable = [
  "| Regra (`id`) | Entidade | O que testa | Esperado |",
  "|---|---|---|---|",
  ...businessRules.map(
    (r) => `| \`${r.id}\` | ${r.entidade} | ${r.regra} | ${r.esperado} |`,
  ),
].join("\n");

const ruleResultResp = (description: string) => ({
  description,
  content: json({ $ref: "#/components/schemas/RegraResultado" }),
});

const businessRulePaths = {
  "/regras-negocio": {
    get: {
      tags: ["Regras de Negócio"],
      summary: "Lista as regras testáveis",
      description:
        "Mostra todas as regras de negócio e o status HTTP esperado em cada uma.\n\n" +
        ruleTable,
      responses: {
        200: {
          description: "Lista de regras",
          content: json({ type: "array", items: { type: "object" } }),
        },
      },
    },
  },
  "/regras-negocio/executar": {
    post: {
      tags: ["Regras de Negócio"],
      summary: "Executa TODAS as regras",
      description:
        "**Como testar:** *Try it out* → *Execute*. Roda todos os cenários em sequência e retorna um resumo (`aprovadas` / `reprovadas`).\n\n" +
        "Cada cenário cria seus próprios dados no banco (prefixo `RN`) e os remove no final. Bloqueado em produção.",
      responses: {
        200: {
          description: "Execução concluída (veja `sucesso`)",
          content: json({ $ref: "#/components/schemas/RegraResumo" }),
        },
        403: errorResp("Desabilitado em produção"),
      },
    },
  },
  "/regras-negocio/{regra}": {
    post: {
      tags: ["Regras de Negócio"],
      summary: "Executa UMA regra",
      description:
        "**Como testar:** escolha a regra no dropdown do campo `regra` → *Execute*. " +
        "A API prepara os dados, tenta violar a regra e compara o status obtido com o esperado. " +
        "`passou: true` significa que a regra se comportou como esperado.",
      parameters: [
        {
          name: "regra",
          in: "path",
          required: true,
          schema: { type: "string", enum: businessRules.map((r) => r.id) },
          description: "Identificador da regra de negócio",
        },
      ],
      responses: {
        200: ruleResultResp("Cenário executado"),
        403: errorResp("Desabilitado em produção"),
        404: errorResp("Regra não encontrada", {
          error: "Regra não encontrada",
        }),
      },
    },
  },
};

export const swaggerSpec = {
  openapi: "3.0.3",
  info: { title: "TI Estoque API", version: "1.0.0", description: guide },
  tags: [
    { name: "Geral", description: "Verificação de funcionamento da API" },
    {
      name: "Locais",
      description: "Locais onde os equipamentos ficam armazenados",
    },
    {
      name: "Técnicos",
      description: "Técnicos responsáveis pelos equipamentos",
    },
    {
      name: "Equipamentos",
      description:
        "Equipamentos de TI (ligados a um local e, opcionalmente, a um técnico)",
    },
    {
      name: "Regras de Negócio",
      description:
        "Testes clicáveis das regras de negócio (cada um monta os dados, tenta violar a regra e limpa o banco)",
    },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Geral"],
        summary: "Health check",
        description:
          '**Primeiro teste:** confirma que a API subiu. Esperado: `200` com `{ "status": "ok" }`.',
        responses: {
          200: {
            description: "API no ar",
            content: json(
              { type: "object" },
              {
                example: { status: "ok", api: "TI Estoque", docs: "/api-docs" },
              },
            ),
          },
        },
      },
    },

    ...businessRulePaths,

    ...crudPaths({
      tag: "Locais",
      base: "locations",
      schema: "Location",
      input: "LocationInput",
      singular: "um local",
      plural: "locais",
      postExamples: {
        valido: {
          summary: "✅ Válido (201)",
          value: {
            name: "Almoxarifado TI",
            description: "Sala 101, bloco A",
            active: true,
          },
        },
        erro_400_sem_campos: { summary: "❌ Sem nome (400)", value: {} },
        erro_400_active_invalido: {
          summary: "❌ active não booleano (400)",
          value: { name: "Sala X", active: "sim" },
        },
      },
      putExamples: {
        renomear: { summary: "✅ Renomear (200)", value: { name: "Sala B" } },
        desativar: {
          summary: "⚠️ Desativar (409 se tiver equipamentos não baixados)",
          value: { name: "Sala B", active: false },
        },
      },
      notes: {
        get: "**Como testar:** *Execute* sem parâmetros → `200` com array (inclui os locais criados antes).",
        post: "**Como testar:** use `valido` → `201` e **copie o `id`** (será o `location_id` dos equipamentos). `erro_400_*` → `400` com `details`.",
        put: "**Como testar:** cole o `id` e use `renomear` → `200`. Com `desativar` e equipamentos vinculados → `409`. `id` inexistente → `404`.",
        delete:
          "**Como testar:** local vazio → `204`; repetir → `404`; local com equipamentos vinculados → `409`.",
      },
      errors: {
        post: [
          err("Dados inválidos", ["name é obrigatório"]),
          undefined,
          undefined,
        ],
        put: [
          err("Dados inválidos", ["name é obrigatório"]),
          err("Não é possível desativar um local que possui equipamentos"),
          undefined,
        ],
        delete: [
          err(
            "Não é possível excluir um local que possui equipamentos vinculados",
          ),
        ],
      },
    }),

    ...crudPaths({
      tag: "Técnicos",
      base: "technicians",
      schema: "Technician",
      input: "TechnicianInput",
      singular: "um técnico",
      plural: "técnicos",
      postExamples: {
        valido: {
          summary: "✅ Válido (201; repetir o e-mail → 409)",
          value: {
            name: "Carlos Silva",
            email: "carlos@empresa.com",
            active: true,
          },
        },
        erro_400_sem_campos: { summary: "❌ Sem campos (400)", value: {} },
        erro_400_email_invalido: {
          summary: "❌ E-mail inválido (400)",
          value: { name: "Carlos", email: "invalido" },
        },
      },
      putExamples: {
        atualizar: {
          summary: "✅ Atualizar nome (200)",
          value: { name: "Carlos Souza", email: "carlos@empresa.com" },
        },
        desativar: {
          summary: "⚠️ Desativar (409 se tiver equipamentos)",
          value: {
            name: "Carlos Souza",
            email: "carlos@empresa.com",
            active: false,
          },
        },
      },
      notes: {
        get: "**Como testar:** *Execute* → `200` com array de técnicos.",
        post: "**Como testar:** use `valido` → `201` (e-mail salvo em minúsculas) e **copie o `id`** (será o `technician_id`). Envie o mesmo e-mail de novo → `409`.",
        put: "**Como testar:** `atualizar` → `200`. Pode manter o próprio e-mail. `desativar` com equipamentos vinculados → `409`.",
        delete:
          "**Como testar:** técnico sem equipamentos → `204`; com equipamentos vinculados → `409`; inexistente → `404`.",
      },
      errors: {
        post: [
          err("Dados inválidos", ["name é obrigatório", "email inválido"]),
          err("Já existe um técnico com este e-mail"),
          undefined,
        ],
        put: [
          err("Dados inválidos", ["email inválido"]),
          err(
            "Não é possível desativar um técnico responsável por equipamentos",
          ),
          undefined,
        ],
        delete: [
          err("Não é possível excluir um técnico com equipamentos vinculados"),
        ],
      },
    }),

    ...crudPaths({
      tag: "Equipamentos",
      base: "equipments",
      schema: "Equipment",
      input: "EquipmentInput",
      singular: "um equipamento",
      plural: "equipamentos",
      postExamples: {
        valido: {
          summary: "✅ Disponível, sem técnico (201)",
          description: "Troque `location_id` pelo id de um local real.",
          value: {
            name: "Notebook Dell",
            brand: "Dell",
            model: "Latitude 5440",
            serial_number: "SN-000123",
            location_id: uuidEx,
          },
        },
        valido_em_uso: {
          summary: "✅ Em uso, com técnico (201)",
          description:
            "Troque `location_id` e `technician_id` pelos ids reais.",
          value: {
            name: "Notebook Dell",
            brand: "Dell",
            model: "Latitude 5440",
            serial_number: "SN-000124",
            status: "em_uso",
            location_id: uuidEx,
            technician_id: uuidEx,
            active: true,
          },
        },
        erro_400_sem_campos: {
          summary: "❌ Sem campos obrigatórios (400)",
          value: {},
        },
        erro_400_em_uso_sem_tecnico: {
          summary: "❌ em_uso sem técnico (400)",
          value: {
            name: "Monitor",
            serial_number: "SN-ERR-1",
            status: "em_uso",
            location_id: uuidEx,
          },
        },
        erro_422_disponivel_com_tecnico: {
          summary: "❌ disponivel com técnico (422)",
          description: "Use ids reais de local e técnico.",
          value: {
            name: "Monitor",
            serial_number: "SN-ERR-2",
            status: "disponivel",
            location_id: uuidEx,
            technician_id: uuidEx,
          },
        },
        erro_422_local_inexistente: {
          summary: "❌ Local inexistente (422)",
          value: {
            name: "Monitor",
            serial_number: "SN-ERR-3",
            location_id: missingId,
          },
        },
      },
      putExamples: {
        manutencao: {
          summary: "✅ Mudar para manutenção (200)",
          description:
            "Envie o objeto completo, com o mesmo `serial_number` do registro.",
          value: {
            name: "Notebook Dell",
            serial_number: "SN-000123",
            status: "manutencao",
            location_id: uuidEx,
          },
        },
        baixar: {
          summary: "⚠️ Dar baixa (200); depois mudar o status → 422",
          value: {
            name: "Notebook Dell",
            serial_number: "SN-000123",
            status: "baixado",
            location_id: uuidEx,
          },
        },
      },
      notes: {
        get: "**Como testar:** *Execute* → `200`. Cada item traz `location` e `technician` (id e nome).",
        post: "**Como testar:** crie antes um local e um técnico e copie os ids. Depois use `valido` / `valido_em_uso` → `201`. Os exemplos `erro_*` devem retornar `400` ou `422`. Repetir um `serial_number` → `409`.",
        put: "**Como testar:** cole o `id` e use `manutencao` → `200`. Equipamento `baixado` não pode mudar de status → `422`.",
        delete:
          "**Como testar:** equipamento `disponivel`/`manutencao`/`baixado` → `204`; `em_uso` → `409`; inexistente → `404`.",
      },
      errors: {
        post: [
          err("Dados inválidos", [
            "technician_id é obrigatório quando status = em_uso",
          ]),
          err("Já existe um equipamento com este número de série"),
          err("Equipamento disponível não pode ter técnico responsável"),
        ],
        put: [
          err("Dados inválidos", ["location_id deve ser um UUID válido"]),
          err("Já existe um equipamento com este número de série"),
          err("Equipamento baixado não pode ter o status alterado"),
        ],
        delete: [err("Não é possível excluir um equipamento em uso")],
      },
    }),
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Dados inválidos" },
          details: {
            type: "array",
            items: { type: "string" },
            example: ["name é obrigatório"],
          },
        },
      },
      LocationInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
          active: { type: "boolean" },
        },
      },
      Location: {
        allOf: [
          { $ref: "#/components/schemas/LocationInput" },
          {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              created_at: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      TechnicianInput: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          active: { type: "boolean" },
        },
      },
      Technician: {
        allOf: [
          { $ref: "#/components/schemas/TechnicianInput" },
          {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              created_at: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      EquipmentInput: {
        type: "object",
        required: ["name", "serial_number", "location_id"],
        properties: {
          name: { type: "string" },
          brand: { type: "string", nullable: true },
          model: { type: "string", nullable: true },
          serial_number: { type: "string" },
          status: {
            type: "string",
            enum: ["disponivel", "em_uso", "manutencao", "baixado"],
            default: "disponivel",
          },
          location_id: { type: "string", format: "uuid" },
          technician_id: {
            type: "string",
            format: "uuid",
            nullable: true,
            description:
              "Obrigatório quando status = em_uso; proibido quando status = disponivel",
          },
          active: { type: "boolean" },
        },
      },
      Equipment: {
        allOf: [
          { $ref: "#/components/schemas/EquipmentInput" },
          {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              created_at: { type: "string", format: "date-time" },
              location: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
              technician: {
                type: "object",
                nullable: true,
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        ],
      },
      RegraResultado: {
        type: "object",
        properties: {
          regra: { type: "string", example: "equip-serie-duplicada" },
          entidade: { type: "string", example: "Equipamentos" },
          descricao: {
            type: "string",
            example: "Número de série deve ser único",
          },
          esperado: { type: "integer", example: 409 },
          obtido: { type: "integer", example: 409 },
          passou: { type: "boolean", example: true },
          mensagem: {
            type: "string",
            nullable: true,
            example: "Já existe um equipamento com este número de série",
          },
        },
      },
      RegraResumo: {
        type: "object",
        properties: {
          sucesso: { type: "boolean" },
          total: { type: "integer" },
          aprovadas: { type: "integer" },
          reprovadas: { type: "integer" },
          resultados: {
            type: "array",
            items: { $ref: "#/components/schemas/RegraResultado" },
          },
        },
      },
    },
  },
};
