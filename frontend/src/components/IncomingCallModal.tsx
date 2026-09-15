import React from 'react';
import { Phone, PhoneOff, Monitor } from 'lucide-react';

interface Props {
  fromUsername: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ fromUsername, onAccept, onReject }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-indigo-500/10">
        <div className="w-20 h-20 mx-auto rounded-full bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center mb-5 animate-pulse">
          <Monitor className="w-10 h-10 text-indigo-400" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">{fromUsername}</h3>
        <p className="text-gray-400 text-sm mb-6">está te chamando para chamada com tela / vídeo...</p>

        <div className="flex justify-center gap-6">
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-600/20 group-hover:bg-red-600 border border-red-500 flex items-center justify-center text-red-400 group-hover:text-white transition-all transform group-hover:scale-105">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-white">Recusar</span>
          </button>

          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600/20 group-hover:bg-emerald-600 border border-emerald-500 flex items-center justify-center text-emerald-400 group-hover:text-white transition-all transform group-hover:scale-105">
              <Phone className="w-6 h-6 animate-bounce" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-white">Atender</span>
          </button>
        </div>
      </div>
    </div>
  );
}
