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
import DirectMessageChat from '../components/DirectMessageChat';
import VoiceRoomPanel from '../components/VoiceRoomPanel';
import UserSettingsModal, { FONT_OPTIONS } from '../components/UserSettingsModal';
import { useTheme } from '../context/ThemeContext';
import { Friend, TextChannel, VoiceChannel, ActiveView, CustomGroup } from '../types';
import GroupChatView from '../components/GroupChatView';
import CreateGroupModal from '../components/CreateGroupModal';

const TEXT_CHANNELS: TextChannel[] = [
  { id: 'geral', name: 'geral', desc: 'Canal principal para conversar com a galera' },
  { id: 'jogos', name: 'jogos', desc: 'Dicas, clipes e papo sobre games' },
  { id: 'bate-papo', name: 'bate-papo', desc: 'Conversas aleatórias do dia a dia' },
  { id: 'memes', name: 'memes', desc: 'Fotos, memes, imagens e arquivos' },
];

const VOICE_CHANNELS: VoiceChannel[] = [
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

  const [activeView, setActiveView] = useState<ActiveView>({
    type: 'channel',
    id: 'geral',
  });

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
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hub_custom_groups') || '[]');
    } catch {
      return [];
    }
  });
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const {
    actualPeerId,
    connectionStatus,
    callError,
    currentRoom,
    callState,
    friendsOnline,
    remoteIsSharingScreen,
    localStream,
    remoteStream,
    messages,
    callUser,
    answerCall,
    rejectCall,
    endCall,
    joinRoom,
    leaveRoom,
    checkFriendOnline,
    toggleScreenShare,
    toggleMic,
    toggleCamera,
    sendMessage,
    sendDirectMessage,
    lastPlayedSound,
    incomingGroupCall,
    playSoundboard,
    sendGroupMessage,
    startGroupCall,
  } = usePeerCall(username, avatar, nameFont, nameColor);

  // Verifica status de cada amigo salvo a cada 30 segundos
  useEffect(() => {
    if (!username || friends.length === 0) return;
    friends.forEach((f) => {
      checkFriendOnline(f.username);
    });

    const interval = setInterval(() => {
      friends.forEach((f) => {
        checkFriendOnline(f.username);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [username, friends, checkFriendOnline]);

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
    if (friends.some((f) => f.username === clean)) {
      setActiveView({ type: 'dm', friendUsername: clean });
      setFriendInput('');
      setMobileMenuOpen(false);
      checkFriendOnline(clean);
      return;
    }

    const updated = [...friends, { username: clean }];
    setFriends(updated);
    localStorage.setItem('hub_friends', JSON.stringify(updated));
    setFriendInput('');
    setActiveView({ type: 'dm', friendUsername: clean });
    setMobileMenuOpen(false);
    checkFriendOnline(clean);
  };

  const handleRemoveFriend = (friendName: string) => {
    const updated = friends.filter((f) => f.username !== friendName);
    setFriends(updated);
    localStorage.setItem('hub_friends', JSON.stringify(updated));
    if (activeView.type === 'dm' && activeView.friendUsername === friendName) {
      setActiveView({ type: 'channel', id: 'geral' });
    }
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
    const dmParam = params.get('dm');

    if (callParam && callParam !== username) {
      setTargetCallUser(callParam.trim().toLowerCase());
    } else if (roomParam) {
      joinRoom(roomParam);
      setActiveView({ type: 'voice', roomId: roomParam });
    } else if (dmParam && dmParam !== username) {
      const cleanDM = dmParam.trim().toLowerCase();
      setActiveView({ type: 'dm', friendUsername: cleanDM });
      checkFriendOnline(cleanDM);
    }
  }, [username, joinRoom, checkFriendOnline]);

  const handleStartCall = async (userToCall: string) => {
    if (!userToCall.trim()) return;
    setIsCallingNow(true);
    await callUser(userToCall.trim());
    setIsCallingNow(false);
    setShowDirectCallModal(false);
  };

  const handleCreateGroup = (newGroup: CustomGroup) => {
    const updated = [...customGroups, newGroup];
    setCustomGroups(updated);
    try {
      localStorage.setItem('hub_custom_groups', JSON.stringify(updated));
    } catch {}
    setActiveView({ type: 'group', groupId: newGroup.id });
  };

  const handleAddMemberToGroup = (groupId: string, memberUsername: string) => {
    const updated = customGroups.map((g) =>
      g.id === groupId
        ? { ...g, members: Array.from(new Set([...g.members, memberUsername.toLowerCase()])) }
        : g
    );
    setCustomGroups(updated);
    try {
      localStorage.setItem('hub_custom_groups', JSON.stringify(updated));
    } catch {}
  };

  const handleRemoveMemberFromGroup = (groupId: string, memberUsername: string) => {
    const updated = customGroups.map((g) =>
      g.id === groupId
        ? { ...g, members: g.members.filter((m) => m.toLowerCase() !== memberUsername.toLowerCase()) }
        : g
    );
    setCustomGroups(updated);
    try {
      localStorage.setItem('hub_custom_groups', JSON.stringify(updated));
    } catch {}
  };

  const handleLeaveGroup = (groupId: string) => {
    const updated = customGroups.filter((g) => g.id !== groupId);
    setCustomGroups(updated);
    try {
      localStorage.setItem('hub_custom_groups', JSON.stringify(updated));
    } catch {}
    setActiveView({ type: 'channel', id: 'geral' });
  };

  const handleStartGroupCall = (group: CustomGroup) => {
    setIsCallingNow(true);
    startGroupCall(group);
    setTimeout(() => setIsCallingNow(false), 2000);
  };

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
            O Discord gratuito do navegador: Chat de texto, canais de voz, chat privado e transmissão de tela.
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
                placeholder="ex: lucas, joce, gabriel..."
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

  const activeChannel =
    activeView.type === 'channel'
      ? TEXT_CHANNELS.find((c) => c.id === activeView.id) || TEXT_CHANNELS[0]
      : TEXT_CHANNELS[0];

  const activeVoiceRoom =
    activeView.type === 'voice'
      ? VOICE_CHANNELS.find((v) => v.id === activeView.roomId) || VOICE_CHANNELS[0]
      : VOICE_CHANNELS[0];

  const activeGroup = customGroups.find(
    (g) => activeView.type === 'group' && g.id === activeView.groupId
  );
  const activeDMFriend =
    activeView.type === 'dm'
      ? friends.find((f) => f.username.toLowerCase() === activeView.friendUsername.toLowerCase())
      : undefined;

  const isCurrentDMFriendOnline =
    activeView.type === 'dm'
      ? !!friendsOnline[activeView.friendUsername.toLowerCase()]
      : false;

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

          <div className="flex items-center gap-2 overflow-hidden">
            {activeView.type === 'dm' ? (
              <>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                  style={{ backgroundColor: accent.hex }}
                >
                  {activeView.friendUsername[0]?.toUpperCase()}
                </div>
                <span className="font-black text-white text-sm truncate">
                  @{activeView.friendUsername}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCurrentDMFriendOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                />
              </>
            ) : activeView.type === 'voice' ? (
              <>
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-black text-white text-sm truncate">
                  {activeVoiceRoom.name}
                </span>
              </>
            ) : (
              <>
                <Hash className="w-4 h-4" style={{ color: accent.hex }} />
                <span className="font-black text-white text-sm truncate">
                  #{activeChannel.name}
                </span>
              </>
            )}
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
        {/* Topo da Sidebar: Nome do Servidor */}
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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
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
          {/* SEÇÃO 1: MENSAGENS DIRETAS (DMs / CHAT PRIVADO) */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Chat Privado / Amigos
              </span>
              <button
                onClick={() => setShowDirectCallModal(true)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Ligar
              </button>
            </div>

            {/* Input Rápido para Iniciar Conversa Privada */}
            <form onSubmit={handleAddFriend} className="mb-2 px-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nome do amigo (ex: joce)..."
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
                  title="Abrir chat privado"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Lista de Amigos com Indicador de Online Real (Verde se online, Cinza se offline) */}
            {friends.length === 0 ? (
              <p className="text-xs text-zinc-500 px-2 italic">
                Nenhum amigo ainda. Digite o nome acima (ex: joce) para abrir o chat privado!
              </p>
            ) : (
              <div className="space-y-1">
                {friends.map((f) => {
                  const isCurrentDM =
                    activeView.type === 'dm' &&
                    activeView.friendUsername.toLowerCase() === f.username.toLowerCase();

                  const isFriendOnline = !!friendsOnline[f.username.toLowerCase()];

                  return (
                    <div
                      key={f.username}
                      onClick={() => {
                        setActiveView({ type: 'dm', friendUsername: f.username });
                        setMobileMenuOpen(false);
                        checkFriendOnline(f.username);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition cursor-pointer group ${
                        isCurrentDM
                          ? 'bg-white/10 border-white/30 shadow-sm'
                          : 'hover:bg-white/5 border-transparent'
                      }`}
                      style={{
                        backgroundColor: isCurrentDM ? undefined : theme.bgCard,
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase overflow-hidden border"
                            style={{
                              backgroundColor: theme.bgInput,
                              borderColor: f.nameColor || accent.hex,
                            }}
                          >
                            {f.avatar ? (
                              <img src={f.avatar} alt={f.username} className="w-full h-full object-cover" />
                            ) : (
                              <span>{f.username[0]}</span>
                            )}
                          </div>

                          {/* Indicador REAL: Verde se estiver comprovadamente online, Cinza se estiver offline */}
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${
                              isFriendOnline
                                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                                : 'bg-zinc-600'
                            }`}
                          />
                        </div>

                        <div className="overflow-hidden">
                          <span
                            className={`text-xs font-bold truncate block ${isCurrentDM ? 'text-white' : 'text-zinc-200'}`}
                            style={{ color: isCurrentDM ? '#ffffff' : (f.nameColor || undefined) }}
                          >
                            @{f.username}
                          </span>
                          <span className="text-[9px] block">
                            {isFriendOnline ? (
                              <span className="text-emerald-400 font-semibold">● Online</span>
                            ) : (
                              <span className="text-zinc-500">○ Offline</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                            handleStartCall(f.username);
                          }}
                          className={`p-1 rounded-md text-white transition active:scale-95 shadow ${
                            isFriendOnline ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-700 hover:bg-zinc-600'
                          }`}
                          title={'Ligar direto para ' + f.username}
                        >
                          <Phone className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFriend(f.username);
                          }}
                          className="p-1 rounded-md text-zinc-500 hover:text-red-400 transition"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          
          {/* SEÇÃO NOVA: GRUPOS (ESTILO DISCORD) */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Meus Grupos
              </span>
              <button
                onClick={() => setCreateGroupOpen(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                title="Criar novo grupo estilo Discord"
              >
                <Plus className="w-3 h-3" /> Criar Grupo
              </button>
            </div>

            {customGroups.length === 0 ? (
              <div
                onClick={() => setCreateGroupOpen(true)}
                className="p-2 rounded-xl border border-dashed text-center text-xs cursor-pointer hover:bg-white/5 transition"
                style={{ borderColor: theme.borderColor }}
              >
                <p className="text-zinc-400 font-medium">Nenhum grupo ainda.</p>
                <p className="text-[10px] text-indigo-400 font-bold mt-0.5">+ Criar Grupo do Discord</p>
              </div>
            ) : (
              <div className="space-y-1">
                {customGroups.map((g) => {
                  const isCurrentGroup =
                    activeView.type === 'group' && activeView.groupId === g.id;
                  const isGroupCallLive =
                    callState.active && callState.groupId === g.id;

                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        setActiveView({ type: 'group', groupId: g.id });
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition cursor-pointer group ${
                        isCurrentGroup
                          ? 'bg-white/10 border-white/30 shadow-sm'
                          : 'hover:bg-white/5 border-transparent'
                      }`}
                      style={{
                        backgroundColor: isCurrentGroup ? undefined : theme.bgCard,
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <span className="text-lg select-none">{g.icon || '👥'}</span>
                        <div className="overflow-hidden">
                          <span className={`text-xs font-bold truncate block ${isCurrentGroup ? 'text-white' : 'text-zinc-200'}`}>
                            {g.name}
                          </span>
                          <span className="text-[9px] text-zinc-400 block">
                            {g.members.length} membros
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isGroupCallLive && (
                          <span className="relative flex h-2.5 w-2.5 mr-1" title="Chamada em andamento">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(false);
                            handleStartGroupCall(g);
                          }}
                          className="p-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95 shadow"
                          title={'Ligar para o grupo ' + g.name}
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: CANAIS DE TEXTO PÚBLICOS */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Canais do Servidor
              </span>
            </div>

            <div className="space-y-0.5">
              {TEXT_CHANNELS.map((ch) => {
                const isActive = activeView.type === 'channel' && activeView.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveView({ type: 'channel', id: ch.id });
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

          {/* SEÇÃO 3: SALAS DE VOZ & TELA */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Radio className="w-3 h-3" /> Salas de Transmissão
              </span>
            </div>

            <div className="space-y-1">
              {VOICE_CHANNELS.map((ch) => {
                const isRoomActive =
                  activeView.type === 'voice' && activeView.roomId === ch.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      joinRoom(ch.id);
                      setActiveView({ type: 'voice', roomId: ch.id });
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                      isRoomActive
                        ? 'bg-white/10 text-white font-bold border border-white/20'
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                    style={{ backgroundColor: isRoomActive ? undefined : theme.bgCard }}
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
                      {isRoomActive ? 'Aberta' : 'Entrar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link Direto de Convite Geral */}
          <div
            className="p-3 rounded-xl border"
            style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
          >
            <div className="flex items-center gap-2 text-white text-xs font-bold mb-1">
              <Share2 className="w-3.5 h-3.5" style={{ color: accent.hex }} /> Link de Convite
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">
              Envie para amigos entrarem direto com você:
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

        {/* BARRA DE USUÁRIO DO RODAPÉ (ESTILO DISCORD) */}
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
            title="Abrir configurações de perfil, cores e fontes"
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
          lastPlayedSound={lastPlayedSound}
          onTriggerSound={playSoundboard}
          groupName={callState.groupName}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreen={toggleScreenShare}
          onEndCall={endCall}
          onSendMessage={(content) => {
            if (activeView.type === 'group' && activeGroup) {
              sendGroupMessage(activeGroup.id, content, activeGroup.members);
            } else if (activeView.type === 'dm') {
              sendDirectMessage(activeView.friendUsername, content);
            } else {
              sendMessage(content, activeChannel.id);
            }
          }}
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

          {activeView.type === 'dm' ? (
            <DirectMessageChat
              friendUsername={activeView.friendUsername}
              friend={activeDMFriend}
              isOnline={isCurrentDMFriendOnline}
              messages={messages}
              username={username}
              userAvatar={avatar}
              userNameFont={nameFont}
              userNameColor={nameColor}
              onSendDM={sendDirectMessage}
              onCallFriend={handleStartCall}
              onCheckOnline={checkFriendOnline}
            />
          ) : activeView.type === 'voice' ? (
            <VoiceRoomPanel
              room={activeVoiceRoom}
              username={username}
              userAvatar={avatar}
              friends={friends}
              onStartRoomCall={handleStartCall}
              onLeaveRoom={() => {
                leaveRoom();
                setActiveView({ type: 'channel', id: 'geral' });
              }}
            />
          ) : (
            <TextChannelChat
              channel={activeChannel}
              messages={messages}
              username={username}
              userAvatar={avatar}
              userNameFont={nameFont}
              userNameColor={nameColor}
              onSendMessage={sendMessage}
              onStartVoiceCall={() => {
                joinRoom(activeChannel.id);
                setActiveView({ type: 'voice', roomId: activeChannel.id });
              }}
            />
          )}
        </div>
      )}

      {/* MODAL PARA CRIAR GRUPO */}
      {createGroupOpen && (
        <CreateGroupModal
          isOpen={createGroupOpen}
          onClose={() => setCreateGroupOpen(false)}
          friends={friends}
          currentUsername={username}
          onCreateGroup={handleCreateGroup}
        />
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
                Ligar com Tela & Vídeo
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
                  placeholder="ex: joce, gabriel..."
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
