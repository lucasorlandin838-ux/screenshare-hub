import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Phone,
  Monitor,
  Plus,
  File,
  FileText,
  Download,
  X,
  User,
  Shield,
  Clock,
} from 'lucide-react';
import { ChatMessage, ChatAttachment, Friend } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_OPTIONS } from './UserSettingsModal';

interface DirectMessageChatProps {
  friendUsername: string;
  friend?: Friend;
  messages: ChatMessage[];
  username: string;
  userAvatar: string;
  userNameFont?: string;
  userNameColor?: string;
  onSendDM: (recipient: string, content: string, file?: ChatAttachment) => void;
  onCallFriend: (friendUsername: string) => void;
}

export default function DirectMessageChat({
  friendUsername,
  friend,
  messages,
  username,
  userAvatar,
  userNameFont = 'default',
  userNameColor = '#ffffff',
  onSendDM,
  onCallFriend,
}: DirectMessageChatProps) {
  const { theme, accent } = useTheme();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<ChatAttachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtra apenas as mensagens privadas trocadas entre o usuário e este amigo
  const dmMessages = messages.filter((m) => {
    if (!m.isPrivate) return false;
    const s = m.sender.toLowerCase();
    const r = (m.recipient || '').toLowerCase();
    const me = username.toLowerCase();
    const target = friendUsername.toLowerCase();
    return (s === me && r === target) || (s === target && r === me);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages.length, selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFileError('Arquivo muito grande! O limite recomendado é de 15MB.');
      setTimeout(() => setFileError(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: dataUrl,
      });
      setFileError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    onSendDM(friendUsername, text.trim(), selectedFile || undefined);
    setText('');
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFontClass = (fontId?: string) => {
    const found = FONT_OPTIONS.find((f) => f.id === fontId);
    return found ? found.className : '';
  };

  const downloadFile = (attachment: ChatAttachment) => {
    const a = document.createElement('a');
    a.href = attachment.dataUrl;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: theme.bgMain, color: theme.textPrimary }}
    >
      {/* Topo da Conversa Privada estilo Discord */}
      <div
        className="h-14 px-4 border-b flex items-center justify-between flex-shrink-0 z-10 shadow-sm"
        style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: theme.bgCard,
                borderColor: friend?.nameColor || accent.hex,
              }}
            >
              {friend?.avatar ? (
                <img src={friend.avatar} alt={friendUsername} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white uppercase">{friendUsername[0]}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">@</span>
              <span
                className={`text-sm font-black text-white truncate ${getFontClass(friend?.nameFont)}`}
                style={{ color: friend?.nameColor || '#ffffff' }}
              >
                {friendUsername}
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Chat Privado Direto</span>
            </div>
          </div>
        </div>

        {/* Botões rápidos: Ligar ou Compartilhar Tela com este amigo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCallFriend(friendUsername)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition active:scale-95 bg-emerald-600 hover:bg-emerald-500"
            title={`Iniciar Chamada de Vídeo e Tela com ${friendUsername}`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ligar para {friendUsername}</span>
            <span className="sm:hidden">Ligar</span>
          </button>
        </div>
      </div>

      {/* Área de Mensagens do Chat Privado */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Card Inicial do Amigo */}
        <div className="pt-6 pb-4 border-b" style={{ borderColor: theme.borderColor }}>
          <div
            className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center font-black text-2xl mb-3 shadow-lg"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: friend?.nameColor || accent.hex,
            }}
          >
            {friend?.avatar ? (
              <img src={friend.avatar} alt={friendUsername} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white uppercase">{friendUsername[0]}</span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{friendUsername}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Este é o início do histórico de mensagens privadas entre você e <strong className="text-white">@{friendUsername}</strong>. Ninguém mais tem acesso a esta conversa.
          </p>
        </div>

        {/* Lista de Mensagens Privadas */}
        {dmMessages.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs py-8 italic">
            Nenhuma mensagem privada enviada ainda. Digite algo ou envie uma foto para @{friendUsername} abaixo! 👋
          </div>
        ) : (
          dmMessages.map((msg, index) => {
            const isMe = msg.sender.toLowerCase() === username.toLowerCase();
            const prevMsg = dmMessages[index - 1];
            const isSameSender =
              prevMsg &&
              prevMsg.sender.toLowerCase() === msg.sender.toLowerCase() &&
              !msg.file &&
              !prevMsg.file;

            const senderColor = isMe ? (userNameColor || accent.hex) : (msg.nameColor || friend?.nameColor || '#ffffff');
            const fontClass = getFontClass(isMe ? userNameFont : (msg.nameFont || friend?.nameFont));

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 group rounded-xl px-2 py-1.5 transition ${
                  isMe ? 'hover:bg-white/[0.02]' : 'hover:bg-white/[0.03]'
                }`}
              >
                {!isSameSender ? (
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border mt-0.5 shadow-sm flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: theme.bgCard,
                      borderColor: senderColor,
                    }}
                  >
                    {msg.avatar ? (
                      <img src={msg.avatar} alt={msg.sender} className="w-full h-full object-cover" />
                    ) : (
                      <span className="uppercase text-white">{msg.sender[0]}</span>
                    )}
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0 text-right">
                    <span className="text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition">
                      {msg.time.slice(0, 5)}
                    </span>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  {!isSameSender && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span
                        className={`text-xs font-black tracking-wide ${fontClass}`}
                        style={{ color: senderColor }}
                      >
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {msg.time}
                      </span>
                    </div>
                  )}

                  {msg.content && (
                    <div
                      className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap font-normal"
                      style={{ color: theme.textPrimary }}
                    >
                      {msg.content}
                    </div>
                  )}

                  {msg.file && (
                    <div className="mt-2">
                      {msg.file.type.startsWith('image/') ? (
                        <div className="inline-block max-w-sm rounded-xl overflow-hidden border shadow-lg group/img relative" style={{ borderColor: theme.borderColor }}>
                          <img
                            src={msg.file.dataUrl}
                            alt={msg.file.name}
                            className="max-h-72 w-auto object-contain cursor-pointer hover:opacity-95 transition"
                            onClick={() => downloadFile(msg.file!)}
                          />
                          <div className="p-2 bg-black/75 backdrop-blur flex items-center justify-between text-xs text-zinc-300">
                            <span className="truncate max-w-[200px] font-medium">{msg.file.name}</span>
                            <button
                              onClick={() => downloadFile(msg.file!)}
                              className="p-1 rounded hover:bg-white/20 text-white transition flex items-center gap-1 text-[11px]"
                              title="Baixar imagem"
                            >
                              <Download className="w-3.5 h-3.5" /> Baixar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="p-3 rounded-xl border flex items-center justify-between max-w-sm shadow-md"
                          style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: accent.hex }}
                            >
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-white truncate max-w-[180px]">
                                {msg.file.name}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {formatFileSize(msg.file.size)}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => downloadFile(msg.file!)}
                            className="p-2 rounded-lg text-white hover:bg-white/10 transition shadow flex items-center gap-1 text-xs font-bold"
                            style={{ backgroundColor: accent.hex }}
                            title="Baixar arquivo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {fileError && (
        <div className="mx-4 p-2.5 bg-red-950 border border-red-800 text-red-200 text-xs rounded-xl flex items-center justify-between animate-shake">
          <span>{fileError}</span>
          <button onClick={() => setFileError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedFile && (
        <div
          className="mx-3 sm:mx-4 p-2.5 rounded-xl border flex items-center justify-between shadow-lg"
          style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {selectedFile.type.startsWith('image/') ? (
              <img
                src={selectedFile.dataUrl}
                alt="preview"
                className="w-10 h-10 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: accent.hex }}
              >
                <File className="w-5 h-5" />
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate max-w-[200px]">
                {selectedFile.name}
              </div>
              <div className="text-[10px] text-zinc-400">
                {formatFileSize(selectedFile.size)} • Pronto para enviar para {friendUsername}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedFile(null)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Entrada Privada */}
      <div
        className="p-3 sm:p-4 border-t flex-shrink-0"
        style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
      >
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 rounded-xl p-1.5 border transition focus-within:border-white/30"
          style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
            title="Enviar foto ou arquivo privado"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Conversar em privado com @${friendUsername}...`}
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!text.trim() && !selectedFile}
            className="px-3 py-2 rounded-lg text-white font-bold text-xs disabled:opacity-30 transition flex items-center gap-1 shadow"
            style={{ backgroundColor: accent.hex }}
            title="Enviar mensagem privada"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
