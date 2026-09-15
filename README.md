# ScreenShare Hub

Aplicação web estilo Discord focada em **compartilhamento de tela**, chamadas de voz/vídeo, chat em tempo real, sistema de amigos e grupos.

## Funcionalidades

- 🔐 Login e cadastro com e-mail/senha
- 👥 Sistema de amigos: buscar, adicionar, aceitar/rejeitar pedidos
- 💬 Chat em tempo real (DM e grupos) via Socket.IO
- 📹 Chamadas de voz/vídeo P2P via WebRTC (simple-peer)
- 🖥️ Compartilhamento de tela com um clique
- 🟢 Indicadores de presença online/offline em tempo real
- 🔔 Notificações de chamada recebida com modal de aceitar/rejeitar
- 🏷️ Grupos com código de convite para convidar amigos

## Tecnologias

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **Banco de dados**: LibSQL (SQLite compatível, sem binário nativo)
- **Chamadas**: WebRTC via simple-peer
- **Deploy**: Render (backend) + Vercel (frontend)

---

## Rodar localmente

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite .env e ajuste JWT_SECRET
npm install
npm run dev
```

Backend disponível em: http://localhost:3001

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# .env já aponta para http://localhost:3001
npm install
npm run dev
```

Frontend disponível em: http://localhost:5173

---

## Deploy na internet (Render + Vercel)

### Backend → Render.com (gratuito)

1. Faça push do repositório para o GitHub
2. Acesse [render.com](https://render.com) e crie conta
3. Clique em **New → Web Service**
4. Conecte o repositório e selecione a pasta `backend/`
5. Configure:
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm start`
   - **Root directory**: `backend`
6. Em **Environment Variables**, adicione:
   - `JWT_SECRET` = qualquer string aleatória longa
   - `FRONTEND_URL` = URL do Vercel (ex: `https://screenshare-hub.vercel.app`)
   - `NODE_ENV` = `production`
7. Clique em **Create Web Service**
8. Anote a URL gerada (ex: `https://screenshare-hub-backend.onrender.com`)

### Frontend → Vercel (gratuito)

1. Acesse [vercel.com](https://vercel.com) e crie conta
2. Clique em **New Project → Import Git Repository**
3. Selecione o repositório, configure:
   - **Root Directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = URL do Render (ex: `https://screenshare-hub-backend.onrender.com`)
5. Clique em **Deploy**

> ⚠️ **Importante**: Após o deploy do Vercel, volte ao Render e atualize a variável `FRONTEND_URL` com a URL real do Vercel. Isso é necessário para o CORS funcionar.

---

## Como usar

1. Acesse a URL do Vercel
2. Crie uma conta (ou entre com uma existente)
3. Na aba **Amigos**, clique em **Adicionar amigo** → busque pelo username → envie o pedido
4. O amigo precisa aceitar na aba de pedidos pendentes
5. Clique no amigo na lista → janela de chat abre
6. Para **ligar**, clique no botão 📹 ao lado do nome do amigo (ou no header do chat)
7. Durante a chamada, clique no ícone de **monitor** para compartilhar a tela
8. Na aba **Grupos**, crie grupos e compartilhe o **código de convite** com amigos

---

## Estrutura

```
screenshare-hub/
├── backend/
│   ├── src/
│   │   ├── db/database.ts       # LibSQL + schema SQLite
│   │   ├── middleware/auth.ts   # JWT middleware
│   │   ├── routes/              # auth, friends, groups, messages
│   │   ├── socket/index.ts      # Socket.IO: chat + WebRTC signaling
│   │   └── index.ts             # Entry point Express
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/             # AuthContext, SocketContext
    │   ├── hooks/useWebRTC.ts   # WebRTC hook (simple-peer)
    │   ├── components/          # VideoCall, Chat, Sidebar, IncomingCallModal
    │   ├── pages/               # Login, Register, Home
    │   └── App.tsx
    └── package.json
```
