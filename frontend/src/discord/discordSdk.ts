import { DiscordSDK, DiscordSDKMock, RPCCloseCodes } from '@discord/embedded-app-sdk';

// ══════════════════════════════════════════════════════════════════════════════
//  🔑 COLOQUE SEU CLIENT ID AQUI!
//  → Acesse discord.com/developers/applications
//  → Abra seu app "ScreenShare Hub" → OAuth2 → Client ID
// ══════════════════════════════════════════════════════════════════════════════
export const DISCORD_CLIENT_ID = '1549941645011849287';

// Detecta se está rodando dentro de um iframe do Discord
function isInDiscordFrame(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('frame_id')) return true;
    if (window.self !== window.top) return true;
    return false;
  } catch {
    return true; // SecurityError = provavelmente em iframe cross-origin
  }
}

export const inDiscord = isInDiscordFrame();

// Usa SDK real dentro do Discord, mock fora
export const discordSdk: DiscordSDK | DiscordSDKMock = inDiscord
  ? new DiscordSDK(DISCORD_CLIENT_ID)
  : new DiscordSDKMock(DISCORD_CLIENT_ID, null, null, null);

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

export interface DiscordSetupResult {
  user: DiscordUser;
  accessToken: string;
  guildId: string | null;
  channelId: string | null;
}

/**
 * Faz todo o handshake com o Discord:
 * 1. Aguarda o SDK ficar pronto
 * 2. Pede autorização OAuth2
 * 3. Troca o code por token
 * 4. Autentica e retorna dados do usuário
 */
export async function setupDiscord(): Promise<DiscordSetupResult> {
  await discordSdk.ready();

  // Step 1: Autorizar (abre popup de permissões se necessário)
  const { code } = await discordSdk.commands.authorize({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify', 'guilds'],
  });

  // Step 2: Trocar code por token (via backend simples ou proxy)
  // Como usamos apenas frontend, usamos o proxy do Discord Activity (/api/token)
  let accessToken = '';
  try {
    const res = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const data = await res.json();
      accessToken = data.access_token || '';
    }
  } catch {
    // Se não tiver backend, continua sem token (modo limitado)
    console.warn('[Discord] Sem backend para trocar o code por token. Usando autenticação limitada.');
  }

  // Step 3: Autenticar com o token (ou sem ele no modo mock)
  let user: DiscordUser = {
    id: 'local',
    username: 'Usuário Discord',
    discriminator: '0',
    avatar: null,
    global_name: null,
  };

  if (accessToken) {
    try {
      const authResult = await (discordSdk as DiscordSDK).commands.authenticate({ access_token: accessToken });
      user = authResult.user as DiscordUser;
    } catch (e) {
      console.warn('[Discord] Autenticação falhou:', e);
    }
  } else if (!inDiscord) {
    // Modo de desenvolvimento — usa mock
    user = {
      id: 'dev-user',
      username: 'dev_local',
      discriminator: '0',
      avatar: null,
      global_name: 'Dev Local',
    };
  }

  const guildId = 'guildId' in discordSdk ? (discordSdk as any).guildId : null;
  const channelId = 'channelId' in discordSdk ? (discordSdk as any).channelId : null;

  return { user, accessToken, guildId, channelId };
}
