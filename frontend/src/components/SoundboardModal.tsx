import React, { useState } from 'react';
import { Volume2, X, Plus, Trash2, Sparkles, Music } from 'lucide-react';
import { SOUNDBOARD_PRESETS, SoundItem, playSound } from '../utils/soundboard';
import { useTheme } from '../context/ThemeContext';
import { SoundEffect } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSound: (sound: SoundEffect) => void;
}

export default function SoundboardModal({ isOpen, onClose, onTriggerSound }: Props) {
  const { theme, accent } = useTheme();
  const [volume, setVolume] = useState(0.85);
  const [category, setCategory] = useState<'all' | 'discord' | 'memes' | 'efeitos' | 'custom'>('all');
  const [customSounds, setCustomSounds] = useState<SoundItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hub_custom_sounds') || '[]');
    } catch {
      return [];
    }
  });
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const allSounds: SoundItem[] = [...SOUNDBOARD_PRESETS, ...customSounds];
  const filtered = category === 'all' ? allSounds : allSounds.filter((s) => s.category === category);

  const handlePlay = (item: SoundItem) => {
    setPlayingId(item.id);
    setTimeout(() => setPlayingId(null), 800);

    // Toca localmente
    playSound(item.id, volume, item.customDataUrl);

    // Dispara para os amigos na chamada
    onTriggerSound({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      category: item.category,
      customDataUrl: item.customDataUrl,
    });
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('O arquivo de áudio deve ter no máximo 500 KB para tocar rapidamente!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 20);
      const newSound: SoundItem = {
        id: 'custom_' + Date.now(),
        name: cleanName,
        emoji: '🎵',
        category: 'custom',
        description: 'Áudio enviado por você',
        customDataUrl: dataUrl,
      };
      const updated = [...customSounds, newSound];
      setCustomSounds(updated);
      try {
        localStorage.setItem('hub_custom_sounds', JSON.stringify(updated));
      } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customSounds.filter((s) => s.id !== id);
    setCustomSounds(updated);
    try {
      localStorage.setItem('hub_custom_sounds', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Top Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg font-bold"
              style={{ backgroundColor: accent.hex }}
            >
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Soundboard da Chamada
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-semibold tracking-wider">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Clique em um som para tocar para todos na chamada!
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

        {/* Volume & Filter Tabs */}
        <div
          className="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderColor,
          }}
        >
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'discord', label: 'Discord' },
              { id: 'memes', label: 'Memes' },
              { id: 'efeitos', label: 'Efeitos' },
              { id: 'custom', label: 'Meus Sons' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  category === cat.id
                    ? 'text-white shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: category === cat.id ? accent.hex : undefined,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 text-zinc-400">
            <Volume2 className="w-4 h-4" />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-emerald-500 cursor-pointer"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
            <span className="text-[10px] w-7 font-mono">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        {/* Sounds Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filtered.map((item) => {
            const isPlaying = playingId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handlePlay(item)}
                className={`relative group p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between active:scale-95 shadow-sm hover:border-white/30 ${
                  isPlaying ? 'ring-2 ring-emerald-500 scale-98' : ''
                }`}
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.borderColor,
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl sm:text-3xl select-none group-hover:scale-110 transition transform">
                    {item.emoji}
                  </span>
                  {item.category === 'custom' && (
                    <button
                      onClick={(e) => handleDeleteCustom(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition"
                      title="Excluir som"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <p className="font-bold text-xs line-clamp-1 group-hover:text-white transition">
                    {item.name}
                  </p>
                  <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: theme.textMuted }}>
                    {item.description}
                  </p>
                </div>

                {isPlaying && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}

          {/* Upload Card */}
          <label
            className="p-3 rounded-xl border border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition hover:border-white/40 hover:bg-white/5 group"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: theme.bgCard,
            }}
          >
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleCustomUpload}
            />
            <Plus className="w-6 h-6 text-zinc-400 group-hover:text-white transition mb-1" />
            <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
              Adicionar Som
            </span>
            <span className="text-[9px] text-zinc-500 mt-0.5">MP3 ou WAV (máx 500KB)</span>
          </label>
        </div>

        {/* Footer info */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between text-[11px]"
          style={{
            borderColor: theme.borderColor,
            backgroundColor: theme.bgSidebar,
            color: theme.textMuted,
          }}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Os sons tocam sincronizados para você e seus amigos na chamada!</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border font-semibold hover:bg-white/10 transition"
            style={{ borderColor: theme.borderColor }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
