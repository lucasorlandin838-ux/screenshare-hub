import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) { res.status(400).json({ error: 'Todos os campos sao obrigatorios' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' }); return; }
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ? OR username = ?', args: [email, username] });
    if (existing.rows.length > 0) { res.status(409).json({ error: 'Email ou username ja em uso' }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.execute({ sql: 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', args: [id, username, email, passwordHash] });
    const token = jwt.sign({ userId: id, username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, username, email } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email e senha sao obrigatorios' }); return; }
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    if (result.rows.length === 0) { res.status(401).json({ error: 'Credenciais invalidas' }); return; }
    const user = result.rows[0] as any;
    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) { res.status(401).json({ error: 'Credenciais invalidas' }); return; }
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro interno' }); }
});

export default router;
