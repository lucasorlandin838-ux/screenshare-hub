import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { db } from '../db/database';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const r = await db.execute({ sql: 'SELECT g.id, g.name, g.owner_id, g.invite_code FROM groups_table g JOIN group_members gm ON gm.group_id = g.id WHERE gm.user_id = ?', args: [req.userId!] });
  res.json(r.rows);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome obrigatorio' }); return; }
  const id = uuidv4();
  const inviteCode = uuidv4().split('-')[0].toUpperCase();
  await db.execute({ sql: 'INSERT INTO groups_table (id, name, owner_id, invite_code) VALUES (?, ?, ?, ?)', args: [id, name, req.userId!, inviteCode] });
  await db.execute({ sql: 'INSERT INTO group_members (id, group_id, user_id) VALUES (?, ?, ?)', args: [uuidv4(), id, req.userId!] });
  res.status(201).json({ id, name, invite_code: inviteCode });
});

router.post('/join', async (req: AuthRequest, res: Response) => {
  const { inviteCode } = req.body;
  const gr = await db.execute({ sql: 'SELECT * FROM groups_table WHERE invite_code = ?', args: [inviteCode] });
  if (gr.rows.length === 0) { res.status(404).json({ error: 'Codigo invalido' }); return; }
  const group = gr.rows[0] as any;
  const already = await db.execute({ sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', args: [group.id, req.userId!] });
  if (already.rows.length > 0) { res.status(409).json({ error: 'Ja e membro' }); return; }
  await db.execute({ sql: 'INSERT INTO group_members (id, group_id, user_id) VALUES (?, ?, ?)', args: [uuidv4(), group.id, req.userId!] });
  res.json({ message: 'Entrou no grupo', group: { id: group.id, name: group.name } });
});

router.get('/:groupId/members', async (req: AuthRequest, res: Response) => {
  const isMember = await db.execute({ sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', args: [req.params.groupId, req.userId!] });
  if (isMember.rows.length === 0) { res.status(403).json({ error: 'Nao e membro' }); return; }
  const members = await db.execute({ sql: 'SELECT u.id, u.username, u.status FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ?', args: [req.params.groupId] });
  res.json(members.rows);
});

export default router;
