import React from 'react';
import { Phone, PhoneOff, Monitor } from 'lucide-react';

interface Props {
  fromUsername: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ fromUsername, onAccept, onReject }: Props) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mb-4 sm:mb-5 animate-pulse">
          <Monitor className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{fromUsername}</h3>
        <p className="text-zinc-400 text-xs sm:text-sm mb-6">está te chamando para chamada com tela / vídeo...</p>

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
