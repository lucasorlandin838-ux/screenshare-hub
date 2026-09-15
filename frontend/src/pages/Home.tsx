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
  PhoneCall,
} from 'lucide-react';
import { usePeerCall } from '../hooks/usePeerCall';
import VideoCall from '../components/VideoCall';
import IncomingCallModal from '../components/IncomingCallModal';

interface FriendItem {
  username: string;
}

const DEFAULT_CHANNELS = [
  { id: 'principal', name: 'Canal Principal', desc: 'Voz & Tela geral' },
  { id: 'jogos', name: 'Jogos & Lives', desc: 'Compartilhe sua gameplay' },
  { id: 'cinema', name: 'Cinema com Amigos', desc: 'Assista vídeos juntos' },
];

export default function Home() {
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('hub_username') || '';
  });

  const [nameInput, setNameInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>(() => {
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
  } = usePeerCall(username);

  const saveUsername = (name: string) => {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;
    localStorage.setItem('hub_username', clean);
    setUsername(clean);
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

  // Se veio de um link com ?call=usuario ou ?room=sala
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
  };

  // Tela de entrada com Tema Preto e Cinza Escuro
  if (!username) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-5 shadow-xl">
            <Monitor className="w-8 h-8 text-zinc-200" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white text-center mb-2 tracking-tight">
            ScreenShare Hub
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm text-center mb-6">
            Compartilhe sua tela em alta resolução e faça chamadas de vídeo gratuitas direto pelo navegador.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveUsername(nameInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Escolha seu nome de usuário
              </label>
              <input
                type="text"
                placeholder="ex: lucas, gabriel..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                required
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold py-3.5 rounded-xl transition border border-zinc-600 shadow-lg text-sm"
            >
              Entrar no Hub 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ID limpo sem o prefixo hub_
  const displayId = actualPeerId ? actualPeerId.replace('hub_', '') : username;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black overflow-hidden font-sans">
      {/* Modal de chamada recebida */}
      {callState.incoming && (
        <IncomingCallModal
          fromUsername={callState.peerUsername}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* HEADER SUPERIOR PARA CELULAR */}
      {!callState.active && (
        <header className="md:hidden h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-20 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <Monitor className="w-4 h-4 text-zinc-200" />
            </div>
            <span className="font-extrabold text-white text-sm">ScreenShare Hub</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-semibold text-zinc-200 truncate max-w-[80px]">
              {displayId}
            </span>
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

      {/* SIDEBAR ESTILO DISCORD (Desktop: lateral | Mobile: slide-over drawer) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col flex-shrink-0 select-none
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${callState.active ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Header da Sidebar */}
        <div className="h-16 border-b border-zinc-800/80 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shadow-md">
              <Monitor className="w-5 h-5 text-zinc-200" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">ScreenShare Hub</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge com Status do Servidor e ID de Chamada */}
        <div className="p-3 mx-3 my-3 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-xs uppercase">
                {username[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{username}</div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-500'
                        : connectionStatus === 'connecting'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={
                      connectionStatus === 'connected'
                        ? 'text-emerald-400'
                        : connectionStatus === 'connecting'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }
                  >
                    {connectionStatus === 'connected'
                      ? 'Conectado ao servidor'
                      : connectionStatus === 'connecting'
                      ? 'Conectando...'
                      : 'Erro de rede'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('hub_username');
                setUsername('');
              }}
              className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition"
              title="Trocar usuário"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* ID Real para Chamada */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-1.5 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">
              Seu ID: <span className="text-white font-mono font-bold">{displayId}</span>
            </span>
            <button
              onClick={copyMyId}
              className="text-zinc-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
              title="Copiar ID para mandar a um amigo"
            >
              {copiedId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo da Barra Lateral: Canais e Amigos */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* CANAIS DE VOZ E TELA (Estilo Discord) */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-zinc-400" /> Salas de Voz & Tela
              </span>
            </div>

            <div className="space-y-1">
              {DEFAULT_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    joinRoom(ch.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition group ${
                    currentRoom === ch.id
                      ? 'bg-zinc-800 text-white border border-zinc-700 font-bold'
                      : 'bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Hash className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                    <div>
                      <div className="text-xs font-medium text-zinc-200">{ch.name}</div>
                      <div className="text-[10px] text-zinc-500">{ch.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 group-hover:text-white">
                    Entrar
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AMIGOS */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" /> Amigos ({friends.length})
              </span>
            </div>

            <form onSubmit={handleAddFriend} className="mb-3 px-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="ID ou nome do amigo..."
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="submit"
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center"
                  title="Salvar amigo"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {friends.length === 0 ? (
              <p className="text-xs text-zinc-500 px-2 italic">
                Nenhum amigo salvo ainda. Adicione acima para ligar fácil!
              </p>
            ) : (
              <div className="space-y-1">
                {friends.map((f) => (
                  <div
                    key={f.username}
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 transition group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 uppercase font-bold">
                        {f.username[0]}
                      </div>
                      <span className="text-xs font-medium text-zinc-200 truncate">
                        {f.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleStartCall(f.username);
                        }}
                        className="p-1.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-600 hover:text-white transition active:scale-95"
                        title={'Ligar para ' + f.username}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(f.username)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 transition"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link Direto de Convite */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold mb-1">
              <Share2 className="w-3.5 h-3.5 text-zinc-400" /> Link Direto para Ligar
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">
              Mande para seu amigo entrar direto na chamada com você:
            </p>
            <button
              onClick={copyInvite}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white py-2 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Link de Ligação
                </>
              )}
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
          isScreenSharing={callState.isScreenSharing}
          remoteIsSharingScreen={remoteIsSharingScreen}
          micMuted={callState.micMuted}
          camMuted={callState.camMuted}
          messages={messages}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreen={toggleScreenShare}
          onEndCall={endCall}
          onSendMessage={sendMessage}
        />
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-black text-center overflow-y-auto">
          {/* Mensagem de erro caso a chamada falhe */}
          {callError && (
            <div className="mb-6 max-w-md w-full bg-red-950/80 border border-red-800 rounded-2xl p-4 text-red-200 text-xs flex items-start gap-3 text-left animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">Aviso da chamada:</p>
                <p>{callError}</p>
              </div>
            </div>
          )}

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 sm:mb-6 shadow-xl">
            <Monitor className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Pronto para Conectar
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-6 sm:mb-8 px-2">
            Compartilhe tela em tempo real ou entre em uma sala com seus amigos. Rápido, sem cadastro e sem limite de tempo.
          </p>

          {/* Cartão de Ligação Direta */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-left mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-300" /> Ligar para um amigo agora
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (targetCallUser.trim()) {
                  handleStartCall(targetCallUser.trim());
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Digite o ID ou nome do amigo..."
                value={targetCallUser}
                onChange={(e) => setTargetCallUser(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
              <button
                type="submit"
                disabled={!targetCallUser.trim() || isCallingNow}
                className="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm border border-zinc-600 shadow-lg"
              >
                {isCallingNow ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Chamando amigo...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" /> Iniciar Chamada com Tela
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Atalho para Entrar na Sala Principal */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 max-w-sm w-full text-left flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-zinc-400" /> Sala de Voz & Tela Principal
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Vocês dois entram juntos sem precisar discar
              </div>
            </div>
            <button
              onClick={() => joinRoom('principal')}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95"
            >
              Entrar
            </button>
          </div>

          <div className="md:hidden mt-6 flex gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
            >
              <Users className="w-4 h-4 text-zinc-400" /> Ver Amigos ({friends.length})
            </button>
            <button
              onClick={copyInvite}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
            >
              <Share2 className="w-4 h-4 text-zinc-400" /> Convidar
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
