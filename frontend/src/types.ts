export type ThemeId = 'discord' | 'oled' | 'midnight' | 'cyberpunk' | 'matrix';
export type AccentColor = 'blurple' | 'emerald' | 'cyan' | 'rose' | 'amber';

export interface ChatAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export interface UserSettings {
  avatar?: string;
  theme: ThemeId;
  accent: AccentColor;
  nameFont?: string;
  nameColor?: string;
}

export interface UserProfile {
  username: string;
  avatar?: string;
  nameFont?: string;
  nameColor?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  recipient?: string;
  isPrivate?: boolean;
  groupId?: string;
  avatar?: string;
  nameFont?: string;
  nameColor?: string;
  content: string;
  file?: ChatAttachment;
  time: string;
  channelId?: string;
  isSystem?: boolean;
}

export interface TextChannel {
  id: string;
  name: string;
  desc: string;
}

export interface VoiceChannel {
  id: string;
  name: string;
  desc: string;
}

export interface CustomGroup {
  id: string;
  name: string;
  icon: string;
  members: string[]; // usernames
  createdBy: string;
  createdAt: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  emoji: string;
  category?: string;
  customDataUrl?: string;
}

export interface PlayedSoundNotification {
  soundId: string;
  soundName: string;
  emoji: string;
  sender: string;
  timestamp: number;
}

export interface CallState {
  active: boolean;
  isCaller: boolean;
  peerUsername: string;
  peerAvatar?: string;
  peerNameFont?: string;
  peerNameColor?: string;
  incoming: boolean;
  isScreenSharing: boolean;
  micMuted: boolean;
  camMuted: boolean;
  groupId?: string;
  groupName?: string;
}

export interface Friend {
  username: string;
  avatar?: string;
  nameFont?: string;
  nameColor?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export type ActiveView =
  | { type: 'channel'; id: string }
  | { type: 'dm'; friendUsername: string }
  | { type: 'voice'; roomId: string }
  | { type: 'group'; groupId: string };

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
