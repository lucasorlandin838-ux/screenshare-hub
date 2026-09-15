import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { ChatMessage, CallState } from '../types';

export function sanitizePeerId(username: string): string {
  return 'hub_' + username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

// Cria faixa de vídeo virtual se não tiver webcam (garante negociação WebRTC em qualquer aparelho)
function createBlankVideoTrack(width = 640, height = 480): MediaStreamTrack {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Câmera Desativada', width / 2, height / 2);
  }
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(5) : (canvas as any).mozCaptureStream(5);
  return stream.getVideoTracks()[0];
}

// Configuração completa de STUN e TURN para funcionar em redes 4G/5G de celular
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:standard.relay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:standard.relay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:standard.relay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export function usePeerCall(username: string | null) {
  const [peerId, setPeerId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>({
    active: false,
    isCaller: false,
    peerUsername: '',
    incoming: false,
    isScreenSharing: false,
    micMuted: false,
    camMuted: false,
  });

  const [remoteIsSharingScreen, setRemoteIsSharingScreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const camTrackRef = useRef<MediaStreamTrack | null>(null);
  const isScreenSharingRef = useRef(false);

  // Inicializar PeerJS com auto-reconexão
  useEffect(() => {
    if (!username) return;

    const myId = sanitizePeerId(username);
    const peer = new Peer(myId, {
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      config: {
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
      },
    });

    peer.on('open', (id) => {
      console.log('[PeerJS] Conectado com ID:', id);
      setPeerId(id);
      setIsReady(true);
      setCallError(null);
    });

    // Auto-reconectar se o celular bloquear a tela ou trocar de rede
    peer.on('disconnected', () => {
      console.log('[PeerJS] Desconectado da rede, tentando reconectar...');
      peer.reconnect();
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
      if (err.type === 'peer-unavailable') {
        setCallError('Usuário não encontrado ou offline. Peça para seu amigo abrir o site primeiro!');
        cleanupCall();
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
      console.log('[PeerJS] Canal de dados conectado com:', conn.peer);
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
      } else if (data?.type === 'screen-share') {
        setRemoteIsSharingScreen(!!data.isSharing);
      }
    });

    conn.on('close', () => {
      console.log('[PeerJS] Canal de dados desconectado');
    });
  }, []);

  // Obter mídia local compatível com celular e desktop
  const getMedia = useCallback(async () => {
    let stream: MediaStream;
    try {
      // No celular ou desktop, tenta pegar microfone e câmera
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      camTrackRef.current = stream.getVideoTracks()[0];
    } catch (e) {
      console.warn('[Mídia] Câmera não permitida ou inexistente. Pegando áudio:', e);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
      } catch (err) {
        console.warn('[Mídia] Microfone também não permitido. Criando stream base:', err);
        stream = new MediaStream();
      }
      // Adiciona faixa de vídeo virtual para garantir negociação do canal de vídeo
      const blankTrack = createBlankVideoTrack();
      stream.addTrack(blankTrack);
      camTrackRef.current = blankTrack;
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // Tratar stream remoto
  const handleRemoteStream = useCallback((remote: MediaStream) => {
    console.log('[PeerJS] Stream remoto recebido. Tracks:', remote.getTracks().map(t => `${t.kind}:${t.readyState}`));
    setRemoteStream(remote);

    remote.onaddtrack = () => {
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    remote.getVideoTracks().forEach((track) => {
      track.onunmute = () => {
        setRemoteStream(new MediaStream(remote.getTracks()));
      };
    });
  }, []);

  // Iniciar chamada para um amigo
  const callUser = useCallback(
    async (targetUsername: string) => {
      if (!peerRef.current || !username) return;
      setCallError(null);
      const targetId = sanitizePeerId(targetUsername);

      const stream = await getMedia();

      // Conexão de dados
      const conn = peerRef.current.connect(targetId, { reliable: true });
      dataConnRef.current = conn;
      setupDataConnection(conn);

      // Chamada de mídia
      console.log('[PeerJS] Chamando usuário:', targetId);
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
        handleRemoteStream(remote);
      });

      call.on('close', () => cleanupCall());
      call.on('error', (e) => {
        console.warn('[PeerJS] Erro na chamada:', e);
        setCallError('Não foi possível conectar ao seu amigo. Verifique se ele está com o site aberto!');
        cleanupCall();
      });
    },
    [username, getMedia, setupDataConnection, handleRemoteStream]
  );

  // Atender chamada
  const answerCall = useCallback(async () => {
    if (!currentCallRef.current || !peerRef.current) return;
    setCallError(null);
    const stream = await getMedia();

    if (!dataConnRef.current) {
      const targetId = currentCallRef.current.peer;
      const conn = peerRef.current.connect(targetId, { reliable: true });
      dataConnRef.current = conn;
      setupDataConnection(conn);
    }

    console.log('[PeerJS] Atendendo chamada de:', currentCallRef.current.peer);
    currentCallRef.current.answer(stream);

    setCallState((prev) => ({
      ...prev,
      active: true,
      incoming: false,
    }));

    currentCallRef.current.on('stream', (remote) => {
      handleRemoteStream(remote);
    });

    currentCallRef.current.on('close', () => cleanupCall());
    currentCallRef.current.on('error', (e) => {
      console.warn('[PeerJS] Erro na chamada:', e);
      cleanupCall();
    });
  }, [getMedia, setupDataConnection, handleRemoteStream]);

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
    camTrackRef.current = null;
    isScreenSharingRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteIsSharingScreen(false);

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

  // Alternar Compartilhamento de Tela
  const toggleScreenShare = useCallback(async () => {
    const call = currentCallRef.current;
    if (!call || !localStreamRef.current) return;

    const pc = call.peerConnection;
    if (!pc) return;

    if (isScreenSharingRef.current) {
      const fallbackTrack = camTrackRef.current || createBlankVideoTrack();

      const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video' || s.track === null);
      if (videoSender) {
        await videoSender.replaceTrack(fallbackTrack);
      }

      const currentTracks = localStreamRef.current.getTracks().filter((t) => t.kind !== 'video');
      const newStream = new MediaStream([...currentTracks, fallbackTrack]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);

      isScreenSharingRef.current = false;
      setCallState((prev) => ({ ...prev, isScreenSharing: false }));

      dataConnRef.current?.send({ type: 'screen-share', isSharing: false });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenVideoTrack = screenStream.getVideoTracks()[0];

        let videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (!videoSender) {
          videoSender = pc.getSenders().find((s) => s.track?.kind !== 'audio');
        }

        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          pc.addTrack(screenVideoTrack, screenStream);
        }

        screenVideoTrack.onended = () => {
          if (isScreenSharingRef.current) {
            toggleScreenShare();
          }
        };

        const audioTracks = localStreamRef.current.getAudioTracks();
        const newStream = new MediaStream([...audioTracks, screenVideoTrack]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);

        isScreenSharingRef.current = true;
        setCallState((prev) => ({ ...prev, isScreenSharing: true }));

        dataConnRef.current?.send({ type: 'screen-share', isSharing: true });
      } catch (err) {
        console.warn('[ScreenShare] Cancelado ou erro ao capturar tela:', err);
      }
    }
  }, []);

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
    callError,
    callState,
    remoteIsSharingScreen,
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
