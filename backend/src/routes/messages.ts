import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { db } from '../db/database';

const router = Router();
router.use(authMiddleware);

router.get('/dm/:friendId', async (req: AuthRequest, res: Response) => {
  const { friendId } = req.params;
  const r = await db.execute({
    sql: 'SELECT m.id, m.content, m.created_at, u.id as sender_id, u.username as sender_username FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.group_id IS NULL AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)) ORDER BY m.created_at ASC LIMIT 100',
    args: [req.userId!, friendId, friendId, req.userId!]
  });
  res.json(r.rows);
});

router.get('/group/:groupId', async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const isMember = await db.execute({ sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', args: [groupId, req.userId!] });
  if (isMember.rows.length === 0) { res.status(403).json({ error: 'Nao e membro do grupo' }); return; }
  const r = await db.execute({
    sql: 'SELECT m.id, m.content, m.created_at, u.id as sender_id, u.username as sender_username FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.group_id = ? ORDER BY m.created_at ASC LIMIT 100',
    args: [groupId]
  });
  res.json(r.rows);
});

export default router;
