import React from 'react';
import { Phone, PhoneOff, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  fromUsername: string;
  fromAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ fromUsername, fromAvatar, onAccept, onReject }: Props) {
  const { theme, accent } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="rounded-3xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-full text-center shadow-2xl border animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.borderColor,
        }}
      >
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
          <div
            className="w-full h-full rounded-full overflow-hidden border-2 flex items-center justify-center font-black text-2xl shadow-xl"
            style={{
              borderColor: accent.hex,
              backgroundColor: theme.bgSidebar,
            }}
          >
            {fromAvatar ? (
              <img src={fromAvatar} alt={fromUsername} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white uppercase text-2xl">{fromUsername[0]}</span>
            )}
          </div>
          <span
            className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center animate-ping"
          />
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white mb-1 tracking-tight">
          {fromUsername}
        </h3>
        <p className="text-zinc-400 text-xs sm:text-sm mb-6">
          está te chamando para chamada com tela & vídeo...
        </p>

        <div className="flex justify-center gap-6 sm:gap-8">
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition"
          >
            <div className="w-14 h-14 rounded-full bg-red-950/80 group-hover:bg-red-600 border border-red-700 flex items-center justify-center text-red-400 group-hover:text-white transition-all shadow-lg">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-400 group-hover:text-white font-medium">Recusar</span>
          </button>

          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 group-hover:bg-emerald-600 border border-emerald-600 flex items-center justify-center text-emerald-400 group-hover:text-white transition-all shadow-lg">
              <Phone className="w-6 h-6 animate-bounce" />
            </div>
            <span className="text-xs text-zinc-400 group-hover:text-white font-medium">Atender</span>
          </button>
        </div>
      </div>
    </div>
  );
}
