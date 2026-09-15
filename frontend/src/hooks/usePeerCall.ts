import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { ChatMessage, CallState } from '../types';

export function sanitizePeerId(username: string): string {
  return 'hub_' + username.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function usePeerCall(username: string | null) {
  const [peerId, setPeerId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState<CallState>({
    active: false,
    isCaller: false,
    peerUsername: '',
    incoming: false,
    isScreenSharing: false,
    micMuted: false,
    camMuted: false,
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);

  // Inicializar PeerJS
  useEffect(() => {
    if (!username) return;

    const myId = sanitizePeerId(username);
    const peer = new Peer(myId, {
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('open', (id) => {
      console.log('[PeerJS] Conectado com ID:', id);
      setPeerId(id);
      setIsReady(true);
    });

    // Receber chamada de vídeo/áudio
    peer.on('call', (incomingCall) => {
      console.log('[PeerJS] Chamada recebida de:', incomingCall.peer);
      const callerName = incomingCall.peer.replace('hub_', '');
      currentCallRef.current = incomingCall;

      setCallState((prev) => ({
        ...prev,
        incoming: true,
        isCaller: false,
        peerUsername: callerName,
      }));
    });

    // Receber canal de dados (chat / sinais)
    peer.on('connection', (conn) => {
      dataConnRef.current = conn;
      setupDataConnection(conn);
    });

    peer.on('error', (err) => {
      console.warn('[PeerJS] Erro:', err.type, err.message);
      if (err.type === 'unavailable-id') {
        // ID já em uso, tenta com sufixo
        const altId = myId + '_' + Math.floor(Math.random() * 1000);
        console.log('[PeerJS] Tentando ID alternativo:', altId);
        setPeerId(altId);
      }
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      peerRef.current = null;
    };
  }, [username]);

  const setupDataConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      console.log('[PeerJS] Chat conectado com:', conn.peer);
    });

    conn.on('data', (data: any) => {
      if (data?.type === 'chat') {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()) + Math.random(),
            sender: data.sender,
            content: data.content,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (data?.type === 'call-end') {
        cleanupCall();
      }
    });

    conn.on('close', () => {
      console.log('[PeerJS] Chat desconectado');
    });
  }, []);

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      camStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.warn('Não foi possível obter vídeo, tentando só áudio:', e);
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = audioStream;
      setLocalStream(audioStream);
      return audioStream;
    }
  }, []);

  // Ligar para amigo
  const callUser = useCallback(
    async (targetUsername: string) => {
      if (!peerRef.current || !username) return;
      const targetId = sanitizePeerId(targetUsername);

      const stream = await getMedia();

      // Iniciar conexão de chat
      const conn = peerRef.current.connect(targetId);
      dataConnRef.current = conn;
      setupDataConnection(conn);

      // Iniciar chamada de mídia
      const call = peerRef.current.call(targetId, stream);
      currentCallRef.current = call;

      setCallState({
        active: true,
        isCaller: true,
        peerUsername: targetUsername,
        incoming: false,
        isScreenSharing: false,
        micMuted: false,
        camMuted: false,
      });

      call.on('stream', (remote) => {
        console.log('[PeerJS] Stream remoto recebido');
        setRemoteStream(remote);
      });

      call.on('close', () => cleanupCall());
      call.on('error', () => cleanupCall());
    },
    [username, getMedia, setupDataConnection]
  );

  // Atender chamada
  const answerCall = useCallback(async () => {
    if (!currentCallRef.current) return;
    const stream = await getMedia();
    currentCallRef.current.answer(stream);

    setCallState((prev) => ({
      ...prev,
      active: true,
      incoming: false,
    }));

    currentCallRef.current.on('stream', (remote) => {
      console.log('[PeerJS] Stream remoto recebido');
      setRemoteStream(remote);
    });

    currentCallRef.current.on('close', () => cleanupCall());
    currentCallRef.current.on('error', () => cleanupCall());
  }, [getMedia]);

  // Rejeitar chamada
  const rejectCall = useCallback(() => {
    if (dataConnRef.current) {
      dataConnRef.current.send({ type: 'call-end' });
    }
    cleanupCall();
  }, []);

  // Encerrar chamada
  const endCall = useCallback(() => {
    if (dataConnRef.current) {
      dataConnRef.current.send({ type: 'call-end' });
    }
    cleanupCall();
  }, []);

  const cleanupCall = useCallback(() => {
    currentCallRef.current?.close();
    currentCallRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    camStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);

    setCallState({
      active: false,
      isCaller: false,
      peerUsername: '',
      incoming: false,
      isScreenSharing: false,
      micMuted: false,
      camMuted: false,
    });
  }, []);

  // Compartilhar tela
  const toggleScreenShare = useCallback(async () => {
    if (!currentCallRef.current || !localStreamRef.current) return;

    if (callState.isScreenSharing) {
      // Voltar para câmera
      if (camStreamRef.current) {
        const videoTrack = camStreamRef.current.getVideoTracks()[0];
        const sender = currentCallRef.current.peerConnection
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        setLocalStream(camStreamRef.current);
        localStreamRef.current = camStreamRef.current;
      }
      setCallState((prev) => ({ ...prev, isScreenSharing: false }));
    } else {
      // Iniciar compartilhamento de tela
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = currentCallRef.current.peerConnection
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setLocalStream(screenStream);
        localStreamRef.current = screenStream;
        setCallState((prev) => ({ ...prev, isScreenSharing: true }));
      } catch (err) {
        console.warn('Compartilhamento de tela cancelado ou falhou:', err);
      }
    }
  }, [callState.isScreenSharing]);

  // Alternar microfone
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setCallState((prev) => ({ ...prev, micMuted: !audioTrack.enabled }));
    }
  }, []);

  // Alternar câmera
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCallState((prev) => ({ ...prev, camMuted: !videoTrack.enabled }));
    }
  }, []);

  // Enviar mensagem de chat
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !username) return;
      const msg: ChatMessage = {
        id: String(Date.now()),
        sender: username,
        content: content.trim(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, msg]);

      if (dataConnRef.current && dataConnRef.current.open) {
        dataConnRef.current.send({
          type: 'chat',
          sender: username,
          content: content.trim(),
        });
      }
    },
    [username]
  );

  return {
    peerId,
    isReady,
    callState,
    localStream,
    remoteStream,
    messages,
    callUser,
    answerCall,
    rejectCall,
    endCall,
    toggleScreenShare,
    toggleMic,
    toggleCamera,
    sendMessage,
  };
}
