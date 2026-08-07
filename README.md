# MktFlow — Gerência de Marketing (2 usuários)

App estático (Next.js + Firebase) para você e seu parceiro gerenciarem tarefas de marketing de qualquer dispositivo, com sincronização em tempo real entre os dois.

Login por PIN (padrão `1234`) — sem Firebase Auth. Usuários iniciais: **Lucas Mendes** (DESIGNER) e **Thiago Silva** (TRAFFIC_MANAGER).

## Arquitetura

- **Frontend**: Next.js (SSG, `output: "export"`) — 100% client-side.
- **Banco de dados**: Firestore em tempo real (`onSnapshot`). Coleções planas: `users`, `tasks` (checklist/attachments/comments/activityLogs ficam como arrays dentro de cada tarefa) e `settings/brand`.
- **Arquivos**: Firebase Storage (upload direto do navegador).
- **Sessão**: `localStorage` (id do usuário logado).
- **Hosting**: Netlify (`netlify.toml`, `publish = "out"`).

Não existe servidor nem API própria — não use o app sem configurar o Firebase.

## Setup do Firebase (uma única vez)

1. Acesse o [Firebase Console](https://console.firebase.google.com) e abra o seu projeto.
2. **Adicione um Web App** (Project settings → Geral → Seus apps → "Web"). Copie as credenciais.
3. **Firestore Database**: Crie o banco (modo de produção ou teste; as regras abaixo liberam tudo).
4. **Storage**: Habilite o Cloud Storage.
5. Preencha o arquivo `.env.local` (crie a partir de `.env.example`) com as credenciais:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

6. **Regras de segurança** — cole o conteúdo de `firestore.rules` na aba "Regras" do Firestore, e o de `storage.rules` na aba "Regras" do Storage, e publique.

> ⚠️ As regras liberam leitura/escrita para qualquer visitante, porque o app não usa Firebase Auth. Isso é o esperado para um app privado de 2 usuários com senha em PIN, mas só divulgue o link para as pessoas certas.

7. No primeiro acesso, a tela de login tem o botão **"Popular dados de exemplo"** (cria os 2 usuários e 3 tarefas iniciais).

## Rodando localmente

```bash
npm install
npm run dev
# http://localhost:3000
```

Login: escolha um usuário, PIN `1234`.

## Deploy na Netlify

1. Crie uma conta em [netlify.com](https://www.netlify.com) e "Add new site → Import an existing project".
2. Conecte o repositório (ou faça upload da pasta `out` após `npm run build`).
3. Em **Site settings → Environment variables**, adicione as mesmas 6 variáveis `NEXT_PUBLIC_FIREBASE_*` do `.env.local`.
4. O `netlify.toml` já define `npm run build` e publica a pasta `out`. Deploy e pronto.

Após o deploy, tanto você quanto seu parceiro usam o mesmo link — as mudanças aparecem instantaneamente nos dois dispositivos.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o build estático em `out/` |
| `npm run lint` | Verifica lint |
| `npx serve out` | Serve o build estático localmente (teste de produção) |
