import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  Users,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface Props {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerUsername: string;
  isScreenSharing: boolean;
  micMuted: boolean;
  camMuted: boolean;
  messages: ChatMessage[];
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  onEndCall: () => void;
  onSendMessage: (msg: string) => void;
}

export default function VideoCall({
  localStream,
  remoteStream,
  peerUsername,
  isScreenSharing,
  micMuted,
  camMuted,
  messages,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onEndCall,
  onSendMessage,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSendMessage(inputMsg.trim());
    setInputMsg('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 relative overflow-hidden">
      {/* Top bar info */}
      <div className="h-14 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between px-6 z-10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-white font-semibold text-sm">
            Chamada com: <span className="text-indigo-400 font-bold">{peerUsername}</span>
          </span>
          {isScreenSharing && (
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/40 flex items-center gap-1 font-medium">
              <Monitor className="w-3 h-3" /> Transmitindo tela
            </span>
          )}
        </div>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition ${
            chatOpen
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Video & Chat Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Remote Video Container */}
        <div className="flex-1 relative bg-black flex items-center justify-center p-4">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <div className="text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center mb-4 text-gray-400 animate-pulse">
                <Users className="w-12 h-12 text-indigo-400" />
              </div>
              <p className="text-white font-medium text-lg">Conectando áudio e vídeo...</p>
              <p className="text-gray-500 text-sm mt-1">Aguardando stream de {peerUsername}</p>
            </div>
          )}

          {/* Local Video Thumbnail (Picture in Picture) */}
          <div className="absolute bottom-6 right-6 w-52 aspect-video bg-gray-900 border-2 border-indigo-500/50 rounded-xl overflow-hidden shadow-2xl group transition-transform hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${camMuted ? 'hidden' : ''}`}
            />
            {camMuted && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
                <VideoOff className="w-6 h-6 text-gray-500" />
                <span>Câmera desligada</span>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[11px] text-white font-medium">
              Você {isScreenSharing ? '(Tela)' : ''}
            </div>
          </div>
        </div>

        {/* Floating / Side Chat */}
        {chatOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 animate-slide-left">
            <div className="p-3 border-b border-gray-800 text-white font-medium text-sm flex items-center justify-between">
              <span>Chat da Chamada</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-xs text-center mt-10">
                  Nenhuma mensagem ainda. Digite algo abaixo!
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-indigo-400 text-xs">{m.sender}</span>
                      <span className="text-[10px] text-gray-500">{m.time}</span>
                    </div>
                    <div className="bg-gray-800 text-gray-200 p-2 rounded-lg break-words text-xs">
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                placeholder="Enviar mensagem..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold"
              >
                Enviar
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-gray-900/95 border-t border-gray-800 flex items-center justify-center gap-4 px-6 z-10 backdrop-blur">
        <button
          onClick={onToggleMic}
          className={`p-3.5 rounded-full transition ${
            micMuted
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white'
          }`}
          title={micMuted ? 'Ativar microfone' : 'Desativar microfone'}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-3.5 rounded-full transition ${
            camMuted
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white'
          }`}
          title={camMuted ? 'Ligar câmera' : 'Desligar câmera'}
        >
          {camMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleScreen}
          className={`px-5 py-3 rounded-full flex items-center gap-2 font-semibold text-sm transition transform hover:scale-105 shadow-lg ${
            isScreenSharing
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="w-5 h-5" />
              <span>Parar Compartilhamento</span>
            </>
          ) : (
            <>
              <Monitor className="w-5 h-5" />
              <span>Compartilhar Tela</span>
            </>
          )}
        </button>

        <button
          onClick={onEndCall}
          className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition transform hover:scale-105 shadow-lg shadow-red-600/30"
          title="Encerrar chamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
