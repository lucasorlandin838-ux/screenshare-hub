export interface User {
  id: string;
  username: string;
  email?: string;
  status?: 'online' | 'offline' | 'busy';
}

export interface Friendship {
  friendship_id: string;
  id: string;
  username: string;
  status?: string;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
  receiverId?: string;
  groupId?: string;
}

export interface CallState {
  active: boolean;
  peerId?: string;
  peerUsername?: string;
  incoming?: boolean;
  signal?: any;
  isScreenShare?: boolean;
}
