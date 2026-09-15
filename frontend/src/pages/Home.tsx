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
} from 'lucide-react';
import { usePeerCall } from '../hooks/usePeerCall';
import VideoCall from '../components/VideoCall';
import IncomingCallModal from '../components/IncomingCallModal';

interface FriendItem {
  username: string;
}

export default function Home() {
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('hub_username') || '';
  });

  const [nameInput, setNameInput] = useState('');
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hub_friends') || '[]');
    } catch {
      return [];
    }
  });

  const [friendInput, setFriendInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [targetCallUser, setTargetCallUser] = useState('');

  const {
    callState,
    localStream,
    remoteStream,
    messages,
    callUser,
    answerCall,
    rejectCall,
    endCall,
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
    const url = window.location.origin + '?call=' + username;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callParam = params.get('call');
    if (callParam && callParam !== username) {
      setTargetCallUser(callParam);
    }
  }, [username]);

  if (!username) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-8 h-8 text-indigo-400" />
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-2">ScreenShare Hub</h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            Compartilhe sua tela, faça chamadas de vídeo e converse com amigos gratuitamente.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveUsername(nameInput);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Escolha seu nome de usuário
              </label>
              <input
                type="text"
                placeholder="ex: lucas, gabriel, etc."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              Entrar no Hub 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans">
      {callState.incoming && (
        <IncomingCallModal
          fromUsername={callState.peerUsername}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* SIDEBAR ESTILO DISCORD */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 select-none">
        <div className="h-16 border-b border-gray-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Monitor className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">ScreenShare Hub</span>
          </div>
        </div>

        {/* User Badge */}
        <div className="p-3 mx-3 my-3 bg-gray-800/80 border border-gray-700/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-600/40 border border-indigo-500 flex items-center justify-center font-bold text-indigo-300 text-sm uppercase">
              {username[0]}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{username}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Online
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('hub_username');
              setUsername('');
            }}
            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700 transition"
            title="Sair / Trocar usuário"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Amigos List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Amigos ({friends.length})
              </span>
            </div>

            <form onSubmit={handleAddFriend} className="mb-3 px-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nome do amigo..."
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                  title="Adicionar amigo"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {friends.length === 0 ? (
              <p className="text-xs text-gray-500 px-2 italic">
                Nenhum amigo adicionado ainda. Digite o nome acima!
              </p>
            ) : (
              <div className="space-y-1">
                {friends.map((f) => (
                  <div
                    key={f.username}
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-gray-800/40 hover:bg-gray-800 transition group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-300 uppercase font-bold">
                        {f.username[0]}
                      </div>
                      <span className="text-xs font-medium text-gray-200 truncate">
                        {f.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => callUser(f.username)}
                        className="p-1.5 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                        title={'Ligar para ' + f.username}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(f.username)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        title="Remover amigo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compartilhar link */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/30 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-1">
              <Share2 className="w-3.5 h-3.5" /> Convidar amigo direto
            </div>
            <p className="text-[11px] text-gray-400 mb-2">
              Envie este link para seu amigo entrar e ligar para você:
            </p>
            <button
              onClick={copyInvite}
              className="w-full bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 hover:border-indigo-500 text-indigo-200 hover:text-white py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Link de Convite
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      {callState.active ? (
        <VideoCall
          localStream={localStream}
          remoteStream={remoteStream}
          peerUsername={callState.peerUsername}
          isScreenSharing={callState.isScreenSharing}
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950 text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-xl">
            <Monitor className="w-10 h-10 text-indigo-400" />
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Pronto para Conectar</h2>
          <p className="text-gray-400 text-sm max-w-md mb-8">
            Faça chamadas de vídeo em alta qualidade e compartilhe sua tela com seus amigos sem precisar de cadastro ou servidor pago.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-left">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Ligar para um amigo agora
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (targetCallUser.trim()) {
                  callUser(targetCallUser.trim());
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Nome do usuário amigo..."
                value={targetCallUser}
                onChange={(e) => setTargetCallUser(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!targetCallUser.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/20"
              >
                <Phone className="w-4 h-4" /> Iniciar Chamada com Tela
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
