import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallModalProps {
  fromUsername: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ fromUsername, onAccept, onReject }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-dark-800 rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4 border border-dark-700">
        <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-4 text-3xl font-bold animate-pulse">
          {fromUsername[0]?.toUpperCase()}
        </div>
        <h2 className="text-white text-xl font-semibold mb-1">{fromUsername}</h2>
        <p className="text-gray-400 mb-8">está ligando para você...</p>
        <div className="flex gap-6 justify-center">
          <button
            onClick={onReject}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onAccept}
            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors shadow-lg animate-bounce"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
