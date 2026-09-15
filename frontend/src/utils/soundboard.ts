export interface SoundItem {
  id: string;
  name: string;
  emoji: string;
  category: 'discord' | 'memes' | 'efeitos' | 'custom';
  description: string;
  customDataUrl?: string;
}

export const SOUNDBOARD_PRESETS: SoundItem[] = [
  {
    id: 'airhorn',
    name: 'Buzina (Airhorn)',
    emoji: '📢',
    category: 'memes',
    description: 'O clássico ar comprimido dos memes / MLG',
  },
  {
    id: 'badumtss',
    name: 'Ba Dum Tss!',
    emoji: '🥁',
    category: 'memes',
    description: 'Piada sem graça ou punchline de stand-up',
  },
  {
    id: 'quack',
    name: 'Pato Quack',
    emoji: '🦆',
    category: 'efeitos',
    description: 'Patinho de borracha engraçado',
  },
  {
    id: 'applause',
    name: 'Palmas & Aplausos',
    emoji: '👏',
    category: 'efeitos',
    description: 'Comemore uma vitória ou jogada linda',
  },
  {
    id: 'discord_ping',
    name: 'Discord Ping',
    emoji: '🔔',
    category: 'discord',
    description: 'Aquele som inconfundível de notificação do Discord',
  },
  {
    id: 'sad_trombone',
    name: 'Trombone Triste',
    emoji: '🎺',
    category: 'memes',
    description: 'Womp womp womp waaa quando alguém perde',
  },
  {
    id: 'level_up',
    name: 'Level Up / GG',
    emoji: '🎮',
    category: 'efeitos',
    description: 'Som retrô 8-bit de conquista gamer',
  },
  {
    id: 'vine_boom',
    name: 'Vine Boom',
    emoji: '💥',
    category: 'memes',
    description: 'Grave dramático e estrondoso dos memes',
  },
  {
    id: 'crickets',
    name: 'Grilos Cri Cri',
    emoji: '🦗',
    category: 'memes',
    description: 'Silêncio constrangedor no canal',
  },
  {
    id: 'discord_join',
    name: 'Discord Entrar',
    emoji: '🚀',
    category: 'discord',
    description: 'Chime agradável de entrada em canal de voz',
  },
  {
    id: 'discord_leave',
    name: 'Discord Sair',
    emoji: '🚪',
    category: 'discord',
    description: 'Chime de desconexão de canal de voz',
  },
];

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        globalAudioCtx = new AudioCtx();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch (e) {
    console.warn('[Soundboard] Erro ao obter AudioContext:', e);
    return null;
  }
}

// Síntese de ruído branco para aplausos, pratos e buzina
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playSound(soundId: string, volume = 0.8, customDataUrl?: string): void {
  // Se for áudio personalizado (arquivo carregado pelo usuário)
  if (customDataUrl) {
    try {
      const audio = new Audio(customDataUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch((e) => console.warn('[Soundboard] Erro ao tocar custom audio:', e));
    } catch (e) {
      console.warn('[Soundboard] Erro customDataUrl:', e);
    }
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, now);
  masterGain.connect(ctx.destination);

  switch (soundId) {
    case 'airhorn': {
      // O clássico Airhorn: explosões rítmicas com acorde de buzina
      const freqs = [233.08, 311.13, 369.99, 466.16]; // Bb3, Eb4, F#4, Bb4
      const bursts = [0, 0.12, 0.24, 0.38];
      const durations = [0.09, 0.09, 0.09, 0.45];

      bursts.forEach((startOffset, idx) => {
        const tStart = now + startOffset;
        const dur = durations[idx];

        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, tStart);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.02, tStart + dur);

          gain.gain.setValueAtTime(0.001, tStart);
          gain.gain.linearRampToValueAtTime(0.12, tStart + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, tStart + dur);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(tStart);
          osc.stop(tStart + dur);
        });
      });
      break;
    }

    case 'badumtss': {
      // Ba (Kick)
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
      kickGain.gain.setValueAtTime(0.4, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.18);

      // Dum (Tom/Snare)
      const dumTime = now + 0.22;
      const dumOsc = ctx.createOscillator();
      const dumGain = ctx.createGain();
      dumOsc.type = 'triangle';
      dumOsc.frequency.setValueAtTime(200, dumTime);
      dumOsc.frequency.exponentialRampToValueAtTime(80, dumTime + 0.15);
      dumGain.gain.setValueAtTime(0.35, dumTime);
      dumGain.gain.exponentialRampToValueAtTime(0.001, dumTime + 0.18);
      dumOsc.connect(dumGain);
      dumGain.connect(masterGain);
      dumOsc.start(dumTime);
      dumOsc.stop(dumTime + 0.18);

      // Tsss (Cymbal splash)
      const tssTime = now + 0.44;
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.6);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5000, tssTime);

      const tssGain = ctx.createGain();
      tssGain.gain.setValueAtTime(0.3, tssTime);
      tssGain.gain.exponentialRampToValueAtTime(0.001, tssTime + 0.6);

      noise.connect(filter);
      filter.connect(tssGain);
      tssGain.connect(masterGain);
      noise.start(tssTime);
      noise.stop(tssTime + 0.6);
      break;
    }

    case 'quack': {
      // Pato: onda dente de serra com modulação formant bandpass
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.15);
      osc.frequency.linearRampToValueAtTime(280, now + 0.35);

      filter.type = 'bandpass';
      filter.Q.setValueAtTime(5, now);
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(600, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
      break;
    }

    case 'applause': {
      // Várias palmas moduladas
      const dur = 1.2;
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, dur);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(now);
      noise.stop(now + dur);
      break;
    }

    case 'discord_ping': {
      // Notificação clássica: dois tons suaves harmonizados
      const freqs = [880, 1760];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const vol = i === 0 ? 0.35 : 0.12;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.45);
      });
      break;
    }

    case 'sad_trombone': {
      // Womp womp womp waaa (4 notas descendentes com vibrato)
      const notes = [
        { f: 293.66, d: 0.3 }, // D4
        { f: 277.18, d: 0.3 }, // C#4
        { f: 261.63, d: 0.3 }, // C4
        { f: 246.94, d: 0.8 }, // B3
      ];

      let tCur = now;
      notes.forEach((n, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, tCur);

        if (idx === 3) {
          // Vibrato na última nota
          osc.frequency.linearRampToValueAtTime(n.f - 20, tCur + n.d);
        }

        gain.gain.setValueAtTime(0.001, tCur);
        gain.gain.linearRampToValueAtTime(0.25, tCur + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, tCur + n.d);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(tCur);
        osc.stop(tCur + n.d);

        tCur += n.d * 0.9;
      });
      break;
    }

    case 'level_up': {
      // Arpeggio 8-bit ascendente
      const arp = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      arp.forEach((freq, idx) => {
        const tStart = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, tStart);

        gain.gain.setValueAtTime(0.001, tStart);
        gain.gain.linearRampToValueAtTime(0.18, tStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.15);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(tStart);
        osc.stop(tStart + 0.15);
      });
      break;
    }

    case 'vine_boom': {
      // Sub bass boom profundo com punch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.8);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.85);
      break;
    }

    case 'crickets': {
      // Grilos (pulsos rápidos em frequência alta)
      for (let i = 0; i < 6; i++) {
        const tStart = now + i * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, tStart);
        osc.frequency.linearRampToValueAtTime(4800, tStart + 0.06);

        gain.gain.setValueAtTime(0.001, tStart);
        gain.gain.linearRampToValueAtTime(0.15, tStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.07);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(tStart);
        osc.stop(tStart + 0.07);
      }
      break;
    }

    case 'discord_join': {
      // Som de entrar no canal (duas notas ascendentes harmoniosas)
      const freqs = [440, 587.33]; // A4 -> D5
      freqs.forEach((f, idx) => {
        const tStart = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, tStart);

        gain.gain.setValueAtTime(0.001, tStart);
        gain.gain.linearRampToValueAtTime(0.3, tStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(tStart);
        osc.stop(tStart + 0.35);
      });
      break;
    }

    case 'discord_leave': {
      // Som de sair do canal (duas notas descendentes)
      const freqs = [587.33, 440]; // D5 -> A4
      freqs.forEach((f, idx) => {
        const tStart = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, tStart);

        gain.gain.setValueAtTime(0.001, tStart);
        gain.gain.linearRampToValueAtTime(0.28, tStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(tStart);
        osc.stop(tStart + 0.35);
      });
      break;
    }

    default:
      console.warn('[Soundboard] Som desconhecido:', soundId);
  }
}
