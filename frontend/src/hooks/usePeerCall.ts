import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { ChatMessage, CallState, ChatAttachment } from '../types';

export function sanitizePeerId(name: string): string {
  return 'hub_' + name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

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

export function usePeerCall(
  username: string | null,
  avatar?: string,
  nameFont?: string,
  nameColor?: string
) {
  const [actualPeerId, setActualPeerId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [callError, setCallError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  // Mapa REAL de amigos online (por padrão nenhum é online até ser verificado)
  const [friendsOnline, setFriendsOnline] = useState<Record<string, boolean>>({});

  const [callState, setCallState] = useState<CallState>({
    active: false,
    isCaller: false,
    peerUsername: '',
    peerAvatar: undefined,
    peerNameFont: undefined,
    peerNameColor: undefined,
    incoming: false,
    isScreenSharing: false,
    micMuted: false,
    camMuted: false,
  });

  const [remoteIsSharingScreen, setRemoteIsSharingScreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hub_chat_messages') || '[]');
    } catch {
      return [];
    }
  });

  const peerRef = useRef<Peer | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const isDialingCallRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const camTrackRef = useRef<MediaStreamTrack | null>(null);
  const isScreenSharingRef = useRef(false);
  const ringIntervalRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('hub_chat_messages', JSON.stringify(messages.slice(-300)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (!username) return;

    let isSubscribed = true;
    setConnectionStatus('connecting');

    const cleanBase = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const candidateId = 'hub_' + cleanBase;

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
        console.log('[PeerJS] Registrado com sucesso:', id);
        setActualPeerId(id);
        setConnectionStatus('connected');
        setCallError(null);
      });

      peer.on('disconnected', () => {
        peer.reconnect();
      });

      peer.on('call', (incomingCall) => {
        console.log('[PeerJS] Chamada recebida de:', incomingCall.peer);
        const callerName = incomingCall.peer.replace('hub_', '').split('_')[0];
        currentCallRef.current = incomingCall;

        // Marca quem ligou como online
        setFriendsOnline((prev) => ({ ...prev, [callerName.toLowerCase()]: true }));

        setCallState((prev) => ({
          ...prev,
          incoming: true,
          isCaller: false,
          peerUsername: callerName,
        }));

        playRingBeep();
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = setInterval(playRingBeep, 2200);
      });

      peer.on('connection', (conn) => {
        dataConnRef.current = conn;
        setupDataConnection(conn);
      });

      peer.on('error', (err) => {
        console.warn('[PeerJS] Erro:', err.type, err.message);
        if (err.type === 'unavailable-id') {
          peer.destroy();
          const suffix = Math.floor(100 + Math.random() * 900);
          const nextId = 'hub_' + cleanBase + '_' + suffix;
          initPeer(nextId);
          return;
        }

        if (err.type === 'peer-unavailable') {
          // Só exibe popup de erro se o usuário estava ativamente ligando para alguém!
          if (isDialingCallRef.current) {
            setCallError('O usuário chamado não está online com o site aberto.');
            cleanupCall();
          }
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
    const peerName = conn.peer.replace('hub_', '').split('_')[0].toLowerCase();

    conn.on('open', () => {
      // Amigo conectado de verdade! Marca como online
      setFriendsOnline((prev) => ({ ...prev, [peerName]: true }));

      conn.send({
        type: 'profile-sync',
        sender: username,
        avatar: avatar,
        nameFont: nameFont,
        nameColor: nameColor,
      });
    });

    conn.on('data', (data: any) => {
      if (data?.sender) {
        setFriendsOnline((prev) => ({ ...prev, [data.sender.toLowerCase()]: true }));
      }

      if (data?.type === 'chat' || data?.type === 'dm') {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()) + Math.random(),
            sender: data.sender,
            recipient: data.recipient,
            isPrivate: !!data.isPrivate,
            avatar: data.avatar,
            nameFont: data.nameFont,
            nameColor: data.nameColor,
            channelId: data.channelId,
            content: data.content,
            file: data.file,
            time: data.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (data?.type === 'profile-sync') {
        setCallState((prev) => ({
          ...prev,
          peerAvatar: data.avatar || prev.peerAvatar,
          peerNameFont: data.nameFont || prev.peerNameFont,
          peerNameColor: data.nameColor || prev.peerNameColor,
        }));
      } else if (data?.type === 'call-end') {
        cleanupCall();
      } else if (data?.type === 'screen-share') {
        setRemoteIsSharingScreen(!!data.isSharing);
      }
    });

    conn.on('close', () => {
      setFriendsOnline((prev) => ({ ...prev, [peerName]: false }));
    });
  }, [username, avatar, nameFont, nameColor]);

  // Função para verificar se um amigo específico está online no PeerJS
  const checkFriendOnline = useCallback(
    (targetUsername: string) => {
      if (!peerRef.current || !peerRef.current.open) return;
      const cleanTarget = targetUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      if (!cleanTarget || cleanTarget === username?.toLowerCase()) return;

      const targetId = 'hub_' + cleanTarget;

      try {
        const testConn = peerRef.current.connect(targetId, { reliable: false });
        testConn.on('open', () => {
          setFriendsOnline((prev) => ({ ...prev, [cleanTarget]: true }));
          testConn.send({ type: 'presence-ping', sender: username });
          setTimeout(() => testConn.close(), 1500);
        });

        testConn.on('error', () => {
          setFriendsOnline((prev) => ({ ...prev, [cleanTarget]: false }));
        });
      } catch {
        setFriendsOnline((prev) => ({ ...prev, [cleanTarget]: false }));
      }
    },
    [username]
  );

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
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
      } catch (err) {
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

  const callUser = useCallback(
    async (targetUsername: string, targetAvatar?: string) => {
      if (!peerRef.current || !username) return;
      setCallError(null);

      const cleanTarget = targetUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      if (!cleanTarget) return;

      const targetId = 'hub_' + cleanTarget;
      isDialingCallRef.current = true;

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
          peerAvatar: targetAvatar,
          incoming: false,
          isScreenSharing: false,
          micMuted: false,
          camMuted: false,
        });

        call.on('stream', (remote) => {
          isDialingCallRef.current = false;
          setFriendsOnline((prev) => ({ ...prev, [cleanTarget]: true }));
          handleRemoteStream(remote);
        });

        call.on('close', () => cleanupCall());
        call.on('error', (e) => {
          isDialingCallRef.current = false;
          setFriendsOnline((prev) => ({ ...prev, [cleanTarget]: false }));
          setCallError('O usuário "' + targetUsername + '" não atendeu ou está offline.');
          cleanupCall();
        });
      } catch (err) {
        isDialingCallRef.current = false;
        setCallError('Erro ao acessar microfone/câmera.');
      }
    },
    [username, getMedia, setupDataConnection, handleRemoteStream]
  );

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
      currentCallRef.current.on('error', () => cleanupCall());
    } catch (err) {
      setCallError('Erro ao atender chamada.');
    }
  }, [getMedia, setupDataConnection, handleRemoteStream]);

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
    isDialingCallRef.current = false;
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

    setCallState({
      active: false,
      isCaller: false,
      peerUsername: '',
      peerAvatar: undefined,
      peerNameFont: undefined,
      peerNameColor: undefined,
      incoming: false,
      isScreenSharing: false,
      micMuted: false,
      camMuted: false,
    });
  }, []);

  const joinRoom = useCallback(
    (roomName: string) => {
      const cleanRoom = roomName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      if (!cleanRoom) return;
      setCurrentRoom(cleanRoom);
      setCallError(null);
    },
    []
  );

  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    cleanupCall();
  }, [cleanupCall]);

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
        console.warn('[ScreenShare] Cancelado:', err);
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setCallState((prev) => ({ ...prev, micMuted: !audioTrack.enabled }));
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCallState((prev) => ({ ...prev, camMuted: !videoTrack.enabled }));
    }
  }, []);

  const sendMessage = useCallback(
    (content: string, channelId?: string, file?: ChatAttachment) => {
      if (!content.trim() && !file) return;
      if (!username) return;

      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const msg: ChatMessage = {
        id: String(Date.now()) + Math.random(),
        sender: username,
        avatar: avatar,
        nameFont: nameFont,
        nameColor: nameColor,
        channelId: channelId,
        content: content.trim(),
        file: file,
        time: timeStr,
      };

      setMessages((prev) => [...prev, msg]);

      if (dataConnRef.current && dataConnRef.current.open) {
        dataConnRef.current.send({
          type: 'chat',
          sender: username,
          avatar: avatar,
          nameFont: nameFont,
          nameColor: nameColor,
          channelId: channelId,
          content: content.trim(),
          file: file,
          time: timeStr,
        });
      }
    },
    [username, avatar, nameFont, nameColor]
  );

  const sendDirectMessage = useCallback(
    (recipient: string, content: string, file?: ChatAttachment) => {
      if (!content.trim() && !file) return;
      if (!username) return;

      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const cleanRecipient = recipient.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

      const msg: ChatMessage = {
        id: String(Date.now()) + Math.random(),
        sender: username,
        recipient: cleanRecipient,
        isPrivate: true,
        avatar: avatar,
        nameFont: nameFont,
        nameColor: nameColor,
        content: content.trim(),
        file: file,
        time: timeStr,
      };

      setMessages((prev) => [...prev, msg]);

      const targetId = 'hub_' + cleanRecipient;
      if (dataConnRef.current && dataConnRef.current.open && dataConnRef.current.peer === targetId) {
        dataConnRef.current.send({
          type: 'dm',
          sender: username,
          recipient: cleanRecipient,
          isPrivate: true,
          avatar: avatar,
          nameFont: nameFont,
          nameColor: nameColor,
          content: content.trim(),
          file: file,
          time: timeStr,
        });
      } else if (peerRef.current) {
        try {
          const conn = peerRef.current.connect(targetId, { reliable: true });
          conn.on('open', () => {
            setFriendsOnline((prev) => ({ ...prev, [cleanRecipient]: true }));
            conn.send({
              type: 'dm',
              sender: username,
              recipient: cleanRecipient,
              isPrivate: true,
              avatar: avatar,
              nameFont: nameFont,
              nameColor: nameColor,
              content: content.trim(),
              file: file,
              time: timeStr,
            });
          });
        } catch (e) {
          console.log('[DM] Erro ao enviar DM:', e);
        }
      }
    },
    [username, avatar, nameFont, nameColor]
  );

  return {
    actualPeerId,
    connectionStatus,
    callError,
    currentRoom,
    callState,
    friendsOnline,
    remoteIsSharingScreen,
    localStream,
    remoteStream,
    messages,
    callUser,
    answerCall,
    rejectCall,
    endCall,
    joinRoom,
    leaveRoom,
    checkFriendOnline,
    toggleScreenShare,
    toggleMic,
    toggleCamera,
    sendMessage,
    sendDirectMessage,
  };
}
