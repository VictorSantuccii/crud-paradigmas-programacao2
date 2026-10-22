# PetExpress — especificação de conclusão dos fluxos funcionais

## Objetivo

Concluir o PetExpress como sistema web utilizável por clientes, funcionários e administradores, ligando as telas existentes à API e garantindo regras de acesso, agendamento e fidelidade no backend. Esta especificação toma como base os requisitos RF001–RF004 e RNF001 documentados no `README.md`, as telas React em `apps/frontend/src` e os protótipos HTML em `apps/frontend-html`.

O escopo principal inclui cadastro e perfil do cliente, gestão de pets, agendamento de serviços e consultas, fidelidade, autenticação e operação administrativa. Produtos, compra online, notificações, histórico clínico, vacinas, receitas e envio de mensagens por WhatsApp aparecem em textos ou elementos visuais de protótipos, mas não têm requisito nem modelo persistido definido. Não fazem parte do aceite funcional desta especificação; devem ser removidos ou tratados em uma especificação própria antes de serem apresentados como recursos disponíveis.

## Estado observado

- A home React, cadastro/login (incluindo Google), perfil/Meus Pets, serviços e consultas estão roteados. Serviços e consultas têm calendários, seleção de pet/serviço/profissional e resumo visuais; os dados e horários de demonstração não representam disponibilidade real.
- A página de perfil usa a sessão para nome, e-mail e CPF, mas telefone, endereço, pets, histórico e fidelidade exibidos ou sugeridos ainda não são lidos/salvos integralmente pela API. Botões de editar/remover/cadastrar não completam todos os fluxos.
- O cadastro exige nome, e-mail, CPF e senha. Endereço e telefone não são coletados; CPF é tratado como texto sem validação/normalização canônica.
- O backend tem CRUD para usuários, endereços, animais, fidelidade, planos, assinaturas, serviços, funcionários e agendamentos, autenticação por senha/Google e sessão Redis. As rotas de domínio não aplicam sessão nem autorização por papel ou proprietário do registro.
- O agendamento verifica referências, titularidade do animal e que o fim seja posterior ao início. Não tem estado operacional, consulta de disponibilidade, bloqueio de sobreposição ou cancelamento modelado.
- Fidelidade existe como contador e indicador manual; não há transição de agendamento para concluído, contagem automática nem consumo do benefício.
- O papel `ADMIN` existe. `FUNCIONARIO` não possui vínculo entre `Usuario` e `Funcionario`. Não há interface administrativa.

## Princípios e decisões funcionais

1. Regras de autorização, conflito de agenda, transição de status e cálculo de fidelidade são impostas no backend; o frontend só melhora a experiência e exibe os resultados.
2. O cliente autenticado só consulta e altera os próprios dados e só agenda para pets sob sua titularidade. Funcionário acessa a agenda necessária ao seu trabalho. `ADMIN` administra cadastros e agenda geral.
3. Valores, duração, profissionais, horários disponíveis e progresso de fidelidade apresentados ao usuário vêm da API. Conteúdo demonstrativo nunca pode ser confundido com dado operacional.
4. Manter a arquitetura existente de React/Vite e API Express em camadas (rota, controller, service, repository, Prisma). Toda evolução de modelo deve ter migration Prisma.
5. Datas de agendamento são armazenadas em UTC e exibidas no fuso `America/Sao_Paulo`. A API valida ISO 8601 com offset; horários passados ou fora do expediente são indisponíveis.
6. Um atendimento só conta para fidelidade depois de marcado como concluído. Cancelado não conta. Benefício é consumido uma vez no próximo serviço elegível confirmado.
7. **Preservação de interface em todo o projeto:** implementar funcionalidades nas telas existentes sem redesenhar, reorganizar, simplificar, modernizar ou reinterpretar sua apresentação. Para telas com protótipo em `apps/frontend-html`, portar fielmente estrutura, composição, proporções, cores, tipografia, espaçamento, ícones e comportamento responsivo desse HTML. Para telas sem protótipo HTML, preservar a versão React existente e seus padrões visuais. Esta regra vale para todas as fases, rotas e papéis do sistema.
8. Alterações visuais devem se limitar a conectar controles existentes a dados e operações reais e a apresentar estados necessários de carregamento, vazio, erro e sucesso. Substituir conteúdo fictício por dados reais sem mudar a composição. Remover apenas demonstrações sem suporte de API/modelo, sem inventar cartões, resumos, seções ou fluxos substitutos. Ajustes de acessibilidade e responsividade devem preservar o desenho e a hierarquia existentes. Criar uma nova apresentação só mediante solicitação explícita do usuário.

## Fases de implementação

### Fase 1 — Base de domínio, identidade e autorização

**Objetivo:** proteger a API e preparar dados canônicos para as demais telas.

**Entregas**
- Middleware de sessão Redis para rotas privadas; distinção entre rota pública (catálogo e disponibilidade) e privada.
- Autorização por papel: `CLIENTE`, `FUNCIONARIO`, `ADMIN`. Cliente limitado aos próprios registros; funcionário limitado à própria identidade/agenda; administrador com acesso de gestão.
- Relacionar conta autenticável a funcionário (por exemplo, `Usuario.funcionarioId` único e opcional) e definir provisionamento seguro de contas de funcionário e administrador. Não permitir que o cadastro público escolha papel privilegiado.
- Criar rotas de perfil próprio (`GET/PUT /auth/me` ou equivalente) e impedir que cliente altere `role`, `fidelidadeId` ou dono de dados por payload.
- Adicionar `telefone` ao usuário e validação/normalização de CPF (aceitar com ou sem pontuação, persistir dígitos, validar dígitos verificadores). Normalizar e-mail para minúsculas em todos os fluxos. Tratar conflito após normalização como `409`.
- Estender cadastro convencional e onboarding Google para telefone e endereço. Para Google, permitir retomar o fluxo até o perfil obrigatório ficar completo; não criar sessão de cliente plenamente habilitada antes da conclusão do onboarding.
- Aplicar autorização e filtros nas rotas existentes antes de conectar telas a CRUDs genéricos.

**Critérios de aceite**
- Sem sessão, rotas de dados pessoais e operações privadas respondem `401`; com papel inadequado, `403`.
- Cliente A não consegue listar, consultar, editar, excluir ou agendar dados pertencentes ao cliente B, mesmo alterando IDs no request.
- Cadastro normalizado rejeita CPF inválido e identifica duplicidade mascarada/não mascarada; respostas jamais incluem hash de senha.
- Cliente não consegue criar ou promover conta para `FUNCIONARIO`/`ADMIN` pelo cadastro público.

### Fase 2 — Cadastro, perfil e gestão de pets

**Objetivo:** tornar `/cadastro`, `/cadastro/google/cpf`, `/meu-perfil` e `/meus-pets` fontes reais de dados.

**Referências desta fase:** `/meu-perfil` e `/meus-pets` usam `apps/frontend-html/perfil-substitui a meus pets.html`; cadastro e onboarding Google preservam suas telas React existentes. Aplicam-se os princípios globais de preservação de interface acima.

**Entregas**
- Completar cadastro com telefone/WhatsApp e endereço (CEP, rua, número, bairro e complemento opcional), validando obrigatórios e apresentando erros de campo e duplicidade.
- Carregar perfil próprio da API; implementar edição de nome, e-mail sujeito à unicidade, telefone e endereços; preservar CPF como dado de identificação e exigir processo administrativo para correção, se necessário.
- Implementar listagem, criação, edição e remoção de pets usando endpoints autenticados. Toda operação deriva o dono da sessão, sem confiar em `usuarioId` enviado pelo cliente.
- Acrescentar raça ao animal, se mantida no formulário/tela como dado esperado. O modelo atual também não comporta foto, sexo, peso, vacinação ou histórico clínico; não os exibir como persistidos sem decisão e modelo próprio.
- Remover ações visuais sem efeito e dados falsos de pets, histórico, telefone, endereço e preferências. Exibir estados vazios, carregamento, falha de rede e sucesso.
- Implementar essas funções dentro das telas e da referência visual existente. Conferir a versão React lado a lado com o HTML nos mesmos tamanhos de tela antes de concluir.

**Critérios de aceite**
- Cadastro e onboarding concluem com os dados obrigatórios e criam perfil/endereço de forma consistente.
- Após atualizar perfil ou pet, recarregar a tela preserva os dados. Tentativas de acessar ID de outro cliente são negadas.
- Remoção de pet com agendamento segue regra explícita: bloquear com conflito e explicar que há agendamento associado.
- A versão React de `/meu-perfil` e `/meus-pets` preserva a estrutura e a aparência do HTML de referência, sem cartões estreitos, texto quebrado ou mudança de proporções entre colunas. As telas de cadastro e onboarding mantêm o design existente.

### Fase 3 — Catálogo, disponibilidade e agendamento

**Objetivo:** permitir a criação segura de agendamentos reais pelas telas `/servicos` e `/consultas`.

**Entregas**
- Usar catálogo de serviços da API. Definir classificação/tipo do serviço para separar banho/tosa de consulta/especialidade; serviço genérico atual não contém categoria nem especialidade.
- Disponibilizar endpoint de agenda por serviço, profissional (opcional), data e janela de atendimento. Criar configuração de expediente, pausas, dias fechados, antecedência mínima e intervalo de slots; essas regras ainda não estão modeladas e precisam ser persistidas/configuradas no backend.
- Calcular duração a partir de `Servico.duracaoMin`. Se a duração de banho variar pelo porte, incluir regra/campo explícito e retornar duração final calculada pela API; não inferir a regra no navegador.
- Tornar elegíveis apenas funcionários que atendem a categoria/serviço. O modelo atual não liga funcionário a especialidades; criar essa associação ou uma regra equivalente administrável.
- Criar status de agendamento: `AGENDADO`, `CONFIRMADO` (se houver confirmação operacional), `CONCLUIDO`, `CANCELADO` e `NAO_COMPARECEU` (se necessário à operação). Formalizar transições permitidas e quem pode executá-las.
- Implementar `POST /agendamentos` sem confiar no `usuarioId`: derivar da sessão do cliente. Atualização/cancelamento com validação de papel, janela permitida e motivo opcional conforme política definida.
- Prevenir intervalos sobrepostos por funcionário no backend para criação e atualização, de forma atômica/transacional, considerando apenas status que ocupam agenda. Devolver `409` previsível em corrida/conflito.
- Persistir observações/sintomas da consulta somente se consideradas necessárias; limitar tamanho e visibilidade a cliente e equipe responsável.
- Recalcular horários após escolha de serviço, profissional, data e duração; após conflito `409`, atualizar disponibilidade e manter o restante do formulário quando possível.

**Critérios de aceite**
- As telas exibem somente pets do cliente autenticado, serviços ativos, profissionais elegíveis e horários retornados pela API.
- O início e o fim são determinados/validados no backend; duração e preço do resumo correspondem ao serviço escolhido.
- Dois pedidos simultâneos para o mesmo profissional e intervalos que se sobrepõem não podem ambos ser confirmados.
- O cliente pode ver os próprios próximos agendamentos e cancelá-los conforme política; não pode alterar status para concluído nem escolher outro funcionário à força.
- Consulta e serviço persistem após recarregar e aparecem no histórico com data, serviço, pet, profissional e estado reais.

### Fase 4 — Fidelidade automática

**Objetivo:** fechar o RF004 e exibir progresso confiável no perfil e no resumo de agendamento.

**Entregas**
- Formalizar a regra: cada oito banhos concluídos liberam um benefício para um banho futuro; somente categoria de serviço elegível conta. Consultas, cancelamentos e faltas não contam.
- Atualizar contador e benefício na mesma transação da conclusão do agendamento; impedir contagem duplicada em reenvio ou mudança de estado repetida.
- Reservar/aplicar o benefício no agendamento elegível seguinte e consumir somente quando o atendimento se tornar concluído (ou definir reserva e liberação em cancelamento). Tornar explícita a política de cancelamento para benefício reservado.
- Expor resumo da fidelidade ao cliente autenticado, sem permitir alteração manual pelo cliente. Restringir ajustes administrativos a papel autorizado e registrar motivo/auditoria.
- Definir valor do benefício (serviço gratuito, desconto ou outro) antes da implementação do cálculo; a regra “benefício ativo” atual não contém valor/escopo suficiente para calcular preço.

**Critérios de aceite**
- Oito banhos concluídos geram exatamente um benefício; consultas e demais estados não incrementam.
- Repetir a conclusão do mesmo agendamento não incrementa novamente.
- O benefício elegível aparece no resumo, reduz o valor conforme regra definida e não pode ser aplicado duas vezes.
- Cancelar agendamento com benefício reservado segue política determinística e deixa trilha auditável.

### Fase 5 — Operação de funcionário e administração

**Objetivo:** disponibilizar a operação que sustenta catálogo, agenda e contas.

**Entregas**
- Área autenticada de funcionário com agenda própria, detalhes mínimos dos atendimentos e ação de atualizar estado conforme transições autorizadas.
- Área `ADMIN` para gerir usuários/funcionários, serviços e categorias, especialidades, expediente, bloqueios e agenda geral; permitir reagendamento/cancelamento com registro de responsável e motivo.
- Criar/desativar funcionários sem apagar histórico. Usuário funcionário e cadastro de funcionário devem estar vinculados e sua permissão ser revogada ao desativar.
- Endpoints administrativos com filtros de período, profissional, estado e serviço; evitar descarregar informações desnecessárias de clientes.
- Não implementar painel financeiro ou gestão de assinatura como requisito da primeira entrega: planos/assinaturas existem no banco, mas não são requisito de tela nem parte dos fluxos centrais RF001–RF004.

**Critérios de aceite**
- Funcionário só vê/atualiza agenda permitida e não administra contas, preços ou outros funcionários.
- `ADMIN` configura catálogo e disponibilidade e acompanha agenda global.
- Alterações administrativas críticas deixam autor, horário e ação registrados.

### Fase 6 — Integração final, consistência e entrega

**Objetivo:** fechar navegação, estados e contrato entre telas e API.

**Entregas**
- Revisar home e navegação: CTA de serviço leva a `/servicos`, consulta leva a `/consultas`, perfil exige sessão; remover links `#` e promessas sem funcionalidade (loja/app/notificações) ou ligá-las a destinos implementados.
- Padronizar formatos monetários, telefone, CPF, datas e mensagens de erro. Tratar `401` globalmente com atualização da sessão e retorno ao login preservando destino; tratar `403`, `404`, `409` e falhas de rede com mensagem contextual.
- Rever acessibilidade de formulários, navegação por teclado, rótulos, foco após erro, confirmação de exclusão e layouts mobile presentes nos protótipos.
- Conferir visualmente todas as telas alteradas contra suas referências originais nos mesmos tamanhos de tela; corrigir qualquer mudança não solicitada de composição, proporções, tipografia, cores, espaçamento ou hierarquia.
- Atualizar Swagger, README, exemplos de configuração e instruções de execução com as novas rotas, papéis, estados e regras.
- Fazer verificação manual ponta a ponta: cadastro → login → perfil/pet → agendamento → mudança de estado → fidelidade → visão de funcionário/admin. Cobrir também autorização cruzada e conflito concorrente conforme infraestrutura disponível.

**Critérios de aceite**
- Nenhuma ação apresentada como funcional é apenas local ou usa lista de demonstração.
- Os fluxos essenciais persistem após recarregar e mantêm regras iguais entre UI e API.
- Todas as telas existentes mantêm fidelidade às suas referências visuais; mudanças de interface se limitam à integração funcional, estados necessários e remoção de demonstrações sem suporte.
- Documentação e Swagger descrevem o comportamento entregue, incluindo códigos de erro e permissões.

## Dependências e ordem

A Fase 1 é pré-requisito para integrar dados privados. A Fase 2 habilita os agendamentos ligados ao cliente e pet. A Fase 3 cria estados e transições consumidos pela Fase 4; fidelidade não deve ser automatizada antes disso. A Fase 5 depende de identidade/autorização e das regras da Fase 3. A Fase 6 consolida todas as fases.

## Pontos de produto que precisam de decisão antes das fases correspondentes

1. Cadastro: telefone é obrigatório? Endereço é obrigatório ou pode ser concluído depois?
2. Agenda: expediente, dias de funcionamento, duração/intervalo do slot, antecedência e política de cancelamento/reagendamento.
3. Serviços: quais categorias e quais serviços contam como banho para fidelidade? A duração varia por porte?
4. Consultas: quais especialidades existem e quais profissionais podem atendê-las? Observações clínicas serão persistidas?
5. Fidelidade: qual é exatamente o benefício liberado a cada oito banhos e quando ele é consumido?
6. Papéis: `ADMIN` representa o proprietário; funcionários podem editar estados e cancelar? Como contas de equipe são criadas e desativadas?
7. Dados de saúde visualizados nos protótipos (vacinas, microchip, histórico): ficam fora da primeira entrega ou viram requisito separado?

## Fora do escopo desta entrega

- Loja, produtos, carrinho, pagamento online e aplicativo móvel.
- Envio efetivo de WhatsApp/e-mail, notificações push e lembretes automáticos.
- Prontuário veterinário, vacinas, receitas, anexos e histórico clínico detalhado.
- Cobrança, renovação e gestão operacional de assinaturas/plano.

Esses elementos podem ser especificados depois sem bloquear os fluxos RF001–RF004 e RNF001 definidos aqui.
