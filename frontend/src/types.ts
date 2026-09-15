export interface UserProfile {
  username: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isSystem?: boolean;
}

export interface CallState {
  active: boolean;
  isCaller: boolean;
  peerUsername: string;
  incoming: boolean;
  isScreenSharing: boolean;
  micMuted: boolean;
  camMuted: boolean;
}

export interface Friend {
  username: string;
  lastSeen?: string;
}

export interface GroupRoom {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  status?: string;
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
}
