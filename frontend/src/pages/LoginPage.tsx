import React, { useState, useCallback } from 'react';
import {
  Monitor,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  User,
  Sparkles,
  Github,
  Zap,
  Shield,
  Users,
  MessageSquare,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Avatar emoji presets for registration
const AVATAR_EMOJIS = [
  '😎', '🤖', '👾', '🎮', '🔥', '⚡', '🌟', '💎',
  '🦁', '🐺', '🦊', '🐉', '🎭', '🏆', '🚀', '💀',
  '🎯', '🎸', '🎧', '💻', '🌙', '☀️', '🌈', '🎲',
];

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode('hub_salt_v1_' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface StoredUser {
  username: string;
  passwordHash: string;
  avatar: string;
  nameFont: string;
  nameColor: string;
  createdAt: string;
}

function getStoredUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(localStorage.getItem('hub_users_v2') || '{}');
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, StoredUser>) {
  try {
    localStorage.setItem('hub_users_v2', JSON.stringify(users));
  } catch {}
}

interface Props {
  onLogin: (username: string, avatar: string) => void;
}

type Tab = 'login' | 'register';

export default function LoginPage({ onLogin }: Props) {
  const { theme, accent } = useTheme();

  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!cleanUsername) {
        setError('Por favor, digite seu apelido.');
        return;
      }
      if (!password) {
        setError('Por favor, digite sua senha.');
        return;
      }

      setLoading(true);
      try {
        const users = getStoredUsers();
        const storedUser = users[cleanUsername];

        // Legacy users (sem senha) — migrar automaticamente
        const legacyUsername = localStorage.getItem('hub_username');
        if (!storedUser && legacyUsername?.toLowerCase() === cleanUsername) {
          // Primeiro login após migração: criar conta com essa senha
          const hash = await hashPassword(password);
          const newUser: StoredUser = {
            username: cleanUsername,
            passwordHash: hash,
            avatar: localStorage.getItem('hub_avatar') || selectedAvatar,
            nameFont: localStorage.getItem('hub_name_font') || 'default',
            nameColor: localStorage.getItem('hub_name_color') || '#ffffff',
            createdAt: new Date().toISOString(),
          };
          users[cleanUsername] = newUser;
          saveStoredUsers(users);
          localStorage.setItem('hub_username', cleanUsername);
          if (rememberMe) localStorage.setItem('hub_remember', '1');
          onLogin(cleanUsername, newUser.avatar);
          return;
        }

        if (!storedUser) {
          setError('Usuário não encontrado. Crie uma conta primeiro!');
          setLoading(false);
          return;
        }

        const hash = await hashPassword(password);
        if (hash !== storedUser.passwordHash) {
          setError('Senha incorreta. Tente novamente.');
          setLoading(false);
          return;
        }

        // Restaura configurações do usuário
        localStorage.setItem('hub_username', storedUser.username);
        localStorage.setItem('hub_avatar', storedUser.avatar);
        localStorage.setItem('hub_name_font', storedUser.nameFont);
        localStorage.setItem('hub_name_color', storedUser.nameColor);
        if (rememberMe) localStorage.setItem('hub_remember', '1');

        onLogin(storedUser.username, storedUser.avatar);
      } finally {
        setLoading(false);
      }
    },
    [cleanUsername, password, rememberMe, selectedAvatar, onLogin]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!cleanUsername || cleanUsername.length < 2) {
        setError('O apelido deve ter pelo menos 2 caracteres (letras, números ou _).');
        return;
      }
      if (cleanUsername.length > 20) {
        setError('O apelido deve ter no máximo 20 caracteres.');
        return;
      }
      if (!password || password.length < 4) {
        setError('A senha deve ter pelo menos 4 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem. Verifique e tente novamente.');
        return;
      }

      setLoading(true);
      try {
        const users = getStoredUsers();
        if (users[cleanUsername]) {
          setError('Este apelido já está em uso. Escolha outro ou faça login!');
          setLoading(false);
          return;
        }

        const hash = await hashPassword(password);
        const newUser: StoredUser = {
          username: cleanUsername,
          passwordHash: hash,
          avatar: selectedAvatar,
          nameFont: 'default',
          nameColor: '#ffffff',
          createdAt: new Date().toISOString(),
        };

        users[cleanUsername] = newUser;
        saveStoredUsers(users);

        localStorage.setItem('hub_username', cleanUsername);
        localStorage.setItem('hub_avatar', selectedAvatar);
        localStorage.setItem('hub_name_font', 'default');
        localStorage.setItem('hub_name_color', '#ffffff');
        if (rememberMe) localStorage.setItem('hub_remember', '1');

        onLogin(cleanUsername, selectedAvatar);
      } finally {
        setLoading(false);
      }
    },
    [cleanUsername, password, confirmPassword, selectedAvatar, rememberMe, onLogin]
  );

  return (
    <div
      className="min-h-screen flex font-sans overflow-hidden relative"
      style={{ backgroundColor: theme.bgMain, color: theme.textPrimary }}
    >
      {/* Animated background glow blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse pointer-events-none"
        style={{ backgroundColor: accent.hex }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse pointer-events-none"
        style={{ backgroundColor: accent.hex, animationDelay: '1.5s' }}
      />

      {/* LEFT PANEL — Branding (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative"
        style={{ backgroundColor: theme.bgSidebar }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(${theme.borderColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.borderColor} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 text-center max-w-sm">
          {/* Logo */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: accent.hex,
              boxShadow: `0 0 40px ${accent.hex}40`,
            }}
          >
            <Monitor className="w-10 h-10" style={{ color: accent.hex }} />
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            ScreenShare Hub
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-10">
            O Discord gratuito do navegador. Chame amigos, compartilhe a tela, jogue junto e converse sem pagar nada.
          </p>

          {/* Feature list */}
          <div className="space-y-4 text-left">
            {[
              { icon: MessageSquare, text: 'Chat de texto com fotos e arquivos' },
              { icon: Zap, text: 'Compartilhamento de tela P2P em tempo real' },
              { icon: Users, text: 'Grupos estilo Discord com chamadas' },
              { icon: Shield, text: '100% gratuito, sem servidor pago' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: accent.hex + '25', border: `1px solid ${accent.hex}60` }}
                >
                  <Icon className="w-4 h-4" style={{ color: accent.hex }} />
                </div>
                <span className="text-zinc-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom GitHub link */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <a
            href="https://github.com/lucasorlandin838-ux/screenshare-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            <Github className="w-3.5 h-3.5" />
            lucasorlandin838-ux/screenshare-hub
          </a>
        </div>
      </div>

      {/* RIGHT PANEL — Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative z-10">

        {/* Mobile Logo */}
        <div className="lg:hidden flex flex-col items-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xl border"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: accent.hex,
              boxShadow: `0 0 25px ${accent.hex}35`,
            }}
          >
            <Monitor className="w-7 h-7" style={{ color: accent.hex }} />
          </div>
          <h1 className="text-2xl font-black text-white">ScreenShare Hub</h1>
        </div>

        {/* Auth Card */}
        <div
          className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderColor,
            boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px ${theme.borderColor}`,
          }}
        >
          {/* Tabs */}
          <div
            className="flex border-b"
            style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
          >
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError('');
                }}
                className={`flex-1 py-4 text-sm font-bold transition-all ${
                  tab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={{
                  borderBottom: tab === t ? `2px solid ${accent.hex}` : '2px solid transparent',
                }}
              >
                {t === 'login' ? '🔑 Entrar' : '✨ Criar Conta'}
              </button>
            ))}
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {tab === 'login' ? (
              /* ===== LOGIN FORM ===== */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Apelido
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                    />
                    <input
                      type="text"
                      placeholder="ex: lucas, joce, gabriel..."
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                      style={{
                        backgroundColor: theme.bgInput,
                        borderColor: theme.borderColor,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = accent.hex)}
                      onBlur={(e) => (e.target.style.borderColor = theme.borderColor)}
                    />
                  </div>
                  {cleanUsername && username !== cleanUsername && (
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Será usado como: <span style={{ color: accent.hex }} className="font-bold">@{cleanUsername}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha secreta..."
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                      className="w-full pl-10 pr-12 py-3.5 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                      style={{
                        backgroundColor: theme.bgInput,
                        borderColor: theme.borderColor,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = accent.hex)}
                      onBlur={(e) => (e.target.style.borderColor = theme.borderColor)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs text-zinc-400 cursor-pointer select-none">
                    Lembrar de mim neste dispositivo
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-black text-white transition transform active:scale-98 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: accent.hex }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    <>
                      Entrar no Hub
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-zinc-500">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('register'); setError(''); }}
                    className="font-bold hover:text-white transition"
                    style={{ color: accent.hex }}
                  >
                    Criar conta grátis
                  </button>
                </p>
              </form>
            ) : (
              /* ===== REGISTER FORM ===== */
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Escolha seu Avatar
                  </label>
                  <div
                    className="p-3 rounded-xl border grid grid-cols-8 gap-1.5"
                    style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
                  >
                    {AVATAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition transform hover:scale-110 active:scale-95 ${
                          selectedAvatar === emoji ? 'ring-2 scale-110' : 'hover:bg-white/10'
                        }`}
                        style={{
                          backgroundColor: selectedAvatar === emoji ? accent.hex + '30' : undefined,
                          outline: selectedAvatar === emoji ? `2px solid ${accent.hex}` : undefined,
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Avatar selecionado: <span className="text-base">{selectedAvatar}</span>
                    <span className="text-zinc-400 ml-1">(você pode alterar depois nas configurações)</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Apelido
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="ex: lucas, joce, gabriel..."
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      required
                      maxLength={20}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                      style={{
                        backgroundColor: theme.bgInput,
                        borderColor: theme.borderColor,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = accent.hex)}
                      onBlur={(e) => (e.target.style.borderColor = theme.borderColor)}
                    />
                  </div>
                  {cleanUsername && (
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Seu ID será: <span style={{ color: accent.hex }} className="font-bold">@{cleanUsername}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 4 caracteres..."
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                      className="w-full pl-10 pr-12 py-3.5 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                      style={{
                        backgroundColor: theme.bgInput,
                        borderColor: theme.borderColor,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = accent.hex)}
                      onBlur={(e) => (e.target.style.borderColor = theme.borderColor)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {password && (
                    <div className="mt-2 flex gap-1">
                      {[4, 8, 12].map((threshold, idx) => (
                        <div
                          key={threshold}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              password.length >= threshold
                                ? idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#10b981'
                                : theme.borderColor,
                          }}
                        />
                      ))}
                      <span className="text-[10px] text-zinc-500 ml-1">
                        {password.length < 4 ? 'Fraca' : password.length < 8 ? 'Boa' : password.length < 12 ? 'Forte' : 'Muito forte'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a senha..."
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      required
                      className={`w-full pl-10 pr-12 py-3.5 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition ${
                        confirmPassword && confirmPassword !== password ? 'border-red-700' : ''
                      }`}
                      style={{
                        backgroundColor: theme.bgInput,
                        borderColor:
                          confirmPassword && confirmPassword !== password
                            ? '#b91c1c'
                            : confirmPassword && confirmPassword === password
                            ? '#10b981'
                            : theme.borderColor,
                      }}
                      onFocus={(e) => {
                        if (!confirmPassword || confirmPassword === password) {
                          e.target.style.borderColor = accent.hex;
                        }
                      }}
                      onBlur={(e) => {
                        if (!confirmPassword || confirmPassword === password) {
                          e.target.style.borderColor = theme.borderColor;
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {confirmPassword && (
                      <span className={`absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold ${
                        confirmPassword === password ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {confirmPassword === password ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember-reg"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="remember-reg" className="text-xs text-zinc-400 cursor-pointer select-none">
                    Lembrar de mim neste dispositivo
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-black text-white transition transform active:scale-98 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: accent.hex }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Criando conta...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Criar Minha Conta
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-zinc-500">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); }}
                    className="font-bold hover:text-white transition"
                    style={{ color: accent.hex }}
                  >
                    Fazer login
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div
            className="px-6 sm:px-8 py-4 border-t text-center text-[11px] text-zinc-500"
            style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
          >
            🔒 Sua senha é armazenada com hash SHA-256 localmente. Nenhum servidor externo recebe seus dados.
          </div>
        </div>
      </div>
    </div>
  );
}
