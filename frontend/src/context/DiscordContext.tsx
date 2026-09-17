import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { inDiscord, setupDiscord, DiscordSetupResult } from '../discord/discordSdk';

interface DiscordContextValue {
  isDiscord: boolean;
  loading: boolean;
  discordUser: DiscordSetupResult | null;
  error: string | null;
}

const DiscordContext = createContext<DiscordContextValue>({
  isDiscord: false,
  loading: false,
  discordUser: null,
  error: null,
});

export function DiscordProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(inDiscord);
  const [discordUser, setDiscordUser] = useState<DiscordSetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inDiscord) return;

    setupDiscord()
      .then((result) => {
        setDiscordUser(result);
        // Salva o username do Discord no localStorage para o hub usar
        const hubName = result.user.global_name || result.user.username;
        localStorage.setItem('hub_username', hubName.toLowerCase().replace(/[^a-z0-9_]/g, ''));
        localStorage.setItem('hub_avatar', result.user.avatar
          ? `https://cdn.discordapp.com/avatars/${result.user.id}/${result.user.avatar}.png?size=64`
          : '🎮');
      })
      .catch((e) => {
        console.error('[Discord] Falha no setup:', e);
        setError('Falha ao conectar com o Discord. Tente reabrir a atividade.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DiscordContext.Provider value={{ isDiscord: inDiscord, loading, discordUser, error }}>
      {children}
    </DiscordContext.Provider>
  );
}

export function useDiscord() {
  return useContext(DiscordContext);
}
