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

Usuários Google já cadastrados entram pela conta associada ao e-mail verificado. No primeiro acesso de um e-mail novo, o app pede CPF antes de criar o usuário, pois o banco mantém esse campo obrigatório.
