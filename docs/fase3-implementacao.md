# Fase 3 — Catálogo e agenda

Implementação do plano aprovado: catálogo classificado e ativado explicitamente; habilitação por serviço; expediente global de segunda a sexta, 09–12h e 13–18h, em America/Sao_Paulo; slots de 30 minutos; antecedências iniciais de 24 horas; bloqueios globais e por profissional.

Reservas preservam preço e duração contratados. Estados finais são irreversíveis e transições idempotentes. Um cálculo compartilhado atende disponibilidade, criação e reagendamento. Transações usam um advisory lock global de agenda e bloqueio da reserva; exclusão GiST protege intervalos semiabertos por profissional mesmo fora da API. Escritas administrativas relacionadas usam o mesmo lock. Dados legados conservam IDs, categoria desconhecida, preço histórico nulo e duração derivada do intervalo registrado. A migração audita e aborta intervalos inválidos/sobrepostos antes de alterar o domínio.

As telas preservam os cartões, colunas, cores e tipografia das referências HTML. Pets, catálogo, profissionais e calendário vêm da API; consultas mantêm o seletor de veterinário; serviços escolhem profissional no slot. Perfil apresenta próximos atendimentos e histórico, com cancelamento e reagendamento.

Verificação: testes de disponibilidade com relógio explícito; integração HTTP de permissões/contratos/transições; concorrência PostgreSQL; migração vazia/legada; typecheck, lint, builds; navegação desktop e mobile com os serviços de teste. Catálogo demonstrativo só em fixtures. Pagamento, prontuário, fidelidade automática e painel administrativo ficam fora desta fase.
