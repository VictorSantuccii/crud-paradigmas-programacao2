# Autenticação Google

O login Google usa Firebase Authentication no navegador e valida o ID token no backend antes de criar a sessão HTTP do PetExpress.

## Firebase Console

1. No projeto `petshop-tic`, abra **Authentication → Sign-in method** e habilite **Google**.
2. Em **Authentication → Settings → Authorized domains**, confirme `localhost` e adicione o domínio de produção do frontend quando ele existir.
3. Em **Project settings → Service accounts**, gere uma chave privada para o Admin SDK. Guarde o arquivo fora do repositório.

## Desenvolvimento local

- O arquivo `apps/frontend/.env.example` contém a configuração web enviada. Copie-o para `apps/frontend/.env` para iniciar o frontend localmente.
- Para o backend fora do Docker, configure `GOOGLE_APPLICATION_CREDENTIALS` no ambiente com o caminho absoluto do arquivo de service account. O `FIREBASE_PROJECT_ID` já está definido no `.env.example` da raiz.
- Para o backend no Docker Compose, configure `FIREBASE_SERVICE_ACCOUNT_JSON` no `.env` da raiz com o JSON da service account em uma linha. Os `\\n` da chave privada devem permanecer escapados. Não compartilhe nem versione essa credencial.

Usuários Google existentes entram pelo e-mail verificado. Contas incompletas concluem o próprio perfil. Novos e-mails usam onboarding temporário e só são persistidos após a validação dos dados obrigatórios, descrita abaixo.

## Onboarding do PetExpress

O backend verifica o ID token Firebase e usa apenas o e-mail verificado e o nome da identidade validada. Novo e-mail recebe cookie HttpOnly petshop_onboarding por 30 minutos, separado da sessão comum. GET /auth/onboarding restaura nome/e-mail verificados e PUT /auth/onboarding recebe cpf, telefone e endereco. A conta só é gravada após todos os campos passarem na validação. Na conclusão, o cookie temporário é removido e petshop_session é emitido.

Recarregar /cadastro/google/cpf mantém o fluxo via cookie. Se o prazo vencer, inicie o acesso Google novamente. Contas legadas autenticadas permanecem limitadas a GET/PUT /auth/me e logout até concluir os dados obrigatórios.

Cadastro normal usa POST /auth/cadastro com nome, email, cpf, senha, telefone, endereco e confirmarSenha opcional. Endereço recebe cep, rua, bairro, numero e complemento opcional. CPF é validado e salvo com 11 dígitos; e-mail em minúsculas; telefone como DDD+número. GET/PUT /auth/me mantém perfil próprio; CPF válido é imutável para o cliente e endereço com ID precisa pertencer à conta.

## Migração e provisionamento

Antes da migration, execute pnpm --filter @petshop/backend auditoria:legado com o banco pretendido. A auditoria lista CPF inválido, dados pendentes e colisões após normalização. Corrija conflitos administrativamente antes de executar pnpm --filter @petshop/backend prisma:migrate; a migration aborta antes de alterar dados se detectar colisões. Ela normaliza CPF e e-mail, preserva IDs/vínculos e adiciona telefone nullable. Não mescla nem apaga contas.

O primeiro ADMIN só é criado localmente. Defina ADMIN_NOME, ADMIN_EMAIL, ADMIN_CPF e ADMIN_SENHA no ambiente e execute pnpm --filter @petshop/backend admin:bootstrap. A senha precisa ter oito caracteres ou mais; não existe senha padrão. A opção explícita --adicional permite um ADMIN extra. Depois, ADMIN pode criar FUNCIONARIO por POST /usuarios, enviando role FUNCIONARIO e funcionarioId existente ou funcionario com nome/cargo/telefone para criar cadastro e conta na mesma transação. A API não cria ADMIN.
