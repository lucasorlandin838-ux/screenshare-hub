import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Phone,
  PhoneCall,
  Plus,
  Send,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  UserPlus,
  X,
  Sparkles,
  Shield,
  LogOut,
} from 'lucide-react';
import { CustomGroup, ChatMessage, ChatAttachment, Friend } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_OPTIONS } from './UserSettingsModal';

interface Props {
  group: CustomGroup;
  currentUsername: string;
  userAvatar?: string;
  nameFont?: string;
  nameColor?: string;
  friends: Friend[];
  friendsOnline: Record<string, boolean>;
  messages: ChatMessage[];
  isCallActive: boolean;
  onStartGroupCall: (group: CustomGroup) => void;
  onJoinGroupCall: (group: CustomGroup) => void;
  onSendMessage: (content: string, groupId: string, file?: ChatAttachment) => void;
  onAddMember: (groupId: string, memberUsername: string) => void;
  onRemoveMember: (groupId: string, memberUsername: string) => void;
  onLeaveGroup: (groupId: string) => void;
}

export default function GroupChatView({
  group,
  currentUsername,
  userAvatar,
  nameFont = 'default',
  nameColor = '#ffffff',
  friends,
  friendsOnline,
  messages,
  isCallActive,
  onStartGroupCall,
  onJoinGroupCall,
  onSendMessage,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
}: Props) {
  const { theme, accent } = useTheme();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<ChatAttachment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupMessages = messages.filter((m) => m.groupId === group.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    onSendMessage(text.trim(), group.id, selectedFile || undefined);
    setText('');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 25 MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddMemberSubmit = (usernameToAdd: string) => {
    const clean = usernameToAdd.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;
    if (group.members.map((m) => m.toLowerCase()).includes(clean)) {
      alert('Este usuário já está no grupo!');
      return;
    }
    onAddMember(group.id, clean);
    setNewMemberName('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.bgMain }}>
      {/* Group Header */}
      <div
        className="h-16 px-4 sm:px-6 border-b flex items-center justify-between z-10"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md border"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.borderColor,
            }}
          >
            {group.icon || '👥'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                {group.name}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-semibold">
                {group.members.length} membros
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {group.members.map((m) => '@' + m).join(', ')}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Iniciar / Entrar na Chamada de Grupo */}
          <button
            onClick={() => (isCallActive ? onJoinGroupCall(group) : onStartGroupCall(group))}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition transform active:scale-95 ${
              isCallActive
                ? 'bg-emerald-600 hover:bg-emerald-500 animate-pulse ring-2 ring-emerald-400'
                : 'hover:brightness-110'
            }`}
            style={{ backgroundColor: isCallActive ? undefined : accent.hex }}
            title="Ligar para todos no grupo"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isCallActive ? 'Entrar na Chamada' : 'Ligar para o Grupo'}
            </span>
            <span className="sm:hidden">{isCallActive ? 'Entrar' : 'Ligar'}</span>
          </button>

          {/* Adicionar Membro */}
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1"
            style={{ borderColor: theme.borderColor }}
            title="Adicionar amigo ao grupo"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Convidar</span>
          </button>

          {/* Sair do Grupo */}
          <button
            onClick={() => {
              if (confirm(`Tem certeza que deseja sair do grupo "${group.name}"?`)) {
                onLeaveGroup(group.id);
              }
            }}
            className="p-2 rounded-xl border text-zinc-400 hover:text-red-400 hover:border-red-800 transition"
            style={{ borderColor: theme.borderColor }}
            title="Sair do grupo"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Call Banner (se houver chamada em andamento) */}
      {isCallActive && (
        <div
          className="px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-700/80 flex items-center justify-between text-xs text-emerald-200 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold">Chamada em andamento neste grupo!</span>
            <span className="hidden sm:inline text-emerald-400 text-[11px]">
              Transmissão de tela e voz ativas
            </span>
          </div>
          <button
            onClick={() => onJoinGroupCall(group)}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1"
          >
            <PhoneCall className="w-3 h-3" />
            Entrar Agora
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Welcome card */}
        <div
          className="p-6 rounded-2xl border text-center max-w-md mx-auto my-6"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderColor,
          }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow">
            {group.icon}
          </div>
          <h3 className="text-base font-bold text-white">Bem-vindo ao grupo {group.name}!</h3>
          <p className="text-xs mt-1 text-zinc-400">
            Este é o canal oficial de texto e voz do grupo. Chame seus amigos para jogar, bater papo e compartilhar tela!
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => onStartGroupCall(group)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition transform active:scale-95 flex items-center gap-1.5"
              style={{ backgroundColor: accent.hex }}
            >
              <Phone className="w-3.5 h-3.5" />
              Testar Chamada do Grupo
            </button>
          </div>
        </div>

        {/* Message Items */}
        {groupMessages.map((msg) => {
          const isMe = msg.sender.toLowerCase() === currentUsername.toLowerCase();
          const fontConfig = FONT_OPTIONS.find((f) => f.id === msg.nameFont);
          const fontClass = fontConfig ? fontConfig.className : '';
          const nameColor = msg.nameColor || accent.hex;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 group rounded-xl px-2 py-1.5 transition hover:bg-white/5`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden shadow">
                {msg.avatar ? (
                  <img src={msg.avatar} alt={msg.sender} className="w-full h-full object-cover" />
                ) : (
                  msg.sender[0]?.toUpperCase()
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`font-bold text-xs ${fontClass}`}
                    style={{
                      color: nameColor,
                      
                    }}
                  >
                    {msg.sender}
                  </span>
                  {isMe && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-400">
                      Você
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">{msg.time}</span>
                </div>

                {/* Content */}
                {msg.content && (
                  <p className="text-xs sm:text-sm text-zinc-200 break-words leading-relaxed">
                    {msg.content}
                  </p>
                )}

                {/* Attached Image / File */}
                {msg.file && (
                  <div className="mt-2">
                    {msg.file.type.startsWith('image/') ? (
                      <div
                        className="inline-block max-w-sm rounded-xl overflow-hidden border shadow-lg"
                        style={{ borderColor: theme.borderColor }}
                      >
                        <img
                          src={msg.file.dataUrl}
                          alt={msg.file.name}
                          className="max-h-72 w-auto object-cover cursor-pointer hover:opacity-95 transition"
                          onClick={() => window.open(msg.file?.dataUrl, '_blank')}
                        />
                      </div>
                    ) : (
                      <a
                        href={msg.file.dataUrl}
                        download={msg.file.name}
                        className="inline-flex items-center gap-2 p-3 rounded-xl border text-xs text-white transition hover:bg-white/10 shadow"
                        style={{
                          backgroundColor: theme.bgCard,
                          borderColor: theme.borderColor,
                        }}
                      >
                        <Paperclip className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-semibold">{msg.file.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {Math.round(msg.file.size / 1024)} KB
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="p-3 sm:p-4 border-t"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
        }}
      >
        {selectedFile && (
          <div
            className="mb-2 p-2 rounded-xl border flex items-center justify-between text-xs"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.borderColor,
            }}
          >
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-medium truncate max-w-xs">{selectedFile.name}</span>
              <span className="text-zinc-500 text-[10px]">
                ({Math.round(selectedFile.size / 1024)} KB)
              </span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 rounded-md text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* File Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border text-zinc-400 hover:text-white hover:bg-white/10 transition"
            style={{ borderColor: theme.borderColor }}
            title="Enviar foto ou arquivo"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Conversar em #${group.name}...`}
            className="flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.bgInput,
              borderColor: theme.borderColor,
            }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!text.trim() && !selectedFile}
            className="p-2.5 rounded-xl text-white font-bold transition transform active:scale-95 disabled:opacity-40 shadow-lg"
            style={{ backgroundColor: accent.hex }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden p-5"
            style={{
              backgroundColor: theme.bgSidebar,
              borderColor: theme.borderColor,
              color: theme.textPrimary,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">Adicionar Membro ao Grupo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick add from existing friends */}
            <div className="mb-4">
              <p className="text-[11px] text-zinc-400 mb-2 font-semibold uppercase">Amigos Salvos</p>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {friends
                  .filter((f) => !group.members.map((m) => m.toLowerCase()).includes(f.username.toLowerCase()))
                  .map((f) => (
                    <div
                      key={f.username}
                      onClick={() => handleAddMemberSubmit(f.username)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-white">@{f.username}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">+ Adicionar</span>
                    </div>
                  ))}
                {friends.filter((f) => !group.members.map((m) => m.toLowerCase()).includes(f.username.toLowerCase())).length === 0 && (
                  <p className="text-xs text-zinc-500 italic">Todos os seus amigos salvos já estão no grupo.</p>
                )}
              </div>
            </div>

            {/* Manual input */}
            <div>
              <p className="text-[11px] text-zinc-400 mb-1.5 font-semibold uppercase">Ou digite o nome:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do usuário..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemberSubmit(newMemberName)}
                  className="flex-1 px-3 py-2 rounded-xl border text-xs text-white placeholder-zinc-500 focus:outline-none"
                  style={{
                    backgroundColor: theme.bgInput,
                    borderColor: theme.borderColor,
                  }}
                />
                <button
                  onClick={() => handleAddMemberSubmit(newMemberName)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: accent.hex }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
