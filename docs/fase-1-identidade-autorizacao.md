# Fase 1: identidade e autorização

> Agenda: os contratos e permissões de agendamentos desta fase foram evoluídos pela [fase 3](agenda-operacao.md), com cancelamento/transições em PATCH e sem DELETE físico.


## Rotas e papéis

| Recurso | Público | CLIENTE completo | FUNCIONARIO | ADMIN |
| --- | --- | --- | --- | --- |
| GET /servicos | catálogo | catálogo | catálogo | catálogo |
| Escrita de serviços | — | — | — | CRUD |
| /auth/me | — | perfil próprio e regularização legada | perfil próprio | perfil próprio |
| /enderecos, /animais | — | somente próprios | — | CRUD |
| /agendamentos | — | somente próprios | leitura da agenda vinculada | CRUD |
| /fidelidades | — | leitura própria | — | CRUD |
| /funcionarios | — | — | leitura própria | gestão |
| /usuarios, /planos, /assinaturas | — | — | — | CRUD |

Rotas privadas retornam 401 sem sessão, 403 quando falta papel/titularidade, 404 para recurso inexistente e 409 para unicidade ou conflito de endereço. Filtros não ampliam escopo. Cliente incompleto pode consultar/concluir perfil e sair; outras operações privadas retornam 403 com code PERFIL_INCOMPLETO.

## Identidade e cadastro

POST /auth/cadastro cria somente CLIENTE e exige nome, e-mail, CPF, senha de oito caracteres, telefone e endereço completo. Um endereço e uma fidelidade inicial são criados junto com o cliente. CPF aceita máscara, valida dígitos verificadores e persiste 11 dígitos. E-mail é aparado e convertido para minúsculas. Telefone aceita +55 e persiste DDD+número com 10 ou 11 dígitos. CEP persiste oito dígitos. Unicidade no banco protege requisições concorrentes.

perfilCompleto e camposPendentes são derivados dos dados correntes; o estado não é duplicado no banco nem confiado ao Redis. PUT /auth/me aceita nome, e-mail, telefone, CPF apenas se ausente/inválido no legado, e endereco. Campos de papel, fidelidade ou vínculo são recusados. Um ID de endereço precisa pertencer ao cliente. A remoção/transferência do último endereço completo é recusada.

## Sessões

petshop_session é HttpOnly e válido por 30 dias. Cada requisição privada consulta Redis para validar a sessão e PostgreSQL para carregar dados, papel e vínculo atuais. Snapshot Redis contém apenas o ID. Logout revoga a chave.

Google usa ID token verificado pelo Firebase Admin e e-mail verificado. Novo usuário recebe cookie distinto petshop_onboarding por 30 minutos. GET/PUT /auth/onboarding retomam e concluem os dados obrigatórios; essa credencial não autentica recursos do domínio. Ver google-auth.md.

## Provisionamento e migration

pnpm --filter @petshop/backend auditoria:legado enumera incompletudes e colisões de CPF/e-mail normalizados. Resolver colisões manualmente antes da migration; nenhum registro é mesclado ou descartado. Para criar o primeiro administrador, use admin:bootstrap com credenciais explícitas no ambiente. A API permite ao ADMIN provisionar FUNCIONARIO com vínculo único, nunca ADMIN.

## Testes

pnpm --filter @petshop/backend test usa PostgreSQL e Redis indicados por TEST_DATABASE_URL/TEST_REDIS_URL (padrão portas 25432/26379). O teste exige database petshop_test e Redis DB 15. Exemplo: docker compose -p petshop-phase1-test -f .phase1-test-compose.yml up -d.

## Fluxos de cadastro, perfil, endereços e pets (fase 2)

`POST /auth/cadastro`, `GET/PUT /auth/me` e o onboarding Google compartilham o perfil obrigatório com telefone e ao menos um endereço completo. O corpo dos erros mantém `message` e pode incluir `fieldErrors`, por exemplo `endereco.cep`; colisões de e-mail e CPF normalizados, inclusive quando detectadas pelo índice único durante uma concorrência, retornam `409` e identificam o campo. CPF já válido é somente leitura para o cliente e correções exigem atendimento administrativo.

`GET/POST /enderecos` e `GET/PUT/DELETE /enderecos/{id}` permitem gerenciar os endereços próprios. O número aceita zero para indicar ausência de número; complemento é opcional. A remoção ou transferência do último endereço completo retorna `409` e preserva o registro.

`GET/POST /animais` e `GET/PUT/DELETE /animais/{id}` permitem consultar e manter os pets do cliente autenticado. O backend deriva o titular da sessão; clientes não enviam `usuarioId`. Nome, espécie e idade inteira a partir de zero são obrigatórios; porte aceita `PEQUENO`, `MEDIO` ou `GRANDE`. `raca` é opcional: texto é aparado, `null` limpa e a omissão durante a atualização preserva o valor. A migração adiciona a coluna anulável sem preencher raças nos pets existentes. Pets com agendamentos não podem ser removidos; o serviço traduz o conflito da referência na exclusão efetiva para `409` e preserva o pet.

IDs inexistentes retornam `404`; registros de outro cliente retornam `403`. Endereços e animais em operações privadas continuam sujeitos ao perfil completo e à sessão autenticada. Consulte `/api-docs` para os esquemas e respostas de erro atualizados.
