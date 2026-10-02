# TI Estoque API

## 1. Descrição
API REST para **gerenciamento de estoque de equipamentos do setor de TI**. Resolve o problema de controle disperso de notebooks, monitores, periféricos etc., permitindo saber **onde** cada equipamento está, **qual técnico** é responsável e qual seu **status** (disponível, em uso, em manutenção, baixado).
Domínio: gestão de ativos de TI.

## 2. Integrantes
###Bianca Mazepa Millek
###Gustavo Britto

## 3. Tecnologias
Node.js, TypeScript, Express, Supabase, PostgreSQL, Git, dotenv, cors, tsx.

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
├── controllers/   # lógica HTTP (validação, status codes)
├── errors/        # AppError
├── middlewares/   # tratamento de erros e 404
├── models/        # interfaces e validações
├── repositories/  # acesso ao Supabase/PostgreSQL
├── routes/        # rotas Express
├── app.ts
└── server.ts
database/schema.sql
```

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

## 9. Endpoints
Recursos: `/equipments`, `/locations`, `/technicians` (mesmo padrão para os três).

| Método | Endpoint | Descrição | Sucesso |
|---|---|---|---|
| GET | /{recurso} | Lista todos | 200 |
| GET | /{recurso}/:id | Consulta por ID | 200 |
| POST | /{recurso} | Cadastra | 201 |
| PUT | /{recurso}/:id | Atualiza | 200 |
| DELETE | /{recurso}/:id | Remove | 204 |

Erros: 400 (validação/ID inválido), 404 (não encontrado), 409 (FK/duplicidade), 500.
Obs.: `GET /equipments` retorna também `location` e `technician` (nome).

## 10. Exemplos
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
