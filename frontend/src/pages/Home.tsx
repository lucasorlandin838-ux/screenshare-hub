import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { ChatTarget } from '../components/Sidebar';
import Chat from '../components/Chat';
import VideoCall from '../components/VideoCall';
import IncomingCallModal from '../components/IncomingCallModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Message, User, CallState } from '../types';
import api from '../api';
import { Users } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [selected, setSelected] = useState<ChatTarget | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callState, setCallState] = useState<CallState>({ active: false });

  const { localStream, remoteStream, isScreenSharing, startCall, answerCall,
    handleCallAccepted, toggleScreenShare, toggleMic, toggleCamera, destroyPeer } = useWebRTC(socket);

  // Load message history when selecting a chat
  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    const load = async () => {
      if (selected.type === 'dm') {
        const res = await api.get(`/messages/dm/${selected.user.id}`);
        setMessages(res.data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderUsername: m.sender_username,
          content: m.content,
          createdAt: m.created_at,
        })));
      } else {
        const res = await api.get(`/messages/group/${selected.group.id}`);
        setMessages(res.data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderUsername: m.sender_username,
          content: m.content,
          createdAt: m.created_at,
        })));
      }
    };
    load();
  }, [selected]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receive-dm', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('receive-group-message', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('incoming-call', ({ from, fromUsername, signal }: any) => {
      setCallState({ active: false, incoming: true, peerId: from, peerUsername: fromUsername, signal });
    });

    socket.on('call-accepted', ({ from, signal }: any) => {
      handleCallAccepted(signal);
      setCallState(prev => ({ ...prev, active: true, incoming: false }));
    });

    socket.on('call-rejected', () => {
      destroyPeer();
      setCallState({ active: false });
      alert('Chamada recusada');
    });

    socket.on('call-ended', () => {
      destroyPeer();
      setCallState({ active: false });
    });

    socket.on('call-failed', ({ reason }: any) => {
      destroyPeer();
      setCallState({ active: false });
      alert(`Chamada falhou: ${reason}`);
    });

    return () => {
      socket.off('receive-dm');
      socket.off('receive-group-message');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('call-failed');
    };
  }, [socket, handleCallAccepted, destroyPeer]);

  const handleSend = (content: string) => {
    if (!socket || !selected) return;
    if (selected.type === 'dm') {
      socket.emit('send-dm', { receiverId: selected.user.id, content });
    } else {
      socket.emit('send-group-message', { groupId: selected.group.id, content });
    }
  };

  const handleCall = async (friendUser: User) => {
    setCallState({ active: true, peerId: friendUser.id, peerUsername: friendUser.username });
    await startCall(friendUser.id);
  };

  const handleAcceptCall = async () => {
    if (!callState.peerId || !callState.signal) return;
    setCallState(prev => ({ ...prev, active: true, incoming: false }));
    await answerCall(callState.peerId, callState.signal);
  };

  const handleRejectCall = () => {
    if (!callState.peerId) return;
    socket?.emit('reject-call', { targetId: callState.peerId });
    setCallState({ active: false });
  };

  const handleEndCall = () => {
    if (callState.peerId) {
      socket?.emit('end-call', { targetId: callState.peerId });
    }
    destroyPeer();
    setCallState({ active: false });
  };

  return (
    <div className="flex h-screen bg-dark-850 overflow-hidden">
      <Sidebar onSelect={setSelected} selected={selected} onCall={handleCall} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Header */}
            <div className="h-14 border-b border-dark-700 flex items-center px-4 gap-3 bg-dark-900">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold">
                {selected.type === 'dm' ? selected.user.username[0].toUpperCase() : '#'}
              </div>
              <span className="font-semibold text-white">
                {selected.type === 'dm' ? selected.user.username : selected.group.name}
              </span>
              {selected.type === 'dm' && (
                <button
                  onClick={() => handleCall(selected.user)}
                  className="ml-auto bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                >
                  📹 Ligar
                </button>
              )}
            </div>
            {/* Chat */}
            <div className="flex-1 min-h-0">
              <Chat
                messages={messages}
                onSend={handleSend}
                placeholder={selected.type === 'dm' ? `Mensagem para ${selected.user.username}` : `Mensagem em #${selected.group.name}`}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <Users className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Selecione um amigo ou grupo</p>
              <p className="text-sm mt-1">para começar a conversar</p>
            </div>
          </div>
        )}
      </div>

      {/* Incoming call modal */}
      {callState.incoming && !callState.active && (
        <IncomingCallModal
          fromUsername={callState.peerUsername || 'Desconhecido'}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active call */}
      {callState.active && (
        <VideoCall
          localStream={localStream}
          remoteStream={remoteStream}
          peerUsername={callState.peerUsername || 'Desconhecido'}
          isScreenSharing={isScreenSharing}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreen={toggleScreenShare}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
}
