# API REST

[Índice da documentação](../README.md) · [Arquitetura](../arquitetura/README.md) · [Desenvolvimento](../desenvolvimento/README.md)

## Endereço e documentação interativa

No ambiente local, a API responde em `http://localhost:3000`. O Swagger está em <http://localhost:3000/api-docs> e descreve os schemas, os campos obrigatórios e as respostas. Os recursos usam JSON; `GET /` retorna a mensagem de funcionamento e o caminho da documentação.

As definições OpenAPI ficam em [`config/swagger.ts`](../../apps/backend/src/config/swagger.ts), nos arquivos de configuração de agenda/fidelidade e nas anotações de [`routes/`](../../apps/backend/src/routes). Este guia apresenta os contratos e as regras mais relevantes; consulte o Swagger para os payloads completos.

## Autenticação e autorização

O PetExpress usa o cookie HttpOnly `petshop_session`. No navegador, envie requisições com `credentials: include`; o helper [`lib/api.ts`](../../apps/frontend/src/lib/api.ts) já faz isso. CORS permite a origem definida por `FRONTEND_ORIGIN` e credenciais.

Cadastro e login com senha criam uma sessão própria. No login Google, o frontend envia o ID token Firebase para `POST /auth/google`. Uma identidade nova recebe onboarding temporário, e a sessão comum só é criada após validar os dados obrigatórios. Veja [autenticação Google](../google-auth.md).

| Acesso | Regra |
| --- | --- |
| Público | Cadastro/login, onboarding por cookie temporário, catálogo ativo, profissionais habilitados e disponibilidade |
| CLIENTE | Recursos próprios, definidos pela titularidade no servidor |
| FUNCIONARIO | Agenda atribuída ao profissional vinculado à conta; leitura e transições autorizadas |
| ADMIN | Cadastros administrativos, configuração da agenda, bloqueios e ajustes de fidelidade |

Rotas privadas reavaliam o usuário atual no banco. Para clientes, recursos que exigem perfil completo retornam `403` com `PERFIL_INCOMPLETO` enquanto os dados estiverem pendentes.

## Recursos

### Identidade

| Método | Rota | Uso |
| --- | --- | --- |
| POST | `/auth/cadastro` | Cadastrar cliente com dados pessoais, senha e endereço |
| POST | `/auth/login` | Entrar com e-mail e senha |
| POST | `/auth/google` | Validar ID token Firebase e iniciar sessão/onboarding |
| GET / PUT | `/auth/me` | Consultar/atualizar o próprio perfil, inclusive para concluir dados pendentes |
| GET / PUT | `/auth/onboarding` | Restaurar/concluir onboarding Google com cookie temporário |
| POST | `/auth/logout` | Encerrar sessão/onboarding e limpar cookies |

O cadastro convencional recebe `nome`, `email`, `cpf`, `telefone`, `senha`, `endereco` e, opcionalmente, `confirmarSenha`. Endereço contém `cep`, `rua`, `bairro`, `numero` e `complemento` opcional. CPF é validado e normalizado para 11 dígitos; e-mail fica em minúsculas e telefone em DDD+número. O cliente não altera um CPF válido já associado à conta.

### Cadastros

| Recurso | Rotas base | Escopo |
| --- | --- | --- |
| Usuários | `/usuarios`, `/usuarios/:id` | Administração; perfil próprio usa `/auth/me` |
| Endereços | `/enderecos`, `/enderecos/:id` | CLIENTE titular ou ADMIN |
| Animais | `/animais`, `/animais/:id` | CLIENTE titular ou ADMIN |
| Planos | `/planos`, `/planos/:id` | ADMIN |
| Assinaturas | `/assinaturas`, `/assinaturas/:id` | ADMIN |
| Serviços | `/servicos`, `/servicos/:id` | Leitura do catálogo ativo pública; escrita ADMIN |
| Funcionários | `/funcionarios`, `/funcionarios/:id` | ADMIN; FUNCIONARIO lê somente o próprio cadastro |

Esses recursos oferecem `GET/POST` na coleção e `GET/PUT/DELETE` por ID, sujeitos às permissões e aos vínculos existentes. Exclusão pode ser bloqueada para preservar histórico.

Rotas complementares de serviços:

- `GET /servicos?categoria=BANHO_TOSA` ou `CONSULTA`: catálogo ativo e classificado.
- `GET /servicos/administracao`: catálogo completo para ADMIN, inclusive inativos e legado sem classificação.
- `GET /servicos/:id/profissionais`: profissionais ativos e habilitados, sem exposição de telefone ou conta.

### Agenda

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/disponibilidade` | Slots públicos por serviço, janela de datas e profissional opcional |
| POST | `/agendamentos/previa` | Cotação da seleção, para CLIENTE titular ou ADMIN |
| GET / POST | `/agendamentos` | Listar por escopo / criar reserva |
| GET / PUT | `/agendamentos/:id` | Consultar / alterar horário, profissional ou observações |
| GET | `/agendamentos/:id/disponibilidade` | Slots de reagendamento preservando a duração contratada |
| PATCH | `/agendamentos/:id/status` | Cancelar, concluir ou registrar falta conforme o papel |
| GET / PUT | `/configuracao-agenda` | Consultar/substituir configuração global; ADMIN |
| GET / POST | `/bloqueios-agenda` | Listar/criar bloqueios; ADMIN |
| DELETE | `/bloqueios-agenda/:id` | Remover bloqueio; ADMIN |

**Disponibilidade:** envie `servicoId`, `dataInicio` e `dataFim`, com datas locais inclusivas em `YYYY-MM-DD` e janela máxima de 31 dias. `funcionarioId` é opcional. O resultado contém `fuso`, `preco`, `duracaoMin` e `slots` com início/fim, profissional e valores, sem dados dos clientes que ocupam outros horários.

**Criação:** envie `animalId`, `servicoId`, `funcionarioId`, `dataHoraIni` e `observacoes` opcional de até 300 caracteres. O frontend atual também envia `cotacaoEsperada`, retornada pela prévia. A API calcula titular, fim, estado e contrato financeiro; enviar campos controlados ou desconhecidos retorna `400`.

Se `cotacaoEsperada` divergir da cotação atual, a API responde `409 COTACAO_ALTERADA` sem criar a reserva. O formulário deve exibir os novos valores e pedir outra confirmação. Clientes da API podem omitir a cotação esperada; nesse caso o servidor define o contrato efetivo.

**Reagendamento:** `PUT` aceita `dataHoraIni`, `funcionarioId` e/ou `observacoes`. Pet, serviço, titular, preço, duração e benefício são preservados. Use a disponibilidade da própria reserva para respeitar a duração contratada. As respostas de consulta incluem `podeCancelar` e `podeReagendar` para orientar a interface.

**Estados:** somente `AGENDADO → CONCLUIDO`, `CANCELADO` ou `NAO_COMPARECEU`. Estados finais não reabrem. Repetir o mesmo estado final, com autorização, é idempotente. Clientes cancelam dentro do prazo; funcionário responsável e ADMIN podem concluir ou marcar falta após o fim previsto. `DELETE /agendamentos/:id` foi retirado: cancele por `PATCH`.

Consulte [operação da agenda](../agenda-operacao.md) para payloads administrativos, limites e regras de prazo por papel.

### Fidelidade

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/fidelidades` | Listar conforme o escopo autorizado |
| GET | `/fidelidades/me` | Consultar saldo da própria conta |
| GET | `/fidelidades/:id` | Consultar fidelidade autorizada |
| POST | `/fidelidades/:id/ajustes` | Ajuste auditado exclusivo ADMIN |

A cada oito banhos elegíveis pagos e concluídos, o tutor recebe um benefício. O próximo novo agendamento elegível reserva o mais antigo disponível. Concluir consome; cancelar ou faltar devolve; reagendar preserva a reserva. Consultas e banhos gratuitos não incrementam o progresso. O saldo é compartilhado pelos pets do tutor e os benefícios não expiram.

Ajustes recebem `progresso` final inteiro de 0 a 7, `variacaoBeneficios` inteira e `motivo` obrigatório de até 300 caracteres. Reduções revogam somente benefícios disponíveis. `POST /fidelidades`, `PUT /fidelidades/:id` e `DELETE /fidelidades/:id` foram retirados; criação ocorre com a conta e alterações administrativas usam ajustes.

Os contratos completos estão na [documentação da fidelidade](../fase4-implementacao.md).

## Respostas de erro

Formato geral, com `code` e `fieldErrors` opcionais:

```json
{
  "message": "Conclua seu perfil para continuar.",
  "code": "PERFIL_INCOMPLETO"
}
```

| Status | Significado |
| --- | --- |
| 400 | Entrada inválida, JSON malformado ou referência inválida |
| 401 | Sessão ausente/expirada ou falha de autenticação |
| 403 | Papel/titularidade sem permissão ou perfil incompleto |
| 404 | Recurso/rota inexistente |
| 409 | Duplicidade, vínculos que impedem exclusão, conflito de horário/cotação, estado ou prazo |
| 500 | Falha interna não tratada |

`HORARIO_INDISPONIVEL` e `COTACAO_ALTERADA` são códigos de conflito usados pelo agendamento. `fieldErrors` associa o nome do campo à mensagem de validação, inclusive campos como `endereco.cep`. A ausência de rede é tratada pelo frontend como falha de conexão, sem resposta HTTP do servidor.
