import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db/database';
import authRouter from './routes/auth';
import friendsRouter from './routes/friends';
import groupsRouter from './routes/groups';
import messagesRouter from './routes/messages';
import { setupSocket } from './socket';

const app = express();
const httpServer = createServer(app);

// CORS permissivo para aceitar qualquer domínio do frontend (Vercel, Render ou localhost)
const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
};

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/auth', authRouter);
app.use('/friends', friendsRouter);
app.use('/groups', groupsRouter);
app.use('/messages', messagesRouter);

setupSocket(io);

const PORT = parseInt(process.env.PORT || '3001', 10);
initDb().then(() => {
  httpServer.listen(PORT, '0.0.0.0', () => console.log('ScreenShare Hub backend rodando na porta ' + PORT));
}).catch((err) => { console.error('DB init failed:', err); process.exit(1); });
