import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Hash,
  Radio,
  Plus,
  File,
  FileText,
  Download,
  Image as ImageIcon,
  X,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, TextChannel, ChatAttachment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_OPTIONS } from './UserSettingsModal';

interface TextChannelChatProps {
  channel: TextChannel;
  messages: ChatMessage[];
  username: string;
  userAvatar: string;
  userNameFont?: string;
  userNameColor?: string;
  onSendMessage: (content: string, channelId: string, file?: ChatAttachment) => void;
  onStartVoiceCall?: () => void;
}

export default function TextChannelChat({
  channel,
  messages,
  username,
  userAvatar,
  userNameFont = 'default',
  userNameColor = '#ffffff',
  onSendMessage,
  onStartVoiceCall,
}: TextChannelChatProps) {
  const { theme, accent } = useTheme();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<ChatAttachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelMessages = messages.filter(
    (m) => !m.channelId || m.channelId === channel.id
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length, selectedFile]);

  // Manipulador de upload de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite de 15MB para P2P suave
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError('Arquivo muito grande! O limite recomendado para transferência rápida é de 15MB.');
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

    onSendMessage(text.trim(), channel.id, selectedFile || undefined);
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
      {/* Topo do Canal */}
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

        {/* Botão rápido: Voz & Tela */}
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
        {/* Banner de Boas-vindas */}
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
            Este é o início do canal <strong className="text-white">#{channel.name}</strong>. Envie mensagens, compartilhe fotos e arquivos com seus amigos!
          </p>
        </div>

        {/* Lista de Mensagens */}
        {channelMessages.map((msg, index) => {
          const isMe = msg.sender.toLowerCase() === username.toLowerCase();
          const prevMsg = channelMessages[index - 1];
          const isSameSender =
            prevMsg &&
            prevMsg.sender.toLowerCase() === msg.sender.toLowerCase() &&
            !msg.file &&
            !prevMsg.file;

          const senderColor = isMe ? (userNameColor || accent.hex) : (msg.nameColor || '#ffffff');
          const fontClass = getFontClass(isMe ? userNameFont : msg.nameFont);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 group rounded-xl px-2 py-1.5 transition ${
                isMe ? 'hover:bg-white/[0.02]' : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Foto de Perfil */}
              {!isSameSender ? (
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border mt-0.5 shadow-sm flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: theme.bgCard,
                    borderColor: senderColor,
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

                {/* Texto da Mensagem */}
                {msg.content && (
                  <div
                    className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap font-normal"
                    style={{ color: theme.textPrimary }}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Anexo de Arquivo */}
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
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Aviso de erro no arquivo */}
      {fileError && (
        <div className="mx-4 p-2.5 bg-red-950 border border-red-800 text-red-200 text-xs rounded-xl flex items-center justify-between animate-shake">
          <span>{fileError}</span>
          <button onClick={() => setFileError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Prévia do Arquivo Anexado antes de Enviar */}
      {selectedFile && (
        <div
          className="mx-3 sm:mx-4 p-2.5 rounded-xl border flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2"
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
                {formatFileSize(selectedFile.size)} • Pronto para enviar
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedFile(null)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/10 transition"
            title="Cancelar anexo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Entrada estilo Discord com Botão de Anexo */}
      <div
        className="p-3 sm:p-4 border-t flex-shrink-0"
        style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
      >
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 rounded-xl p-1.5 border transition focus-within:border-white/30"
          style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
        >
          {/* Input Oculto de Arquivo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Botão de Anexo (+) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
            title="Enviar foto ou arquivo"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Conversar em #${channel.name}...`}
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!text.trim() && !selectedFile}
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
