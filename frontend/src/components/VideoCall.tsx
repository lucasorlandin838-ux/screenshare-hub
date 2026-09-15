import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from 'lucide-react';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerUsername: string;
  isScreenSharing: boolean;
  onToggleMic: (enabled: boolean) => void;
  onToggleCamera: (enabled: boolean) => void;
  onToggleScreen: () => void;
  onEndCall: () => void;
}

export default function VideoCall({
  localStream, remoteStream, peerUsername, isScreenSharing,
  onToggleMic, onToggleCamera, onToggleScreen, onEndCall
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

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

  const handleToggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    onToggleMic(next);
  };

  const handleToggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    onToggleCamera(next);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 relative bg-dark-900">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-4 text-4xl font-bold">
                {peerUsername[0]?.toUpperCase()}
              </div>
              <p className="text-white text-xl">{peerUsername}</p>
              <p className="text-gray-400 mt-2">Conectando...</p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-20 right-4 w-40 h-28 bg-dark-800 rounded-lg overflow-hidden border-2 border-brand-500 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!camOn && (
            <div className="absolute inset-0 bg-dark-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Peer name */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
          <span className="text-white font-medium">{peerUsername}</span>
          {isScreenSharing && <span className="ml-2 text-brand-400 text-sm">(compartilhando tela)</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="h-16 bg-dark-900/95 flex items-center justify-center gap-4">
        <button
          onClick={handleToggleMic}
          className={`p-3 rounded-full transition-colors ${
            micOn ? 'bg-dark-700 hover:bg-dark-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={micOn ? 'Mudo' : 'Desmutar'}
        >
          {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={handleToggleCam}
          className={`p-3 rounded-full transition-colors ${
            camOn ? 'bg-dark-700 hover:bg-dark-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={camOn ? 'Desligar câmera' : 'Ligar câmera'}
        >
          {camOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={onToggleScreen}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing ? 'bg-brand-600 hover:bg-brand-700' : 'bg-dark-700 hover:bg-dark-600'
          }`}
          title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title="Encerrar chamada"
        >
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
