import React, { useState, useRef } from 'react';
import { X, Upload, Palette, User, Check, Sparkles, Trash2, Camera, Type, Droplet } from 'lucide-react';
import { useTheme, THEMES, ACCENTS } from '../context/ThemeContext';
import { PRESET_AVATARS } from './AvatarPresets';
import { ThemeId, AccentColor } from '../types';

export interface FontOption {
  id: string;
  name: string;
  className: string;
  preview: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'default', name: 'Padrão Moderno', className: '', preview: 'Nome Estiloso' },
  { id: 'gamer', name: 'Gamer / Cyberpunk', className: 'font-gamer tracking-wider', preview: 'G4M3R_PR0' },
  { id: 'cursive', name: 'Cursiva / Manuscrita', className: 'font-cursive', preview: 'Nome Elegante' },
  { id: 'hacker', name: 'Hacker / Terminal', className: 'font-hacker font-bold', preview: 'root@admin:~#' },
  { id: 'medieval', name: 'Medieval / RPG', className: 'font-medieval tracking-wide', preview: 'Lord Supremo' },
  { id: 'bold-modern', name: 'Impacto / Bold', className: 'font-bold-modern font-black', preview: 'IMPACTO 2026' },
];

export const PRESET_NAME_COLORS = [
  { name: 'Ouro Dourado', hex: '#fbbf24' },
  { name: 'Rosa Choque', hex: '#f43f5e' },
  { name: 'Ciano Gelo', hex: '#38bdf8' },
  { name: 'Verde Matrix', hex: '#34d399' },
  { name: 'Roxo Elétrico', hex: '#c084fc' },
  { name: 'Laranja Fogo', hex: '#fb923c' },
  { name: 'Branco Puro', hex: '#ffffff' },
  { name: 'Blurple Discord', hex: '#818cf8' },
];

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatar: string;
  nameFont?: string;
  nameColor?: string;
  onSaveProfile: (newUsername: string, newAvatar: string, newFont: string, newColor: string) => void;
}

export default function UserSettingsModal({
  isOpen,
  onClose,
  username,
  avatar,
  nameFont = 'default',
  nameColor = '#ffffff',
  onSaveProfile,
}: UserSettingsModalProps) {
  const { theme, themeId, setThemeId, accent, accentId, setAccentId } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance'>('profile');
  const [currentName, setCurrentName] = useState(username);
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
  const [currentFont, setCurrentFont] = useState(nameFont);
  const [currentColor, setCurrentColor] = useState(nameColor);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Url = canvas.toDataURL('image/jpeg', 0.85);
          setCurrentAvatar(base64Url);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const cleanName = currentName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanName) return;
    onSaveProfile(cleanName, currentAvatar, currentFont, currentColor);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const selectedFontObj = FONT_OPTIONS.find((f) => f.id === currentFont) || FONT_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Barra Lateral do Modal */}
        <div
          className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r flex flex-row md:flex-col gap-1.5 flex-shrink-0"
          style={{
            backgroundColor: theme.bgSidebar,
            borderColor: theme.borderColor,
          }}
        >
          <div className="hidden md:block px-2 pb-3 mb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Configurações
            </span>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition w-full text-left ${
              activeTab === 'profile'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" style={{ color: activeTab === 'profile' ? accent.hex : undefined }} />
            Meu Perfil & Nome
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition w-full text-left ${
              activeTab === 'appearance'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" style={{ color: activeTab === 'appearance' ? accent.hex : undefined }} />
            Cores & Temas do App
          </button>
        </div>

        {/* Conteúdo Principal do Modal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topo com Título e Fechar */}
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: theme.borderColor }}
          >
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              {activeTab === 'profile' ? (
                <>
                  <User className="w-5 h-5" style={{ color: accent.hex }} />
                  Personalizar Perfil, Nome & Fontes
                </>
              ) : (
                <>
                  <Palette className="w-5 h-5" style={{ color: accent.hex }} />
                  Aparência & Cores do App
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo rolável */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                {/* Visualização do Perfil com Nome Estilizado */}
                <div
                  className="p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
                  style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
                >
                  <div className="relative group">
                    <div
                      className="w-20 h-20 rounded-full overflow-hidden border-2 shadow-lg flex items-center justify-center font-black text-2xl"
                      style={{ borderColor: currentColor, backgroundColor: theme.bgSidebar }}
                    >
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{currentName[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-[10px] font-bold"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      Mudar
                    </button>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span
                        className={`text-lg sm:text-xl font-bold truncate ${selectedFontObj.className}`}
                        style={{ color: currentColor }}
                      >
                        {currentName || 'seu_nome'}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Prévia de como os outros verão seu avatar e seu nome no chat!
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 shadow"
                        style={{ backgroundColor: accent.hex }}
                      >
                        <Upload className="w-3.5 h-3.5" /> Enviar Foto
                      </button>

                      {currentAvatar && (
                        <button
                          onClick={() => setCurrentAvatar('')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. Nome de Usuário */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    placeholder="Seu nome ou apelido..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none border transition"
                    style={{
                      backgroundColor: theme.bgInput,
                      borderColor: theme.borderColor,
                    }}
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Apenas letras, números e underline.
                  </span>
                </div>

                {/* 2. Cor Personalizada do Nome */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5" style={{ color: currentColor }} />
                    Cor do Seu Nome no Chat
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2.5">
                    {PRESET_NAME_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setCurrentColor(c.hex)}
                        className={`h-9 rounded-xl border-2 transition flex items-center justify-center relative ${
                          currentColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'border-white scale-105 shadow-lg'
                            : 'border-transparent hover:border-white/40'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {currentColor.toLowerCase() === c.hex.toLowerCase() && (
                          <Check className="w-4 h-4 text-black stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-zinc-400">Ou escolha uma cor personalizada:</span>
                    <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono text-zinc-200 uppercase">{currentColor}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Fonte do Nome */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" style={{ color: accent.hex }} />
                    Fonte Estilizada para o Nome
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FONT_OPTIONS.map((f) => {
                      const isSelected = currentFont === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setCurrentFont(f.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-white bg-white/10 shadow-md'
                              : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                          }`}
                          style={{ backgroundColor: isSelected ? undefined : theme.bgInput }}
                        >
                          <div>
                            <div className="text-[11px] text-zinc-400 mb-1">{f.name}</div>
                            <div
                              className={`text-base font-bold truncate ${f.className}`}
                              style={{ color: currentColor }}
                            >
                              {currentName || f.preview}
                            </div>
                          </div>
                          {isSelected && (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: accent.hex }}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Avatares Prontos */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: accent.hex }} />
                    Ou Escolha um Avatar Estiloso
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setCurrentAvatar(preset.url)}
                        className={`p-1 rounded-xl border-2 transition flex flex-col items-center group relative ${
                          currentAvatar === preset.url
                            ? 'border-white scale-105 shadow-md'
                            : 'border-transparent hover:border-white/40 opacity-75 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-12 h-12 rounded-lg bg-black/40 object-cover"
                        />
                        {currentAvatar === preset.url && (
                          <div
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: accent.hex }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Seletor de Tema Principal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Tema Base do Aplicativo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(THEMES) as ThemeId[]).map((tKey) => {
                      const t = THEMES[tKey];
                      const isSelected = themeId === tKey;
                      return (
                        <button
                          key={tKey}
                          onClick={() => setThemeId(tKey)}
                          className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-white shadow-lg'
                              : 'border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: t.bgSidebar }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              <span
                                className="w-5 h-5 rounded-full border border-black"
                                style={{ backgroundColor: t.bgMain }}
                              />
                              <span
                                className="w-5 h-5 rounded-full border border-black"
                                style={{ backgroundColor: t.bgCard }}
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{t.name}</div>
                              <div className="text-[10px] text-zinc-400">
                                {tKey === 'oled'
                                  ? 'Preto absoluto 100%'
                                  : tKey === 'discord'
                                  ? 'Cinza e azul clássico'
                                  : tKey === 'midnight'
                                  ? 'Roxo profundo'
                                  : tKey === 'cyberpunk'
                                  ? 'Visual gamer neon'
                                  : 'Hacker dark'}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: accent.hex }}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seletor de Cores de Destaque */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Cor de Destaque dos Botões & Detalhes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {(Object.keys(ACCENTS) as AccentColor[]).map((aKey) => {
                      const a = ACCENTS[aKey];
                      const isSelected = accentId === aKey;
                      return (
                        <button
                          key={aKey}
                          onClick={() => setAccentId(aKey)}
                          className={`p-2.5 rounded-xl border-2 transition flex items-center gap-2 ${
                            isSelected
                              ? 'border-white shadow-md'
                              : 'border-transparent hover:border-white/30'
                          }`}
                          style={{ backgroundColor: theme.bgInput }}
                        >
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: a.hex }}
                          />
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {a.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Demonstração em Tempo Real */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Pré-visualização do Tema no Chat
                  </label>
                  <div
                    className="p-4 rounded-xl border space-y-2.5"
                    style={{ backgroundColor: theme.bgMain, borderColor: theme.borderColor }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border"
                        style={{ borderColor: currentColor, backgroundColor: theme.bgCard }}
                      >
                        {currentAvatar ? (
                          <img src={currentAvatar} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                            {currentName[0]?.toUpperCase() || 'L'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-black ${selectedFontObj.className}`}
                            style={{ color: currentColor }}
                          >
                            {currentName || 'lucas'}
                          </span>
                          <span className="text-[10px] text-zinc-500">Hoje às 14:30</span>
                        </div>
                        <div
                          className="mt-1 px-3 py-1.5 rounded-lg text-xs max-w-sm"
                          style={{ backgroundColor: theme.bgCard, color: theme.textPrimary }}
                        >
                          Fala galera! O novo tema e chat do ScreenShare Hub ficaram insanos 🔥
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé com Botão Salvar */}
          <div
            className="p-4 border-t flex items-center justify-between"
            style={{ backgroundColor: theme.bgSidebar, borderColor: theme.borderColor }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-lg active:scale-95"
              style={{ backgroundColor: accent.hex }}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" /> Salvo com Sucesso!
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
