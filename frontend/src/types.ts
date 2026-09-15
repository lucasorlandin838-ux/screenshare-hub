export type ThemeId = 'discord' | 'oled' | 'midnight' | 'cyberpunk' | 'matrix';
export type AccentColor = 'blurple' | 'emerald' | 'cyan' | 'rose' | 'amber';

export interface UserSettings {
  avatar?: string;
  theme: ThemeId;
  accent: AccentColor;
}

export interface UserProfile {
  username: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  content: string;
  time: string;
  channelId?: string;
  isSystem?: boolean;
}

export interface TextChannel {
  id: string;
  name: string;
  desc: string;
}

export interface CallState {
  active: boolean;
  isCaller: boolean;
  peerUsername: string;
  peerAvatar?: string;
  incoming: boolean;
  isScreenSharing: boolean;
  micMuted: boolean;
  camMuted: boolean;
}

export interface Friend {
  username: string;
  avatar?: string;
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
  avatar?: string;
  email?: string;
  status?: string;
}

export interface Friendship {
  friendship_id: string;
  id: string;
  username: string;
  avatar?: string;
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
  senderAvatar?: string;
  content: string;
  createdAt: string;
}
