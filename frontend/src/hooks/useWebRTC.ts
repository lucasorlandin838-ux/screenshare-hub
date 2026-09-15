import { useRef, useState, useCallback, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { Socket } from 'socket.io-client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC(socket: Socket | null) {
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  const destroyPeer = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
  }, []);

  const getUserMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // Initiate a call (caller)
  const startCall = useCallback(async (targetId: string) => {
    const stream = await getUserMedia();
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('signal', (signal) => {
      socket?.emit('call-user', { targetId, signal });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
    });

    peer.on('close', destroyPeer);
    peer.on('error', (err) => { console.error('Peer error:', err); destroyPeer(); });

    peerRef.current = peer;
    return peer;
  }, [socket, getUserMedia, destroyPeer]);

  // Answer an incoming call (receiver)
  const answerCall = useCallback(async (callerId: string, incomingSignal: any) => {
    const stream = await getUserMedia();
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('signal', (signal) => {
      socket?.emit('accept-call', { targetId: callerId, signal });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
    });

    peer.on('close', destroyPeer);
    peer.on('error', (err) => { console.error('Peer error:', err); destroyPeer(); });

    peer.signal(incomingSignal);
    peerRef.current = peer;
    return peer;
  }, [socket, getUserMedia, destroyPeer]);

  // When caller receives answer signal
  const handleCallAccepted = useCallback((signal: any) => {
    peerRef.current?.signal(signal);
  }, []);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!peerRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      // Stop screen share, revert to camera
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const camStream = await getUserMedia();
      const videoTrack = camStream.getVideoTracks()[0];
      const sender = (peerRef.current as any)._pc?.getSenders?.()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
      sender?.replaceTrack(videoTrack);
      setIsScreenSharing(false);
    } else {
      // Start screen share
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      const sender = (peerRef.current as any)._pc?.getSenders?.()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
      await sender?.replaceTrack(screenTrack);
      screenTrack.onended = () => { setIsScreenSharing(false); screenTrackRef.current = null; };
      setIsScreenSharing(true);
    }
  }, [isScreenSharing, getUserMedia]);

  // Toggle mic
  const toggleMic = useCallback((enabled: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = enabled; });
  }, []);

  // Toggle camera
  const toggleCamera = useCallback((enabled: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = enabled; });
  }, []);

  return {
    localStream,
    remoteStream,
    isScreenSharing,
    startCall,
    answerCall,
    handleCallAccepted,
    toggleScreenShare,
    toggleMic,
    toggleCamera,
    destroyPeer,
  };
}
