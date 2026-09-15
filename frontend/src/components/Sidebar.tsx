import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Plus, LogOut, Search, UserPlus, Hash } from 'lucide-react';
import { User, Friendship, Group } from '../types';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import clsx from 'clsx';

export type ChatTarget = { type: 'dm'; user: User } | { type: 'group'; group: Group };

interface SidebarProps {
  onSelect: (target: ChatTarget) => void;
  selected: ChatTarget | null;
  onCall: (user: User) => void;
}

export default function Sidebar({ onSelect, selected, onCall }: SidebarProps) {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [tab, setTab] = useState<'friends' | 'groups'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const loadFriends = async () => {
    const res = await api.get('/friends');
    setFriends(res.data);
  };

  const loadRequests = async () => {
    const res = await api.get('/friends/requests');
    setRequests(res.data);
  };

  const loadGroups = async () => {
    const res = await api.get('/groups');
    setGroups(res.data);
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
    loadGroups();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('user-status-change', ({ userId, status }: { userId: string; status: string }) => {
      setStatusMap(prev => ({ ...prev, [userId]: status }));
    });
    return () => { socket.off('user-status-change'); };
  }, [socket]);

  const search = async () => {
    if (!searchQ.trim()) return;
    const res = await api.get(`/friends/search?q=${searchQ}`);
    setSearchResults(res.data);
  };

  const sendRequest = async (addresseeId: string) => {
    await api.post('/friends/request', { addresseeId });
    setSearchResults([]);
    setSearchQ('');
    setShowSearch(false);
  };

  const acceptRequest = async (friendshipId: string) => {
    await api.post('/friends/accept', { friendshipId });
    loadRequests();
    loadFriends();
  };

  const rejectRequest = async (friendshipId: string) => {
    await api.post('/friends/reject', { friendshipId });
    loadRequests();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.post('/groups', { name: newGroupName });
    setNewGroupName('');
    setShowNewGroup(false);
    loadGroups();
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    await api.post('/groups/join', { inviteCode: joinCode });
    setJoinCode('');
    setShowJoinGroup(false);
    loadGroups();
  };

  const getStatus = (userId: string, defaultStatus = 'offline') => statusMap[userId] || defaultStatus;

  const statusDot = (status: string) => (
    <span className={clsx(
      'inline-block w-2.5 h-2.5 rounded-full border-2 border-dark-800',
      status === 'online' ? 'bg-green-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
    )} />
  );

  return (
    <div className="w-72 bg-dark-900 flex flex-col border-r border-dark-700 h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            SS
          </div>
          <span className="font-bold text-white text-lg">ScreenShare Hub</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTab('friends')}
            className={clsx('flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'friends' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-dark-700')}
          >
            <Users className="w-4 h-4 inline mr-1" />Amigos
          </button>
          <button
            onClick={() => setTab('groups')}
            className={clsx('flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'groups' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-dark-700')}
          >
            <Hash className="w-4 h-4 inline mr-1" />Grupos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {tab === 'friends' && (
          <>
            {/* Pedidos pendentes */}
            {requests.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 uppercase font-semibold px-2 mb-2">Pedidos pendentes ({requests.length})</p>
                {requests.map(req => (
                  <div key={req.friendship_id} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-dark-800 mb-1">
                    <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {req.username[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-white truncate">{req.username}</span>
                    <button onClick={() => acceptRequest(req.friendship_id)} className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded bg-green-900/30">✓</button>
                    <button onClick={() => rejectRequest(req.friendship_id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-900/30">✗</button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 uppercase font-semibold px-2 mb-2">Amigos ({friends.length})</p>
            {friends.map(f => (
              <div
                key={f.id}
                onClick={() => onSelect({ type: 'dm', user: f })}
                className={clsx(
                  'flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors group',
                  selected?.type === 'dm' && selected.user.id === f.id ? 'bg-dark-700' : 'hover:bg-dark-800'
                )}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {f.username[0].toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5">{statusDot(getStatus(f.id, f.status || 'offline'))}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{f.username}</p>
                  <p className="text-xs text-gray-500">{getStatus(f.id, f.status || 'offline')}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onCall(f); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 transition-all"
                  title="Ligar"
                >
                  📹
                </button>
              </div>
            ))}
          </>
        )}

        {tab === 'groups' && (
          <>
            <p className="text-xs text-gray-500 uppercase font-semibold px-2 mb-2">Grupos ({groups.length})</p>
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => onSelect({ type: 'group', group: g })}
                className={clsx(
                  'flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors',
                  selected?.type === 'group' && selected.group.id === g.id ? 'bg-dark-700' : 'hover:bg-dark-800'
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-700 flex items-center justify-center text-white text-sm font-bold">
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{g.name}</p>
                  <p className="text-xs text-gray-500">código: {g.invite_code}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-dark-700 space-y-2">
        {tab === 'friends' && (
          <>
            <button onClick={() => setShowSearch(!showSearch)} className="w-full flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-gray-300 transition-colors">
              <UserPlus className="w-4 h-4" /> Adicionar amigo
            </button>
            {showSearch && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Nome de usuário" className="flex-1 bg-dark-800 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <button onClick={search} className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"><Search className="w-4 h-4" /></button>
                </div>
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 bg-dark-800 rounded-lg">
                    <span className="flex-1 text-sm text-white">{u.username}</span>
                    <button onClick={() => sendRequest(u.id)} className="text-brand-400 hover:text-brand-300 text-xs">Adicionar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'groups' && (
          <>
            <button onClick={() => setShowNewGroup(!showNewGroup)} className="w-full flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-gray-300 transition-colors">
              <Plus className="w-4 h-4" /> Criar grupo
            </button>
            {showNewGroup && (
              <div className="flex gap-2">
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createGroup()} placeholder="Nome do grupo" className="flex-1 bg-dark-800 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none" />
                <button onClick={createGroup} className="bg-brand-600 hover:bg-brand-700 text-white px-3 rounded-lg text-sm transition-colors">+</button>
              </div>
            )}
            <button onClick={() => setShowJoinGroup(!showJoinGroup)} className="w-full flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-gray-300 transition-colors">
              <Hash className="w-4 h-4" /> Entrar em grupo
            </button>
            {showJoinGroup && (
              <div className="flex gap-2">
                <input value={joinCode} onChange={e => setJoinCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && joinGroup()} placeholder="Código de convite" className="flex-1 bg-dark-800 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none" />
                <button onClick={joinGroup} className="bg-brand-600 hover:bg-brand-700 text-white px-3 rounded-lg text-sm transition-colors">→</button>
              </div>
            )}
          </>
        )}

        {/* Current user */}
        <div className="flex items-center gap-2 px-2 pt-1">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-dark-900" />
          </div>
          <span className="flex-1 text-sm text-white font-medium truncate">{user?.username}</span>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
