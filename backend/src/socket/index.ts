import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';

const onlineUsers = new Map<string, string>();

export function setupSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; username: string };
      (socket as any).userId = decoded.userId;
      (socket as any).username = decoded.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const username = (socket as any).username as string;

    onlineUsers.set(userId, socket.id);
    await db.execute({ sql: "UPDATE users SET status = 'online' WHERE id = ?", args: [userId] });
    io.emit('user-status-change', { userId, status: 'online' });
    console.log('[Socket] ' + username + ' connected');

    const userGroups = await db.execute({ sql: 'SELECT group_id FROM group_members WHERE user_id = ?', args: [userId] });
    userGroups.rows.forEach((row: any) => socket.join('group:' + row.group_id));

    socket.on('send-dm', async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!content || !content.trim()) return;
      const msgId = uuidv4();
      await db.execute({ sql: 'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)', args: [msgId, userId, receiverId, content.trim()] });
      const msg = { id: msgId, senderId: userId, senderUsername: username, receiverId, content: content.trim(), createdAt: new Date().toISOString() };
      const rs = onlineUsers.get(receiverId);
      if (rs) io.to(rs).emit('receive-dm', msg);
      socket.emit('receive-dm', msg);
    });

    socket.on('send-group-message', async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!content || !content.trim()) return;
      const isMember = await db.execute({ sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', args: [groupId, userId] });
      if (isMember.rows.length === 0) return;
      const msgId = uuidv4();
      await db.execute({ sql: 'INSERT INTO messages (id, sender_id, group_id, content) VALUES (?, ?, ?, ?)', args: [msgId, userId, groupId, content.trim()] });
      const msg = { id: msgId, senderId: userId, senderUsername: username, groupId, content: content.trim(), createdAt: new Date().toISOString() };
      io.to('group:' + groupId).emit('receive-group-message', msg);
    });

    socket.on('call-user', ({ targetId, signal, isScreenShare }: { targetId: string; signal: any; isScreenShare?: boolean }) => {
      const ts = onlineUsers.get(targetId);
      if (ts) io.to(ts).emit('incoming-call', { from: userId, fromUsername: username, signal, isScreenShare: !!isScreenShare });
      else socket.emit('call-failed', { reason: 'Usuario offline' });
    });

    socket.on('accept-call', ({ targetId, signal }: { targetId: string; signal: any }) => {
      const ts = onlineUsers.get(targetId);
      if (ts) io.to(ts).emit('call-accepted', { from: userId, signal });
    });

    socket.on('reject-call', ({ targetId }: { targetId: string }) => {
      const ts = onlineUsers.get(targetId);
      if (ts) io.to(ts).emit('call-rejected', { from: userId });
    });

    socket.on('end-call', ({ targetId }: { targetId: string }) => {
      const ts = onlineUsers.get(targetId);
      if (ts) io.to(ts).emit('call-ended', { from: userId });
    });

    socket.on('ice-candidate', ({ targetId, candidate }: { targetId: string; candidate: any }) => {
      const ts = onlineUsers.get(targetId);
      if (ts) io.to(ts).emit('ice-candidate', { from: userId, candidate });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await db.execute({ sql: "UPDATE users SET status = 'offline' WHERE id = ?", args: [userId] });
      io.emit('user-status-change', { userId, status: 'offline' });
      console.log('[Socket] ' + username + ' disconnected');
    });
  });
}
