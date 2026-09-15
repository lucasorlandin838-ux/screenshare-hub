import React, { useState } from 'react';
import {
  Radio,
  Phone,
  PhoneCall,
  Monitor,
  Users,
  Copy,
  Check,
  Plus,
  Share2,
  Mic,
  Video,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Friend, VoiceChannel } from '../types';

interface VoiceRoomPanelProps {
  room: VoiceChannel;
  username: string;
  userAvatar: string;
  friends: Friend[];
  onStartRoomCall: (targetUsername: string) => void;
  onLeaveRoom: () => void;
}

export default function VoiceRoomPanel({
  room,
  username,
  userAvatar,
  friends,
  onStartRoomCall,
  onLeaveRoom,
}: VoiceRoomPanelProps) {
  const { theme, accent } = useTheme();
  const [copiedLink, setCopiedLink] = useState(false);
  const [directFriendInput, setDirectFriendInput] = useState('');

  const copyRoomInvite = () => {
    const url = window.location.origin + '?room=' + room.id + '&caller=' + username;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePullFriend = (target: string) => {
    if (!target.trim()) return;
    onStartRoomCall(target.trim());
    setDirectFriendInput('');
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-8"
      style={{ backgroundColor: theme.bgMain, color: theme.textPrimary }}
    >
      {/* Topo da Sala */}
      <div
        className="max-w-2xl mx-auto w-full p-6 sm:p-8 rounded-3xl border shadow-2xl mb-6"
        style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b pb-6" style={{ borderColor: theme.borderColor }}>
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0"
              style={{ backgroundColor: accent.hex }}
            >
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {room.name}
                </h1>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              </div>
              <p className="text-xs text-zinc-400 mt-1">{room.desc}</p>
              <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <span>● Você está conectado nesta sala</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLeaveRoom}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white border border-zinc-700 hover:border-red-500 hover:bg-red-950/40 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair da Sala
          </button>
        </div>

        {/* Informações da Sala */}
        <div className="py-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: accent.hex }} />
            Conectar com Amigos nesta Sala
          </h3>

          <p className="text-xs text-zinc-300 leading-relaxed mb-4">
            Nesta sala você pode falar por voz, ligar a câmera ou compartilhar a tela do seu jogo/vídeo. Clique em um amigo abaixo para puxá-lo direto para a transmissão:
          </p>

          {/* Lista de Amigos para Chamar com 1 Clique */}
          {friends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
              {friends.map((f) => (
                <div
                  key={f.username}
                  className="p-3 rounded-2xl border flex items-center justify-between transition group hover:border-white/30"
                  style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs uppercase"
                      style={{ backgroundColor: theme.bgCard }}
                    >
                      {f.avatar ? (
                        <img src={f.avatar} alt={f.username} className="w-full h-full object-cover" />
                      ) : (
                        <span>{f.username[0]}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white truncate">
                      {f.username}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePullFriend(f.username)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow transition flex items-center gap-1.5 active:scale-95"
                    style={{ backgroundColor: accent.hex }}
                    title={`Chamar ${f.username} para transmitir tela`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Chamar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border mb-4 text-center text-xs text-zinc-400" style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}>
              Nenhum amigo na lista. Digite o nome de alguém abaixo ou copie o link da sala!
            </div>
          )}

          {/* Chamar Qualquer Usuário por Nome */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePullFriend(directFriendInput);
            }}
            className="flex gap-2 mb-6"
          >
            <input
              type="text"
              placeholder="Digite o nome de outro amigo (ex: joce)..."
              value={directFriendInput}
              onChange={(e) => setDirectFriendInput(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none border"
              style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
            />
            <button
              type="submit"
              disabled={!directFriendInput.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow transition flex items-center gap-1.5 disabled:opacity-40"
              style={{ backgroundColor: accent.hex }}
            >
              <Monitor className="w-4 h-4" /> Conectar na Sala
            </button>
          </form>

          {/* Link Direto para Entrar na Sala */}
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
          >
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Link de Convite Desta Sala
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Mande no WhatsApp para seu amigo entrar com 1 toque
              </div>
            </div>

            <button
              onClick={copyRoomInvite}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow active:scale-95"
              style={{ backgroundColor: accent.hex }}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Link da Sala
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
