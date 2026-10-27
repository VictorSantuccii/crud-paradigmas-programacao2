const id = { type: 'integer', minimum: 1 };
const dateTime = { type: 'string', format: 'date-time' };
const date = { type: 'string', format: 'date' };
const nota = { type: 'string', nullable: true, maxLength: 300 };
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: unknown) => ({ 'application/json': { schema } });
const intervalo = { type: 'object', additionalProperties: false, required: ['diaSemana', 'inicio', 'fim'], properties: { diaSemana: { type: 'integer', minimum: 0, maximum: 6, description: '0 = domingo. Intervalos do mesmo dia não podem se sobrepor.' }, inicio: { type: 'string', example: '09:00' }, fim: { type: 'string', example: '12:00' } } };
export const agendaSchemas = {
  ProfissionalPublico: { type: 'object', properties: { id, nome: { type: 'string' }, cargo: { type: 'string' } } },
  ConfiguracaoAgenda: { type: 'object', additionalProperties: false, required: ['fuso', 'intervaloSlotMin', 'antecedenciaCriacaoHoras', 'antecedenciaCancelamentoHoras', 'antecedenciaReagendamentoHoras', 'intervalos'], properties: { fuso: { type: 'string', enum: ['America/Sao_Paulo'] }, intervaloSlotMin: { type: 'integer', minimum: 1, maximum: 1440, example: 30 }, antecedenciaCriacaoHoras: { type: 'integer', minimum: 1, maximum: 8760, example: 24 }, antecedenciaCancelamentoHoras: { type: 'integer', minimum: 1, maximum: 8760, example: 24 }, antecedenciaReagendamentoHoras: { type: 'integer', minimum: 1, maximum: 8760, example: 24 }, intervalos: { type: 'array', maxItems: 100, items: intervalo } } },
  BloqueioAgendaInput: { type: 'object', additionalProperties: false, required: ['inicio', 'fim'], properties: { inicio: dateTime, fim: dateTime, funcionarioId: { ...id, nullable: true, description: 'Omitir ou null para bloqueio global.' }, motivo: nota } },
  BloqueioAgenda: { allOf: [ref('BloqueioAgendaInput'), { type: 'object', properties: { id } }] },
  Disponibilidade: { type: 'object', properties: { fuso: { type: 'string' }, preco: { type: 'number', nullable: true }, duracaoMin: { type: 'number' }, slots: { type: 'array', items: { type: 'object', properties: { data: date, inicio: dateTime, fim: dateTime, funcionario: ref('ProfissionalPublico'), preco: { type: 'number', nullable: true }, duracaoMin: { type: 'number' } } } } } },
  AgendamentoUpdate: { type: 'object', additionalProperties: false, minProperties: 1, properties: { dataHoraIni: dateTime, funcionarioId: id, observacoes: nota }, description: 'CLIENTE titular ou ADMIN. Pet, serviço, preço e duração contratados são imutáveis. Disponibilidade usa a duração contratada.' },
  AgendamentoStatusInput: { type: 'object', additionalProperties: false, required: ['status'], properties: { status: { type: 'string', enum: ['CONCLUIDO', 'CANCELADO', 'NAO_COMPARECEU'] }, motivo: nota } },
};
const respostas = (schema: unknown, status = '200') => ({ [status]: { description: 'Operação realizada', content: json(schema) }, '400': { description: 'Dados ou janela inválidos; campos controlados pelo servidor não são aceitos.' }, '401': { description: 'Sessão necessária ou expirada.' }, '403': { description: 'Papel, titularidade ou completude de perfil não permitem a operação.' }, '404': { description: 'Registro inexistente.' }, '409': { description: 'Conflito, prazo encerrado ou transição incompatível. Slot indisponível retorna code HORARIO_INDISPONIVEL.' } });
const requestBody = (name: string) => ({ required: true, content: json(ref(name)) });
const idParam = { in: 'path', name: 'id', required: true, schema: id };
const query = (name: string, schema: unknown, required = false) => ({ in: 'query', name, required, schema });
const janela = [query('dataInicio', date, true), query('dataFim', date, true), query('funcionarioId', id)];
const agendamentosDescription = 'Sessão e perfil completo. CLIENTE: somente próprios; FUNCIONARIO: somente agenda vinculada; ADMIN: todos. Sem dados de conta, diagnóstico, vacinação ou receita. Observações somente para titular, profissional responsável e ADMIN.';
export const agendaPaths = {
  '/servicos/{id}/profissionais': { get: { tags: ['Servicos'], summary: 'Profissionais ativos habilitados para um serviço ativo', security: [], parameters: [idParam], responses: respostas({ type: 'array', items: ref('ProfissionalPublico') }) } },
  '/servicos/administracao': { get: { tags: ['Servicos'], summary: 'ADMIN lista todo o catálogo, incluindo legado inativo sem categoria', responses: respostas({ type: 'array', items: ref('Servico') }) } },
  '/disponibilidade': { get: { tags: ['Agenda'], summary: 'Slots públicos calculados pelo backend', security: [], description: 'Datas locais inclusivas; máximo de 31 dias. Slots ancorados no início de cada intervalo de expediente. Respeita pausa, bloqueios, reservas, habilitação, ativação e antecedência. Sem profissional, oferece alternativas por profissional. Retorna ISO 8601 com offset; nunca revela dados da reserva ocupante.', parameters: [query('servicoId', id, true), ...janela], responses: respostas(ref('Disponibilidade')) } },
  '/configuracao-agenda': {
    get: { tags: ['Agenda'], summary: 'ADMIN consulta expediente e políticas', responses: respostas(ref('ConfiguracaoAgenda')) },
    put: { tags: ['Agenda'], summary: 'ADMIN substitui configuração global', description: 'Não cancela nem altera reservas existentes. Mudanças e gravações de reservas usam o mesmo lock transacional.', requestBody: requestBody('ConfiguracaoAgenda'), responses: respostas(ref('ConfiguracaoAgenda')) },
  },
  '/bloqueios-agenda': {
    get: { tags: ['Agenda'], summary: 'ADMIN lista bloqueios extraordinários', responses: respostas({ type: 'array', items: ref('BloqueioAgenda') }) },
    post: { tags: ['Agenda'], summary: 'ADMIN cria bloqueio global ou por profissional', description: 'Início deve preceder fim. Não cancela reservas existentes.', requestBody: requestBody('BloqueioAgendaInput'), responses: respostas(ref('BloqueioAgenda'), '201') },
  },
  '/bloqueios-agenda/{id}': { delete: { tags: ['Agenda'], summary: 'ADMIN remove bloqueio', parameters: [idParam], responses: { '204': { description: 'Bloqueio removido.' }, '401': { description: 'Sessão necessária.' }, '403': { description: 'ADMIN necessário.' }, '404': { description: 'Bloqueio inexistente.' } } } },
  '/agendamentos': {
    get: { tags: ['Agendamentos'], summary: 'Lista agenda e histórico reais', description: agendamentosDescription, parameters: [query('status', { type: 'string', enum: ['AGENDADO', 'CONCLUIDO', 'CANCELADO', 'NAO_COMPARECEU'] }), query('dataInicio', date), query('dataFim', date)], responses: respostas({ type: 'array', items: ref('Agendamento') }) },
    post: { tags: ['Agendamentos'], summary: 'Cria reserva e auditoria em transação', description: 'CLIENTE ou ADMIN. Titular vem do dono do animal. Fim, preço, duração e estado são calculados pelo servidor. Não envie usuarioId, dataHoraFim, preço ou estado. Intervalos concorrentes do mesmo profissional são protegidos por GiST.', requestBody: requestBody('AgendamentoInput'), responses: respostas(ref('Agendamento'), '201') },
  },
  '/agendamentos/{id}': {
    get: { tags: ['Agendamentos'], summary: 'Consulta reserva', description: agendamentosDescription, parameters: [idParam], responses: respostas(ref('Agendamento')) },
    put: { tags: ['Agendamentos'], summary: 'Reagenda ou atualiza observações enquanto AGENDADO', description: 'CLIENTE respeita antecedência sobre reserva original e novo início. ADMIN pode reagendar dentro do prazo, sempre antes do início original e do novo horário. Profissional não pode reagendar. Falha preserva reserva e auditoria.', parameters: [idParam], requestBody: requestBody('AgendamentoUpdate'), responses: respostas(ref('Agendamento')) },
  },
  '/agendamentos/{id}/status': { patch: { tags: ['Agendamentos'], summary: 'Cancela, conclui ou registra falta', description: 'Substitui DELETE físico, retirado. Só AGENDADO transita. CLIENTE titular cancela respeitando antecedência. ADMIN/profissional responsável cancelam e podem concluir ou marcar falta após fim previsto. Repetir estado final permitido retorna resultado sem novo evento. Estados finais não reabrem. CANCELADO e NAO_COMPARECEU liberam intervalo; CONCLUIDO continua ocupando.', parameters: [idParam], requestBody: requestBody('AgendamentoStatusInput'), responses: respostas(ref('Agendamento')) } },
  '/agendamentos/{id}/disponibilidade': { get: { tags: ['Agendamentos'], summary: 'Disponibilidade privada para reagendamento com duração contratada', description: 'CLIENTE titular ou ADMIN. Exclui a própria reserva do cálculo. Retorna preço histórico nulo quando desconhecido. Datas inclusivas; máximo de 31 dias.', parameters: [idParam, ...janela], responses: respostas(ref('Disponibilidade')) } },
};
