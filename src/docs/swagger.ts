const idParam = {
  name: 'id', in: 'path', required: true,
  schema: { type: 'string', format: 'uuid' }, description: 'UUID do registro',
};
const errorResp = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});
const arrayOf = (name: string) => ({ type: 'array', items: { $ref: `#/components/schemas/${name}` } });
const json = (schema: any, example?: any) => ({ 'application/json': { schema, ...(example ? { example } : {}) } });

function crudPaths(tag: string, base: string, schema: string, input: string, example: any, singular: string, plural: string) {
  const body = { required: true, content: json({ $ref: `#/components/schemas/${input}` }, example) };
  return {
    [`/${base}`]: {
      get: {
        tags: [tag], summary: `Lista todos(as) os(as) ${plural}`,
        responses: { 200: { description: 'Lista retornada com sucesso', content: json(arrayOf(schema)) } },
      },
      post: {
        tags: [tag], summary: `Cadastra ${singular}`, requestBody: body,
        responses: {
          201: { description: 'Criado com sucesso', content: json({ $ref: `#/components/schemas/${schema}` }) },
          400: errorResp('Dados inválidos'),
          409: errorResp('Conflito (duplicidade ou violação de regra de negócio)'),
          422: errorResp('Regra de negócio não atendida'),
        },
      },
    },
    [`/${base}/{id}`]: {
      get: {
        tags: [tag], summary: `Consulta ${singular} por ID`, parameters: [idParam],
        responses: {
          200: { description: 'Encontrado', content: json({ $ref: `#/components/schemas/${schema}` }) },
          400: errorResp('ID inválido'), 404: errorResp('Não encontrado'),
        },
      },
      put: {
        tags: [tag], summary: `Atualiza ${singular}`, parameters: [idParam], requestBody: body,
        responses: {
          200: { description: 'Atualizado com sucesso', content: json({ $ref: `#/components/schemas/${schema}` }) },
          400: errorResp('Dados ou ID inválidos'), 404: errorResp('Não encontrado'),
          409: errorResp('Conflito (duplicidade ou violação de regra de negócio)'),
          422: errorResp('Regra de negócio não atendida'),
        },
      },
      delete: {
        tags: [tag], summary: `Remove ${singular}`, parameters: [idParam],
        responses: {
          204: { description: 'Removido com sucesso' },
          400: errorResp('ID inválido'), 404: errorResp('Não encontrado'),
          409: errorResp('Registro em uso (possui vínculos ou regra impede a exclusão)'),
        },
      },
    },
  };
}

const uuidEx = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TI Estoque API',
    version: '1.0.0',
    description: 'API REST para gerenciamento de estoque de equipamentos de TI (locais, técnicos e equipamentos).',
  },
  tags: [
    { name: 'Locais', description: 'Locais onde os equipamentos ficam armazenados' },
    { name: 'Técnicos', description: 'Técnicos responsáveis pelos equipamentos' },
    { name: 'Equipamentos', description: 'Equipamentos de TI (ligados a um local e, opcionalmente, a um técnico)' },
  ],
  paths: {
    ...crudPaths('Locais', 'locations', 'Location', 'LocationInput',
      { name: 'Almoxarifado TI', description: 'Sala 101, bloco A', active: true }, 'um local', 'locais'),
    ...crudPaths('Técnicos', 'technicians', 'Technician', 'TechnicianInput',
      { name: 'Carlos Silva', email: 'carlos@empresa.com', active: true }, 'um técnico', 'técnicos'),
    ...crudPaths('Equipamentos', 'equipments', 'Equipment', 'EquipmentInput',
      {
        name: 'Notebook Dell Latitude', brand: 'Dell', model: 'Latitude 5440', serial_number: 'SN-000123',
        status: 'em_uso', location_id: uuidEx, technician_id: uuidEx, active: true,
      }, 'um equipamento', 'equipamentos'),
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Dados inválidos' },
          details: { type: 'array', items: { type: 'string' }, example: ['name é obrigatório'] },
        },
      },
      LocationInput: {
        type: 'object', required: ['name'],
        properties: { name: { type: 'string' }, description: { type: 'string', nullable: true }, active: { type: 'boolean' } },
      },
      Location: {
        allOf: [{ $ref: '#/components/schemas/LocationInput' }, {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' }, created_at: { type: 'string', format: 'date-time' } },
        }],
      },
      TechnicianInput: {
        type: 'object', required: ['name', 'email'],
        properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, active: { type: 'boolean' } },
      },
      Technician: {
        allOf: [{ $ref: '#/components/schemas/TechnicianInput' }, {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' }, created_at: { type: 'string', format: 'date-time' } },
        }],
      },
      EquipmentInput: {
        type: 'object', required: ['name', 'serial_number', 'location_id'],
        properties: {
          name: { type: 'string' }, brand: { type: 'string', nullable: true }, model: { type: 'string', nullable: true },
          serial_number: { type: 'string' },
          status: { type: 'string', enum: ['disponivel', 'em_uso', 'manutencao', 'baixado'], default: 'disponivel' },
          location_id: { type: 'string', format: 'uuid' },
          technician_id: { type: 'string', format: 'uuid', nullable: true, description: 'Obrigatório quando status = em_uso; proibido quando status = disponivel' },
          active: { type: 'boolean' },
        },
      },
      Equipment: {
        allOf: [{ $ref: '#/components/schemas/EquipmentInput' }, {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }, created_at: { type: 'string', format: 'date-time' },
            location: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
            technician: { type: 'object', nullable: true, properties: { id: { type: 'string' }, name: { type: 'string' } } },
          },
        }],
      },
    },
  },
};
