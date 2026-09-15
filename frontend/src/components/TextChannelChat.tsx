import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, Radio, Smile, Sparkles, PhoneCall } from 'lucide-react';
import { ChatMessage, TextChannel } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TextChannelChatProps {
  channel: TextChannel;
  messages: ChatMessage[];
  username: string;
  userAvatar: string;
  onSendMessage: (content: string, channelId: string) => void;
  onStartVoiceCall?: () => void;
}

export default function TextChannelChat({
  channel,
  messages,
  username,
  userAvatar,
  onSendMessage,
  onStartVoiceCall,
}: TextChannelChatProps) {
  const { theme, accent } = useTheme();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtra as mensagens pelo canal atual
  const channelMessages = messages.filter(
    (m) => !m.channelId || m.channelId === channel.id
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim(), channel.id);
    setText('');
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: theme.bgMain, color: theme.textPrimary }}
    >
      {/* Topo do Canal estilo Discord */}
      <div
        className="h-14 px-4 border-b flex items-center justify-between flex-shrink-0 z-10 shadow-sm"
        style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: theme.bgCard }}
          >
            <Hash className="w-4 h-4" style={{ color: accent.hex }} />
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>{channel.name}</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate hidden sm:block">
              {channel.desc}
            </div>
          </div>
        </div>

        {/* Botão rápido: Ligar ou Iniciar Tela neste canal */}
        {onStartVoiceCall && (
          <button
            onClick={onStartVoiceCall}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition active:scale-95"
            style={{ backgroundColor: accent.hex }}
            title="Iniciar Voz & Compartilhamento de Tela neste canal"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden xs:inline">Entrar em Voz & Tela</span>
            <span className="xs:hidden">Voz</span>
          </button>
        )}
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Banner de Boas-vindas do Canal */}
        <div className="pt-6 pb-4 border-b" style={{ borderColor: theme.borderColor }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow"
            style={{ backgroundColor: theme.bgCard }}
          >
            <Hash className="w-6 h-6" style={{ color: accent.hex }} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Bem-vindo a #{channel.name}!
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Este é o início do canal <strong className="text-white">#{channel.name}</strong>. Envie uma mensagem ou compartilhe sua tela com seus amigos.
          </p>
        </div>

        {/* Lista de Mensagens */}
        {channelMessages.map((msg, index) => {
          const isMe = msg.sender.toLowerCase() === username.toLowerCase();
          const prevMsg = channelMessages[index - 1];
          const isSameSender = prevMsg && prevMsg.sender.toLowerCase() === msg.sender.toLowerCase();

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 group rounded-xl px-2 py-1.5 transition ${
                isMe ? 'hover:bg-white/[0.02]' : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Foto de Perfil / Avatar */}
              {!isSameSender ? (
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border mt-0.5 shadow-sm flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: theme.bgCard,
                    borderColor: isMe ? accent.hex : theme.borderColor,
                  }}
                >
                  {msg.avatar ? (
                    <img
                      src={msg.avatar}
                      alt={msg.sender}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="uppercase text-white">
                      {msg.sender[0]}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-10 flex-shrink-0 text-right">
                  <span className="text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition">
                    {msg.time.slice(0, 5)}
                  </span>
                </div>
              )}

              {/* Conteúdo da Mensagem */}
              <div className="flex-1 overflow-hidden">
                {!isSameSender && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span
                      className="text-xs font-black tracking-wide"
                      style={{ color: isMe ? accent.hex : '#ffffff' }}
                    >
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {formatTime(msg.time)}
                    </span>
                  </div>
                )}
                <div
                  className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap font-normal"
                  style={{ color: theme.textPrimary }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada de Mensagem estilo Discord */}
      <div
        className="p-3 sm:p-4 border-t flex-shrink-0"
        style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
      >
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 rounded-xl p-1.5 border transition focus-within:border-white/30"
          style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
        >
          <div className="pl-2 hidden xs:block">
            <Hash className="w-4 h-4 text-zinc-500" />
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Conversar em #${channel.name}...`}
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className="px-3 py-2 rounded-lg text-white font-bold text-xs disabled:opacity-30 transition flex items-center gap-1 shadow"
            style={{ backgroundColor: accent.hex }}
            title="Enviar mensagem"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
