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
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: [FRONTEND_URL, 'http://localhost:5173'], methods: ['GET', 'POST'], credentials: true }
});

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:5173'], credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/friends', friendsRouter);
app.use('/groups', groupsRouter);
app.use('/messages', messagesRouter);

setupSocket(io);

const PORT = parseInt(process.env.PORT || '3001', 10);
initDb().then(() => {
  httpServer.listen(PORT, () => console.log('ScreenShare Hub backend rodando na porta ' + PORT));
}).catch((err) => { console.error('DB init failed:', err); process.exit(1); });
