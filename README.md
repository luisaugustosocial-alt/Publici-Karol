# Publici Karol

Portfólio responsivo para Brenda Alencar, com React + Vite, Firebase e Vercel.

## Rodar localmente

1. Instale Node.js.
2. Abra a pasta no VS Code.
3. Rode `npm install`.
4. Copie `.env.example` para `.env`.
5. Preencha as chaves do Firebase e o WhatsApp.
6. Rode `npm run dev`.

## Firebase

Ative Authentication > Sign-in method > Email/Password.
Crie o usuário administrador em Authentication.
Crie o Firestore Database.
No Firestore, crie a coleção `admins` e um documento cujo ID seja o UID do usuário administrador.
Cole o conteúdo de `firestore.rules` em Firestore > Rules e publique.

As coleções `services`, `site`, `portfolio`, `feedbacks` e `orcamentos` são usadas pelo site/painel.

## Vercel

Importe o repositório GitHub.
Adicione todas as variáveis VITE_* em Project Settings > Environment Variables.
Faça o deploy.
