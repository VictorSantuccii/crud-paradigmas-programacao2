# Capturas do projeto

[Índice da documentação](../README.md) · [Apresentação do projeto](../../README.md)

As imagens mostram a interface React do PetExpress. A página inicial foi capturada para a apresentação do repositório; as capturas da fase 4 registram o aceite de serviços, consultas e fidelidade com dados de teste em ambiente isolado.

## Galeria

| Tela / cenário | Desktop | Mobile |
| --- | --- | --- |
| Página inicial | [Apresentação e atalhos](inicio-desktop.png) | — |
| Perfil com benefício disponível | [Perfil do tutor](fase4/perfil-desktop.png) | — |
| Agendamento com desconto de fidelidade | [Prévia do serviço](fase4/servicos-previa-desktop.png) | [Prévia do serviço](fase4/servicos-previa-mobile.png) |
| Consulta sem desconto de fidelidade | [Consulta](fase4/consulta-desktop.png) | [Consulta](fase4/consulta-mobile.png) |
| Perfil após consumir benefício | [Saldo atualizado](fase4/perfil-consumo-desktop.png) | [Saldo atualizado](fase4/perfil-consumo-mobile.png) |
| Cotação alterada antes da confirmação | — | [Nova confirmação de valor](fase4/cotacao-mobile.png) |

## Contexto das capturas

- `inicio-desktop.png`: viewport 1440×1000, capturada em 28/10/2026. A home contém conteúdo de apresentação ilustrativo.
- `fase4/`: aceite de 28/10/2026 com viewport desktop 1280×900 e mobile 390×844. Algumas imagens incluem a página inteira e por isso têm altura maior que o viewport.
- Os nomes de tutores, pets, profissionais e valores das capturas autenticadas são dados de fixtures. Não representam um catálogo inicial obrigatório.
- Os estados apresentados variam: benefício disponível, reservado, devolvido ou consumido são momentos diferentes do fluxo.

O [relatório da fase 4](../fase4-validacao.md) descreve a preparação dos dados, os passos de aceite e as verificações de responsividade.

## Adicionar novas imagens

1. Execute a aplicação e prepare o cenário em ambiente de teste, sem dados pessoais reais.
2. Aguarde fontes, imagens e dados terminarem de carregar.
3. Capture em desktop e mobile quando a mudança afetar ambos.
4. Use nomes descritivos e mantenha evidências de uma entrega em uma subpasta própria.
5. Atualize esta galeria e, quando relevante, a apresentação no README principal.

Os READMEs usam caminhos relativos para as imagens continuarem acessíveis no clone e no GitHub.
