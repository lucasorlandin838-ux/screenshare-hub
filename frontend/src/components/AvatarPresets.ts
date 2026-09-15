export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'gamer',
    name: 'Gamer Neon',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer7&backgroundColor=5865f2',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberJack&backgroundColor=06b6d4',
  },
  {
    id: 'ninja',
    name: 'Shadow Ninja',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NinjaDark&backgroundColor=18181b',
  },
  {
    id: 'robot',
    name: 'Mecha Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MechaBot4&backgroundColor=10b981',
  },
  {
    id: 'cat',
    name: 'Neko Cat',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=KittyPower&backgroundColor=f43f5e',
  },
  {
    id: 'astronaut',
    name: 'Cosmonauta',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=StarExplorer&backgroundColor=8b5cf6',
  },
  {
    id: 'wizard',
    name: 'Mago Roxo',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=VoidWizard&backgroundColor=a855f7',
  },
  {
    id: 'fire',
    name: 'Fênix Solar',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=FirePhoenix&backgroundColor=f59e0b',
  },
];
