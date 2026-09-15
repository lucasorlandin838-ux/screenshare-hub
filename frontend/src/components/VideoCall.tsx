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
  Tv,
  Music,
} from 'lucide-react';
import { ChatMessage, SoundEffect, PlayedSoundNotification } from '../types';
import SoundboardModal from './SoundboardModal';
import { useTheme } from '../context/ThemeContext';

interface Props {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerUsername: string;
  peerAvatar?: string;
  userAvatar?: string;
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
  lastPlayedSound?: PlayedSoundNotification | null;
  onTriggerSound?: (sound: SoundEffect) => void;
  groupName?: string;
}

export default function VideoCall({
  localStream,
  remoteStream,
  peerUsername,
  peerAvatar,
  userAvatar,
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
  lastPlayedSound,
  onTriggerSound,
  groupName,
}: Props) {
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const { theme, accent } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
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
      remoteVideoRef.current
        .play()
        .then(() => {
          setNeedsAudioUnlock(false);
        })
        .catch((err) => {
          console.log('[VideoCall] Autoplay aguardando toque do usuário:', err);
          setNeedsAudioUnlock(true);
        });
    }
  }, [remoteStream, remoteIsSharingScreen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const unlockAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current
        .play()
        .then(() => {
          setNeedsAudioUnlock(false);
        })
        .catch(() => {});
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSendMessage(inputMsg.trim());
    setInputMsg('');
  };

  // Alterna Tela Cheia da Live / Transmissão
  const toggleLiveFullscreen = () => {
    const targetElement = remoteContainerRef.current || containerRef.current;
    if (!targetElement) return;

    if (!document.fullscreenElement) {
      if (targetElement.requestFullscreen) {
        targetElement.requestFullscreen().catch(() => {});
      } else if ((targetElement as any).webkitRequestFullscreen) {
        (targetElement as any).webkitRequestFullscreen();
      } else if ((remoteVideoRef.current as any)?.webkitEnterFullscreen) {
        // Fallback para iOS Safari
        (remoteVideoRef.current as any).webkitEnterFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full relative overflow-hidden font-sans"
      style={{ backgroundColor: theme.bgMain }}
    >
      {/* Aviso caso o celular precise de um toque para liberar o áudio */}
      {needsAudioUnlock && (
        <div
          onClick={unlockAudio}
          className="text-xs py-2 px-4 flex items-center justify-center gap-2 cursor-pointer z-30 border-b active:opacity-80 transition"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderColor,
            color: theme.textPrimary,
          }}
        >
          <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Toque aqui para ativar o áudio da chamada no celular</span>
        </div>
      )}

      {/* Top bar info */}
      <div
        className="h-14 border-b flex items-center justify-between px-3 sm:px-6 z-20 backdrop-blur"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
          <div
            className="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{ borderColor: accent.hex, backgroundColor: theme.bgCard }}
          >
            {peerAvatar ? (
              <img src={peerAvatar} alt={peerUsername} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white uppercase">{peerUsername[0]}</span>
            )}
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-xs sm:text-sm text-white truncate">
              {peerUsername}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          </div>

          {isScreenSharing && (
            <span
              className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-bold flex-shrink-0"
              style={{
                backgroundColor: theme.bgCard,
                borderColor: accent.hex,
                color: accent.hex,
              }}
            >
              <Monitor className="w-3 h-3" /> <span className="hidden sm:inline">Você está</span> transmitindo
            </span>
          )}

          {remoteIsSharingScreen && (
            <span
              className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-bold flex-shrink-0 bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow"
            >
              <Tv className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>AO VIVO: Tela de {peerUsername}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão de Tela Cheia no Topo */}
          <button
            onClick={toggleLiveFullscreen}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isFullscreen ? 'bg-white text-black' : 'text-zinc-200 hover:text-white bg-white/10 hover:bg-white/20'
            }`}
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Sair da Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition ${
              chatOpen ? 'text-white font-bold shadow' : 'text-zinc-300 hover:bg-white/10'
            }`}
            style={{
              backgroundColor: chatOpen ? accent.hex : theme.bgCard,
            }}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {messages.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Video & Chat Area */}
      <div className="flex-1 flex relative overflow-hidden bg-black">
        {/* Remote Video Container com Suporte a Duplo Clique e Botão Flutuante de Live */}
        <div
          ref={remoteContainerRef}
          onDoubleClick={toggleLiveFullscreen}
          className="flex-1 relative bg-black flex items-center justify-center p-1 sm:p-4 select-none cursor-pointer group/stream"
          title="Dê um duplo clique para abrir ou sair da Tela Cheia da Live"
        >
          {/* BOTÃO PROEMINENTE DE TELA CHEIA QUANDO O AMIGO ESTÁ FAZENDO LIVE / TRANSMITINDO */}
          {remoteIsSharingScreen && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLiveFullscreen();
                }}
                className="bg-black/90 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 border-2 border-emerald-500 shadow-2xl backdrop-blur-md transition transform active:scale-95"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-amber-400" />
                    <span>Sair da Tela Cheia</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>⛶ VER LIVE EM TELA CHEIA</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Dica de Duplo Clique no Desktop */}
          {remoteIsSharingScreen && !isFullscreen && (
            <div className="hidden sm:block absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] text-zinc-300 opacity-60 group-hover/stream:opacity-100 transition">
              💡 Dica: Duplo-clique no vídeo para tela cheia
            </div>
          )}

          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-contain ${
                isFullscreen ? 'rounded-none' : 'rounded-lg sm:rounded-xl shadow-2xl'
              }`}
            />
          ) : (
            <div className="text-center p-6">
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-2 mx-auto flex items-center justify-center mb-3 overflow-hidden shadow-xl"
                style={{ borderColor: accent.hex, backgroundColor: theme.bgCard }}
              >
                {peerAvatar ? (
                  <img src={peerAvatar} alt={peerUsername} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-white uppercase">
                    {peerUsername[0]}
                  </span>
                )}
              </div>
              <p className="text-zinc-200 font-bold text-base sm:text-lg">
                Conectado com {peerUsername}
              </p>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1">
                Aguardando transmissão de vídeo ou tela ao vivo...
              </p>
            </div>
          )}

          {/* Local Video Thumbnail (Picture in Picture) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-28 sm:w-52 aspect-video border-2 rounded-xl overflow-hidden shadow-2xl group transition-all z-20 ${
              isFullscreen ? 'opacity-40 hover:opacity-100' : ''
            }`}
            style={{
              backgroundColor: theme.bgCard,
              borderColor: accent.hex,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${camMuted && !isScreenSharing ? 'hidden' : ''}`}
            />
            {camMuted && !isScreenSharing && (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-[10px] sm:text-xs gap-1">
                {userAvatar ? (
                  <img src={userAvatar} alt="Você" className="w-10 h-10 rounded-full object-cover mb-0.5" />
                ) : (
                  <VideoOff className="w-5 h-5 text-zinc-500" />
                )}
                <span>Câmera off</span>
              </div>
            )}
            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded text-[9px] sm:text-[11px] text-zinc-300 font-medium">
              Você {isScreenSharing ? '(Sua Tela)' : ''}
            </div>
          </div>
        </div>

        {/* Chat Drawer */}
        {chatOpen && (
          <div
            className="fixed sm:relative inset-x-0 bottom-0 sm:inset-auto h-[60vh] sm:h-full w-full sm:w-80 border-t sm:border-t-0 sm:border-l flex flex-col z-40 rounded-t-2xl sm:rounded-none shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: theme.bgSidebar,
              borderColor: theme.borderColor,
            }}
          >
            <div
              className="p-3 border-b text-white font-bold text-sm flex items-center justify-between"
              style={{ borderColor: theme.borderColor }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: accent.hex }} />
                <span>Chat da Chamada</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
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
                      {m.avatar && (
                        <img src={m.avatar} alt={m.sender} className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span className="font-bold text-xs" style={{ color: accent.hex }}>
                        {m.sender}
                      </span>
                      <span className="text-[9px] text-zinc-500">{m.time}</span>
                    </div>
                    <div
                      className="p-2.5 rounded-lg break-words text-xs border"
                      style={{
                        backgroundColor: theme.bgInput,
                        borderColor: theme.borderColor,
                        color: theme.textPrimary,
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-2.5 sm:p-3 border-t flex gap-2"
              style={{ borderColor: theme.borderColor }}
            >
              <input
                type="text"
                placeholder="Mensagem..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none border"
                style={{
                  backgroundColor: theme.bgInput,
                  borderColor: theme.borderColor,
                }}
              />
              <button
                type="submit"
                className="text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center transition shadow"
                style={{ backgroundColor: accent.hex }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div
        className="h-18 sm:h-20 border-t flex items-center justify-center gap-2.5 sm:gap-4 px-3 sm:px-6 z-20 pb-safe"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
        }}
      >
        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          className={`p-3 sm:p-3.5 rounded-full transition transform active:scale-95 border ${
            micMuted
              ? 'bg-red-950/80 border-red-800 text-red-400'
              : 'hover:bg-white/10 text-zinc-200'
          }`}
          style={{
            backgroundColor: micMuted ? undefined : theme.bgCard,
            borderColor: micMuted ? undefined : theme.borderColor,
          }}
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
              : 'hover:bg-white/10 text-zinc-200'
          }`}
          style={{
            backgroundColor: camMuted ? undefined : theme.bgCard,
            borderColor: camMuted ? undefined : theme.borderColor,
          }}
          title={camMuted ? 'Ligar câmera' : 'Desligar câmera'}
        >
          {camMuted ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreen}
          className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-full flex items-center gap-2 font-bold text-xs sm:text-sm transition transform active:scale-95 shadow-xl border text-white"
          style={{
            backgroundColor: isScreenSharing ? accent.hex : theme.bgCard,
            borderColor: isScreenSharing ? '#ffffff' : theme.borderColor,
          }}
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Parar Compartilhamento</span>
              <span className="sm:hidden">Parar</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Compartilhar Tela</span>
              <span className="sm:hidden">Tela</span>
            </>
          )}
        </button>

                {/* Soundboard Button */}
        <button
          onClick={() => setSoundboardOpen(true)}
          className="px-3 sm:px-4 py-3 sm:py-3.5 rounded-full flex items-center gap-1.5 font-bold text-xs sm:text-sm transition transform active:scale-95 shadow-xl border hover:brightness-110 text-white"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.borderColor,
          }}
          title="Abrir Soundboard (Efeitos de Som do Discord)"
        >
          <Music className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span className="hidden sm:inline">Soundboard</span>
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
      {/* Soundboard Modal */}
      {soundboardOpen && (
        <SoundboardModal
          isOpen={soundboardOpen}
          onClose={() => setSoundboardOpen(false)}
          onTriggerSound={(sound) => {
            if (onTriggerSound) onTriggerSound(sound);
          }}
        />
      )}
    </div>
  );
}
