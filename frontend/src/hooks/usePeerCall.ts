import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { ChatMessage, CallState } from '../types';

export function sanitizePeerId(name: string): string {
  return 'hub_' + name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

// Cria faixa de vídeo virtual silenciosa caso o usuário não tenha webcam
function createBlankVideoTrack(width = 640, height = 480): MediaStreamTrack {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('Câmera Desativada', width / 2, height / 2);
  }
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(5) : (canvas as any).mozCaptureStream(5);
  return stream.getVideoTracks()[0];
}

// Toca som de chamada usando a Web Audio API nativa (sem depender de arquivo externo)
function playRingBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.log('[Ring] Erro áudio:', e);
  }
}

// Configuração STUN e TURN para atravessar 4G/5G de celular e Wi-Fi doméstico
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
  const [actualPeerId, setActualPeerId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [callError, setCallError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

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
  const ringIntervalRef = useRef<any>(null);

  // Inicializa o PeerJS com tratamento inteligente de ID ocupado
  useEffect(() => {
    if (!username) return;

    let isSubscribed = true;
    setConnectionStatus('connecting');

    const cleanBase = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    let candidateId = 'hub_' + cleanBase;

    function initPeer(idToTry: string) {
      console.log('[PeerJS] Tentando registrar ID:', idToTry);
      const peer = new Peer(idToTry, {
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: {
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 10,
        },
      });

      peer.on('open', (id) => {
        if (!isSubscribed) return;
        console.log('[PeerJS] Conectado e registrado no servidor:', id);
        setActualPeerId(id);
        setConnectionStatus('connected');
        setCallError(null);
      });

      peer.on('disconnected', () => {
        console.log('[PeerJS] Desconectado, reconectando...');
        peer.reconnect();
      });

      // Receber chamada
      peer.on('call', (incomingCall) => {
        console.log('[PeerJS] Chamada recebida de:', incomingCall.peer);
        const callerName = incomingCall.peer.replace('hub_', '').split('_')[0];
        currentCallRef.current = incomingCall;

        setCallState((prev) => ({
          ...prev,
          incoming: true,
          isCaller: false,
          peerUsername: callerName,
        }));

        // Tocar som de chamada a cada 2 segundos
        playRingBeep();
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = setInterval(playRingBeep, 2200);
      });

      // Receber conexão de dados (chat / sinais)
      peer.on('connection', (conn) => {
        dataConnRef.current = conn;
        setupDataConnection(conn);
      });

      peer.on('error', (err) => {
        console.warn('[PeerJS] Erro do servidor:', err.type, err.message);
        if (err.type === 'unavailable-id') {
          // O ID já está registrado (por ex. aba anterior ainda aberta no servidor)
          // Tenta com sufixo aleatório
          peer.destroy();
          const suffix = Math.floor(100 + Math.random() * 900);
          const nextId = 'hub_' + cleanBase + '_' + suffix;
          console.log('[PeerJS] ID ocupado. Tentando ID alternativo:', nextId);
          initPeer(nextId);
          return;
        }

        if (err.type === 'peer-unavailable') {
          setCallError('Usuário não encontrado ou offline. Peça para ele abrir o site!');
          cleanupCall();
        } else {
          setConnectionStatus('error');
        }
      });

      peerRef.current = peer;
    }

    initPeer(candidateId);

    return () => {
      isSubscribed = false;
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      peerRef.current?.destroy();
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

  // Obter microfone e câmera com fallback seguro
  const getMedia = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      camTrackRef.current = stream.getVideoTracks()[0];
    } catch (e) {
      console.warn('[Mídia] Câmera indisponível ou bloqueada. Criando faixa de áudio e vídeo virtual:', e);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
      } catch (err) {
        console.warn('[Mídia] Microfone também não permitido. Criando stream mudo:', err);
        stream = new MediaStream();
      }
      const blankTrack = createBlankVideoTrack();
      stream.addTrack(blankTrack);
      camTrackRef.current = blankTrack;
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const handleRemoteStream = useCallback((remote: MediaStream) => {
    console.log('[PeerJS] Stream remoto conectado! Tracks:', remote.getTracks().map(t => `${t.kind}:${t.readyState}`));
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

  // Ligar diretamente para um amigo por nome
  const callUser = useCallback(
    async (targetUsername: string) => {
      if (!peerRef.current || !username) return;
      setCallError(null);

      const cleanTarget = targetUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      if (!cleanTarget) return;

      const targetId = 'hub_' + cleanTarget;
      console.log('[PeerJS] Iniciando chamada para:', targetId);

      try {
        const stream = await getMedia();

        const conn = peerRef.current.connect(targetId, { reliable: true });
        dataConnRef.current = conn;
        setupDataConnection(conn);

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
          console.warn('[PeerJS] Erro ao ligar para o par:', e);
          setCallError('O usuário "' + targetUsername + '" não atendeu ou não está online com o site aberto.');
          cleanupCall();
        });
      } catch (err) {
        console.error('[PeerJS] Erro ao iniciar chamada:', err);
        setCallError('Erro ao acessar microfone/câmera. Verifique as permissões no navegador!');
      }
    },
    [username, getMedia, setupDataConnection, handleRemoteStream]
  );

  // Atender chamada
  const answerCall = useCallback(async () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }

    if (!currentCallRef.current || !peerRef.current) return;
    setCallError(null);

    try {
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
        console.warn('[PeerJS] Erro na conexão:', e);
        cleanupCall();
      });
    } catch (err) {
      console.error('[PeerJS] Erro ao atender:', err);
      setCallError('Erro ao acessar microfone/câmera ao atender.');
    }
  }, [getMedia, setupDataConnection, handleRemoteStream]);

  // Rejeitar chamada
  const rejectCall = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.send({ type: 'call-end' });
    }
    cleanupCall();
  }, []);

  // Encerrar chamada
  const endCall = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (dataConnRef.current) {
      dataConnRef.current.send({ type: 'call-end' });
    }
    cleanupCall();
  }, []);

  const cleanupCall = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }

    currentCallRef.current?.close();
    currentCallRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    camTrackRef.current = null;
    isScreenSharingRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteIsSharingScreen(false);
    setCurrentRoom(null);

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

  // Entrar em uma Sala / Canal de Voz e Tela (estilo Discord)
  // Conecta imediatamente os amigos que entrarem na mesma sala!
  const joinRoom = useCallback(
    async (roomName: string) => {
      if (!peerRef.current || !username) return;
      const cleanRoom = roomName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      if (!cleanRoom) return;

      console.log('[Room] Entrando na sala:', cleanRoom);
      setCurrentRoom(cleanRoom);
      setCallError(null);

      // Na sala, chamamos o par da sala ou anunciamos
      callUser(cleanRoom);
    },
    [username, callUser]
  );

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
    actualPeerId,
    connectionStatus,
    callError,
    currentRoom,
    callState,
    remoteIsSharingScreen,
    localStream,
    remoteStream,
    messages,
    callUser,
    answerCall,
    rejectCall,
    endCall,
    joinRoom,
    toggleScreenShare,
    toggleMic,
    toggleCamera,
    sendMessage,
  };
}
