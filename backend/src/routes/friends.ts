import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { db } from '../db/database';

const router = Router();
router.use(authMiddleware);

router.get('/search', async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  if (!q) { res.json([]); return; }
  const r = await db.execute({ sql: 'SELECT id, username FROM users WHERE username LIKE ? AND id != ? LIMIT 10', args: ['%' + String(q) + '%', req.userId!] });
  res.json(r.rows);
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const r = await db.execute({
    sql: "SELECT u.id, u.username, u.status FROM friendships f JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'",
    args: [req.userId!, req.userId!, req.userId!]
  });
  res.json(r.rows);
});

router.get('/requests', async (req: AuthRequest, res: Response) => {
  const r = await db.execute({
    sql: "SELECT f.id as friendship_id, u.id, u.username FROM friendships f JOIN users u ON u.id = f.requester_id WHERE f.addressee_id = ? AND f.status = 'pending'",
    args: [req.userId!]
  });
  res.json(r.rows);
});

router.post('/request', async (req: AuthRequest, res: Response) => {
  const { addresseeId } = req.body;
  if (!addresseeId) { res.status(400).json({ error: 'addresseeId obrigatorio' }); return; }
  if (addresseeId === req.userId) { res.status(400).json({ error: 'Nao pode adicionar a si mesmo' }); return; }
  const existing = await db.execute({ sql: 'SELECT id FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)', args: [req.userId!, addresseeId, addresseeId, req.userId!] });
  if (existing.rows.length > 0) { res.status(409).json({ error: 'Pedido ja existe' }); return; }
  await db.execute({ sql: 'INSERT INTO friendships (id, requester_id, addressee_id) VALUES (?, ?, ?)', args: [uuidv4(), req.userId!, addresseeId] });
  res.status(201).json({ message: 'Pedido enviado' });
});

router.post('/accept', async (req: AuthRequest, res: Response) => {
  const { friendshipId } = req.body;
  const r = await db.execute({ sql: 'SELECT id FROM friendships WHERE id = ? AND addressee_id = ?', args: [friendshipId, req.userId!] });
  if (r.rows.length === 0) { res.status(404).json({ error: 'Pedido nao encontrado' }); return; }
  await db.execute({ sql: "UPDATE friendships SET status = 'accepted' WHERE id = ?", args: [friendshipId] });
  res.json({ message: 'Amizade aceita' });
});

router.post('/reject', async (req: AuthRequest, res: Response) => {
  const { friendshipId } = req.body;
  const r = await db.execute({ sql: 'SELECT id FROM friendships WHERE id = ? AND addressee_id = ?', args: [friendshipId, req.userId!] });
  if (r.rows.length === 0) { res.status(404).json({ error: 'Pedido nao encontrado' }); return; }
  await db.execute({ sql: 'DELETE FROM friendships WHERE id = ?', args: [friendshipId] });
  res.json({ message: 'Pedido rejeitado' });
});

export default router;
