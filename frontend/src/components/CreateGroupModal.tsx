import React, { useState } from 'react';
import { Users, X, Check, Shield } from 'lucide-react';
import { Friend, CustomGroup } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  currentUsername: string;
  onCreateGroup: (group: CustomGroup) => void;
}

const EMOJI_OPTIONS = ['🎮', '💬', '🍕', '🚀', '👑', '🔥', '⚡', '🎧', '🏆', '🌟', '🤖', '🍿', '🎬', '🎸', '⚽'];

export default function CreateGroupModal({
  isOpen,
  onClose,
  friends,
  currentUsername,
  onCreateGroup,
}: Props) {
  const { theme, accent } = useTheme();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎮');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleFriend = (friendName: string) => {
    const clean = friendName.toLowerCase();
    setSelectedFriends((prev) =>
      prev.includes(clean) ? prev.filter((f) => f !== clean) : [...prev, clean]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Por favor, informe um nome para o grupo.');
      return;
    }

    const members = Array.from(
      new Set([currentUsername.toLowerCase(), ...selectedFriends])
    );

    const newGroup: CustomGroup = {
      id: 'grp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: cleanName,
      icon: selectedEmoji,
      members,
      createdBy: currentUsername,
      createdAt: new Date().toISOString(),
    };

    onCreateGroup(newGroup);
    setName('');
    setSelectedFriends([]);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow font-bold"
              style={{ backgroundColor: accent.hex }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Criar Novo Grupo</h2>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Converse e faça chamadas em grupo estilo Discord
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Nome do Grupo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
              Nome do Grupo
            </label>
            <input
              type="text"
              placeholder="Ex: Squad do Valorant, Os Cria, Turma da Call..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              maxLength={30}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.bgInput,
                borderColor: theme.borderColor,
              }}
            />
          </div>

          {/* Seletor de Ícone / Emoji */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
              Ícone do Grupo
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-9 h-9 text-lg rounded-xl border flex items-center justify-center transition ${
                    selectedEmoji === emoji
                      ? 'border-emerald-500 bg-emerald-500/20 scale-105'
                      : 'hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: selectedEmoji === emoji ? undefined : theme.bgCard,
                    borderColor: selectedEmoji === emoji ? undefined : theme.borderColor,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Selecionar Amigos */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
              Adicionar Amigos ({selectedFriends.length} selecionados)
            </label>
            {friends.length === 0 ? (
              <div
                className="p-3 rounded-xl border text-center text-xs"
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.borderColor,
                  color: theme.textMuted,
                }}
              >
                Você ainda não tem amigos adicionados na barra lateral. Você pode criar o grupo agora e adicionar amigos depois!
              </div>
            ) : (
              <div
                className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1"
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.borderColor,
                }}
              >
                {friends.map((f) => {
                  const isSelected = selectedFriends.includes(f.username.toLowerCase());
                  return (
                    <div
                      key={f.username}
                      onClick={() => toggleFriend(f.username)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition text-xs ${
                        isSelected ? 'bg-white/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-[10px] text-white">
                          {f.avatar ? (
                            <img src={f.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            f.username[0]?.toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-white">@{f.username}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-zinc-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition transform active:scale-95"
              style={{ backgroundColor: accent.hex }}
            >
              Criar Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
