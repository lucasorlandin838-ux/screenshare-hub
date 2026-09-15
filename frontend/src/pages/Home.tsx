import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Phone,
  Users,
  Copy,
  Check,
  LogOut,
  Plus,
  Share2,
  Trash2,
  Menu,
  X,
  AlertCircle,
  Hash,
  Radio,
  RefreshCw,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { usePeerCall } from '../hooks/usePeerCall';
import VideoCall from '../components/VideoCall';
import IncomingCallModal from '../components/IncomingCallModal';
import TextChannelChat from '../components/TextChannelChat';
import UserSettingsModal, { FONT_OPTIONS } from '../components/UserSettingsModal';
import { useTheme } from '../context/ThemeContext';
import { Friend, TextChannel, ChatAttachment } from '../types';

const TEXT_CHANNELS: TextChannel[] = [
  { id: 'geral', name: 'geral', desc: 'Canal principal para conversar com a galera' },
  { id: 'jogos', name: 'jogos', desc: 'Dicas, clipes e papo sobre games' },
  { id: 'bate-papo', name: 'bate-papo', desc: 'Conversas aleatórias do dia a dia' },
  { id: 'memes', name: 'memes', desc: 'Fotos, memes, imagens e arquivos' },
];

const VOICE_CHANNELS = [
  { id: 'principal', name: 'Sala Principal', desc: 'Voz & Tela geral' },
  { id: 'jogos-live', name: 'Jogos & Lives', desc: 'Compartilhe sua gameplay' },
  { id: 'cinema', name: 'Cinema', desc: 'Assista filmes ou vídeos juntos' },
];

export default function Home() {
  const { theme, accent } = useTheme();

  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('hub_username') || '';
  });

  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('hub_avatar') || '';
  });

  const [nameFont, setNameFont] = useState<string>(() => {
    return localStorage.getItem('hub_name_font') || 'default';
  });

  const [nameColor, setNameColor] = useState<string>(() => {
    return localStorage.getItem('hub_name_color') || '#ffffff';
  });

  const [nameInput, setNameInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('geral');

  const [friends, setFriends] = useState<Friend[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hub_friends') || '[]');
    } catch {
      return [];
    }
  });

  const [friendInput, setFriendInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [targetCallUser, setTargetCallUser] = useState('');
  const [isCallingNow, setIsCallingNow] = useState(false);
  const [showDirectCallModal, setShowDirectCallModal] = useState(false);

  const {
    actualPeerId,
    connectionStatus,
    callError,
    currentRoom,
    callState,
    remoteIsSharingScreen,
    localStream,
    remoteStream,
    messages,
    callUser,
    answerCall,
    rejectCall,
    endCall,
    joinRoom,
    toggleScreenShare,
    toggleMic,
    toggleCamera,
    sendMessage,
  } = usePeerCall(username, avatar, nameFont, nameColor);

  const saveProfile = (newName: string, newAvatar: string, newFont: string, newColor: string) => {
    if (newName) {
      localStorage.setItem('hub_username', newName);
      setUsername(newName);
    }
    localStorage.setItem('hub_avatar', newAvatar);
    setAvatar(newAvatar);

    localStorage.setItem('hub_name_font', newFont);
    setNameFont(newFont);

    localStorage.setItem('hub_name_color', newColor);
    setNameColor(newColor);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = friendInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean === username) return;
    if (friends.some((f) => f.username === clean)) return;

    const updated = [...friends, { username: clean }];
    setFriends(updated);
    localStorage.setItem('hub_friends', JSON.stringify(updated));
    setFriendInput('');
  };

  const handleRemoveFriend = (friendName: string) => {
    const updated = friends.filter((f) => f.username !== friendName);
    setFriends(updated);
    localStorage.setItem('hub_friends', JSON.stringify(updated));
  };

  const copyInvite = () => {
    const url = window.location.origin + '?call=' + (actualPeerId ? actualPeerId.replace('hub_', '') : username);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyMyId = () => {
    const idToCopy = actualPeerId ? actualPeerId.replace('hub_', '') : username;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callParam = params.get('call');
    const roomParam = params.get('room');

    if (callParam && callParam !== username) {
      setTargetCallUser(callParam.trim().toLowerCase());
    } else if (roomParam && username) {
      joinRoom(roomParam);
    }
  }, [username]);

  const handleStartCall = async (userToCall: string) => {
    if (!userToCall.trim()) return;
    setIsCallingNow(true);
    await callUser(userToCall.trim());
    setIsCallingNow(false);
    setShowDirectCallModal(false);
  };

  const activeChannel = TEXT_CHANNELS.find((c) => c.id === activeChannelId) || TEXT_CHANNELS[0];
  const currentFontObj = FONT_OPTIONS.find((f) => f.id === nameFont) || FONT_OPTIONS[0];

  if (!username) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{ backgroundColor: theme.bgMain }}
      >
        <div
          className="border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderColor,
            color: theme.textPrimary,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl border"
            style={{
              backgroundColor: theme.bgSidebar,
              borderColor: accent.hex,
            }}
          >
            <Monitor className="w-8 h-8" style={{ color: accent.hex }} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white text-center mb-2 tracking-tight">
            ScreenShare Hub
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm text-center mb-6">
            O Discord gratuito do navegador: Chat de texto com envio de arquivos, canais de voz e compartilhamento de tela.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile(nameInput, '', 'default', '#ffffff');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Escolha seu nome de usuário
              </label>
              <input
                type="text"
                placeholder="ex: lucas, dev_pro, gabriel..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                required
                className="w-full rounded-xl px-4 py-3.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none border transition"
                style={{
                  backgroundColor: theme.bgInput,
                  borderColor: theme.borderColor,
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full text-white font-bold py-3.5 rounded-xl transition shadow-lg text-sm active:scale-95"
              style={{ backgroundColor: accent.hex }}
            >
              Entrar no Servidor 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  const displayId = actualPeerId ? actualPeerId.replace('hub_', '') : username;

  return (
    <div
      className="flex flex-col md:flex-row h-screen overflow-hidden font-sans select-none"
      style={{ backgroundColor: theme.bgMain, color: theme.textPrimary }}
    >
      {/* Modal de Chamada Recebida */}
      {callState.incoming && (
        <IncomingCallModal
          fromUsername={callState.peerUsername}
          fromAvatar={callState.peerAvatar}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* Modal de Configurações */}
      <UserSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        username={username}
        avatar={avatar}
        nameFont={nameFont}
        nameColor={nameColor}
        onSaveProfile={saveProfile}
      />

      {/* HEADER SUPERIOR PARA CELULAR */}
      {!callState.active && (
        <header
          className="md:hidden h-14 border-b flex items-center justify-between px-4 z-20 flex-shrink-0"
          style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-zinc-300 hover:text-white transition hover:bg-white/10"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shadow"
              style={{ backgroundColor: accent.hex }}
            >
              <Hash className="w-4 h-4" />
            </div>
            <span className="font-black text-white text-sm">#{activeChannel.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDirectCallModal(true)}
              className="p-2 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition"
              title="Ligar para amigo"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* OVERLAY DE BACKDROP PARA O MENU DO CELULAR */}
      {mobileMenuOpen && !callState.active && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR ESTILO DISCORD */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col flex-shrink-0 select-none
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${callState.active ? 'hidden md:flex' : 'flex'}
        `}
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
        }}
      >
        {/* Topo da Sidebar: Nome do Servidor / Hub */}
        <div
          className="h-14 border-b px-4 flex items-center justify-between shadow-sm"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md font-black"
              style={{ backgroundColor: accent.hex }}
            >
              <Monitor className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="font-black text-white text-sm tracking-tight block">
                ScreenShare Hub
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Servidor Ativo
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Rolável da Sidebar */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {/* SEÇÃO 1: CANAIS DE TEXTO */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Canais de Texto
              </span>
            </div>

            <div className="space-y-0.5">
              {TEXT_CHANNELS.map((ch) => {
                const isActive = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannelId(ch.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition group ${
                      isActive
                        ? 'bg-white/10 text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium'
                    }`}
                  >
                    <Hash
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: isActive ? accent.hex : '#71717a' }}
                    />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 2: CANAIS DE VOZ & TELA */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Radio className="w-3 h-3" /> Voz & Transmissão
              </span>
            </div>

            <div className="space-y-1">
              {VOICE_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    joinRoom(ch.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                    currentRoom === ch.id
                      ? 'bg-white/10 text-white font-bold border border-white/20'
                      : 'hover:bg-white/5 text-zinc-300'
                  }`}
                  style={{ backgroundColor: currentRoom === ch.id ? undefined : theme.bgCard }}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Radio className="w-3.5 h-3.5 text-zinc-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">{ch.name}</div>
                      <div className="text-[10px] text-zinc-400">{ch.desc}</div>
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded text-white font-bold"
                    style={{ backgroundColor: accent.hex }}
                  >
                    Entrar
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SEÇÃO 3: AMIGOS & LIGAÇÃO DIRETA */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Amigos ({friends.length})
              </span>
              <button
                onClick={() => setShowDirectCallModal(true)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Ligar
              </button>
            </div>

            <form onSubmit={handleAddFriend} className="mb-2 px-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nome do amigo..."
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none border"
                  style={{
                    backgroundColor: theme.bgInput,
                    borderColor: theme.borderColor,
                  }}
                />
                <button
                  type="submit"
                  className="text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center shadow"
                  style={{ backgroundColor: accent.hex }}
                  title="Salvar amigo"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {friends.length === 0 ? (
              <p className="text-xs text-zinc-500 px-2 italic">
                Nenhum amigo salvo. Adicione acima para ligar fácil!
              </p>
            ) : (
              <div className="space-y-1">
                {friends.map((f) => (
                  <div
                    key={f.username}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition group"
                    style={{
                      backgroundColor: theme.bgCard,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase overflow-hidden"
                        style={{ backgroundColor: theme.bgInput }}
                      >
                        {f.avatar ? (
                          <img src={f.avatar} alt={f.username} className="w-full h-full object-cover" />
                        ) : (
                          <span>{f.username[0]}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {f.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleStartCall(f.username);
                        }}
                        className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 shadow"
                        title={'Ligar para ' + f.username}
                      >
                        <Phone className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(f.username)}
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 transition"
                        title="Remover"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Convidar Amigos com Link */}
          <div
            className="p-3 rounded-xl border"
            style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
          >
            <div className="flex items-center gap-2 text-white text-xs font-bold mb-1">
              <Share2 className="w-3.5 h-3.5" style={{ color: accent.hex }} /> Link de Convite
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">
              Envie para seus amigos entrarem direto na sua sala:
            </p>
            <button
              onClick={copyInvite}
              className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-1.5 active:scale-95 shadow"
              style={{ backgroundColor: accent.hex }}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* BARRA DE USUÁRIO DO RODAPÉ (COM FONTE E COR PERSONALIZADA) */}
        <div
          className="h-16 border-t px-3 flex items-center justify-between"
          style={{
            backgroundColor: theme.bgHeader,
            borderColor: theme.borderColor,
          }}
        >
          <div
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2.5 overflow-hidden p-1 rounded-lg hover:bg-white/5 cursor-pointer flex-1 transition mr-1"
            title="Clique para abrir configurações de perfil, cores e fontes"
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center font-bold text-xs shadow"
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: nameColor,
                }}
              >
                {avatar ? (
                  <img src={avatar} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white uppercase">{username[0]}</span>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
            </div>

            <div className="overflow-hidden">
              <div
                className={`text-xs font-black truncate ${currentFontObj.className}`}
                style={{ color: nameColor }}
              >
                {username}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">
                ID: {displayId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title="Configurações (Foto, Cores & Fontes)"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('hub_username');
                setUsername('');
              }}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/10 transition"
              title="Trocar de Conta / Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      {callState.active ? (
        <VideoCall
          localStream={localStream}
          remoteStream={remoteStream}
          peerUsername={callState.peerUsername}
          peerAvatar={callState.peerAvatar}
          userAvatar={avatar}
          isScreenSharing={callState.isScreenSharing}
          remoteIsSharingScreen={remoteIsSharingScreen}
          micMuted={callState.micMuted}
          camMuted={callState.camMuted}
          messages={messages}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreen={toggleScreenShare}
          onEndCall={endCall}
          onSendMessage={(content) => sendMessage(content, activeChannel.id)}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {callError && (
            <div className="m-3 bg-red-950/90 border border-red-800 rounded-xl p-3 text-red-200 text-xs flex items-center justify-between animate-shake">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{callError}</span>
              </div>
              <button
                onClick={() => handleStartCall(targetCallUser)}
                className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[11px] font-bold transition"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* CHAT DE TEXTO COM SUPORTE A ARQUIVOS, FONTES E CORES */}
          <TextChannelChat
            channel={activeChannel}
            messages={messages}
            username={username}
            userAvatar={avatar}
            userNameFont={nameFont}
            userNameColor={nameColor}
            onSendMessage={sendMessage}
            onStartVoiceCall={() => joinRoom(activeChannel.id)}
          />
        </div>
      )}

      {/* MODAL PARA LIGAR DIRETO PARA UM AMIGO */}
      {showDirectCallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 max-w-sm w-full border shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.borderColor,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                Ligar Direto com Tela & Vídeo
              </h3>
              <button
                onClick={() => setShowDirectCallModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (targetCallUser.trim()) {
                  handleStartCall(targetCallUser.trim());
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Nome ou ID do Amigo
                </label>
                <input
                  type="text"
                  placeholder="ex: gabriel, lucas..."
                  value={targetCallUser}
                  onChange={(e) => setTargetCallUser(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none border"
                  style={{
                    backgroundColor: theme.bgInput,
                    borderColor: theme.borderColor,
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectCallModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!targetCallUser.trim() || isCallingNow}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow"
                  style={{ backgroundColor: accent.hex }}
                >
                  {isCallingNow ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ligando...
                    </>
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5" /> Ligar Agora
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
