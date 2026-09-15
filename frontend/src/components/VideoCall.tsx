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
  Maximize2,
  Minimize2,
  X,
  Send,
  Volume2,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface Props {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerUsername: string;
  isScreenSharing: boolean;
  remoteIsSharingScreen?: boolean;
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
  remoteIsSharingScreen,
  micMuted,
  camMuted,
  messages,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onEndCall,
  onSendMessage,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().then(() => {
        setNeedsAudioUnlock(false);
      }).catch((err) => {
        console.log('[VideoCall] Autoplay aguardando toque do usuário:', err);
        setNeedsAudioUnlock(true);
      });
    }
  }, [remoteStream, remoteIsSharingScreen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const unlockAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().then(() => {
        setNeedsAudioUnlock(false);
      }).catch(() => {});
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSendMessage(inputMsg.trim());
    setInputMsg('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-black relative overflow-hidden"
    >
      {/* Aviso caso o celular precise de um toque para liberar o áudio */}
      {needsAudioUnlock && (
        <div
          onClick={unlockAudio}
          className="bg-zinc-800 text-zinc-200 text-xs py-2 px-4 flex items-center justify-center gap-2 cursor-pointer z-30 border-b border-zinc-700 active:bg-zinc-700"
        >
          <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Toque aqui para ativar o áudio da chamada no celular</span>
        </div>
      )}

      {/* Top bar info (Tema Preto e Cinza Escuro) */}
      <div className="h-14 bg-zinc-950/95 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-6 z-20 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
          <span className="text-zinc-200 font-semibold text-xs sm:text-sm truncate">
            Chamada: <span className="text-white font-bold">{peerUsername}</span>
          </span>

          {isScreenSharing && (
            <span className="bg-zinc-800 text-amber-400 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-zinc-700 flex items-center gap-1 font-medium flex-shrink-0">
              <Monitor className="w-3 h-3 text-amber-400" /> <span className="hidden sm:inline">Você está</span> transmitindo
            </span>
          )}

          {remoteIsSharingScreen && (
            <span className="bg-zinc-800 text-emerald-400 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-zinc-700 flex items-center gap-1 font-medium flex-shrink-0">
              <Monitor className="w-3 h-3 text-emerald-400" /> <span className="hidden sm:inline">Tela de</span> {peerUsername}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition ${
              chatOpen
                ? 'bg-zinc-800 text-white font-bold'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {messages.length > 0 && (
              <span className="bg-zinc-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Video & Chat Area */}
      <div className="flex-1 flex relative overflow-hidden bg-black">
        {/* Remote Video Container */}
        <div className="flex-1 relative bg-black flex items-center justify-center p-1 sm:p-4">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-lg sm:rounded-xl shadow-2xl"
            />
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center mb-3 text-zinc-500 animate-pulse">
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-400" />
              </div>
              <p className="text-zinc-200 font-medium text-base sm:text-lg">Conectando chamada...</p>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1">Aguardando vídeo de {peerUsername}</p>
            </div>
          )}

          {/* Local Video Thumbnail */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-28 sm:w-56 aspect-video bg-zinc-900 border-2 border-zinc-700 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl group transition-all z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${camMuted && !isScreenSharing ? 'hidden' : ''}`}
            />
            {camMuted && !isScreenSharing && (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-[10px] sm:text-xs gap-0.5 sm:gap-1">
                <VideoOff className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-600" />
                <span>Câmera off</span>
              </div>
            )}
            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded text-[9px] sm:text-[11px] text-zinc-300 font-medium">
              Você {isScreenSharing ? '(Sua Tela)' : ''}
            </div>
          </div>
        </div>

        {/* Chat Drawer: Slide-over on Desktop, Bottom-sheet on Mobile */}
        {chatOpen && (
          <div className="fixed sm:relative inset-x-0 bottom-0 sm:inset-auto h-[60vh] sm:h-full w-full sm:w-80 bg-zinc-950/98 sm:bg-zinc-950 border-t sm:border-t-0 sm:border-l border-zinc-800 flex flex-col z-40 rounded-t-2xl sm:rounded-none shadow-2xl backdrop-blur-xl">
            <div className="p-3 border-b border-zinc-800 text-white font-medium text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <span>Chat da Chamada</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {messages.length === 0 ? (
                <div className="text-zinc-500 text-xs text-center mt-8">
                  Nenhuma mensagem ainda. Digite algo abaixo!
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-zinc-300 text-xs">{m.sender}</span>
                      <span className="text-[9px] sm:text-[10px] text-zinc-600">{m.time}</span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800/80 text-zinc-200 p-2.5 rounded-lg break-words text-xs">
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-2.5 sm:p-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                placeholder="Mensagem..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center border border-zinc-700"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Control Bar (Tema Cinza Escuro e Preto) */}
      <div className="h-18 sm:h-20 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-center gap-2.5 sm:gap-4 px-3 sm:px-6 z-20 pb-safe">
        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          className={`p-3 sm:p-3.5 rounded-full transition transform active:scale-95 border ${
            micMuted
              ? 'bg-red-950/80 border-red-800 text-red-400'
              : 'bg-zinc-900 border-zinc-700/80 hover:bg-zinc-800 text-zinc-200'
          }`}
          title={micMuted ? 'Ativar microfone' : 'Desativar microfone'}
        >
          {micMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Cam toggle */}
        <button
          onClick={onToggleCamera}
          className={`p-3 sm:p-3.5 rounded-full transition transform active:scale-95 border ${
            camMuted
              ? 'bg-red-950/80 border-red-800 text-red-400'
              : 'bg-zinc-900 border-zinc-700/80 hover:bg-zinc-800 text-zinc-200'
          }`}
          title={camMuted ? 'Ligar câmera' : 'Desligar câmera'}
        >
          {camMuted ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreen}
          className={`px-4 sm:px-6 py-3 sm:py-3.5 rounded-full flex items-center gap-2 font-bold text-xs sm:text-sm transition transform active:scale-95 shadow-xl border ${
            isScreenSharing
              ? 'bg-amber-950/80 border-amber-600 text-amber-300 ring-2 ring-amber-500/30'
              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white'
          }`}
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="hidden sm:inline">Parar Compartilhamento</span>
              <span className="sm:hidden">Parar</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
              <span className="hidden sm:inline">Compartilhar Tela</span>
              <span className="sm:hidden">Tela</span>
            </>
          )}
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="p-3 sm:p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition transform active:scale-95 shadow-lg border border-red-500"
          title="Encerrar chamada"
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
