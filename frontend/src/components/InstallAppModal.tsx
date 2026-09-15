import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Monitor, Apple, Check, Share2, PlusSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: Props) {
  const { theme, accent } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: theme.bgSidebar,
          borderColor: theme.borderColor,
          color: theme.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow font-bold"
              style={{ backgroundColor: accent.hex }}
            >
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Instalar Aplicativo</h2>
              <p className="text-xs text-zinc-400">Tenha o ScreenShare Hub no seu celular ou PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Status if already installed */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 flex items-center gap-3">
              <Check className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">Aplicativo já instalado!</p>
                <p className="text-xs text-emerald-400 mt-0.5">
                  Você já está utilizando o aplicativo na tela inicial do seu dispositivo.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* One-click install if supported by browser (Android / Chrome PC) */}
              {deferredPrompt && (
                <div
                  className="p-4 rounded-2xl border text-center space-y-3"
                  style={{ backgroundColor: theme.bgCard, borderColor: accent.hex }}
                >
                  <p className="font-bold text-sm text-white">Pronto para Instalação Direta!</p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accent.hex }}
                  >
                    <Download className="w-4 h-4" />
                    📲 Instalar no Aparelho Agora
                  </button>
                </div>
              )}

              {/* Android Instructions */}
              <div
                className="p-3.5 rounded-2xl border space-y-2"
                style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
              >
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>No Celular Android (Chrome)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed pl-1">
                  <li>Toque nos <strong>3 pontinhos (⋮)</strong> no topo do navegador.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>O ícone aparecerá direto nos seus aplicativos!</li>
                </ol>
              </div>

              {/* iPhone iOS Instructions */}
              <div
                className="p-3.5 rounded-2xl border space-y-2"
                style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
              >
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <Apple className="w-4 h-4 text-zinc-300" />
                  <span>No iPhone (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed pl-1">
                  <li>Toque no botão de <strong>Compartilhar <Share2 className="w-3 h-3 inline" /></strong> na barra inferior.</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início" <PlusSquare className="w-3 h-3 inline" /></strong>.</li>
                  <li>Toque em <strong>"Adicionar"</strong> no topo direito.</li>
                </ol>
              </div>

              {/* PC Windows Instructions */}
              <div
                className="p-3.5 rounded-2xl border space-y-2"
                style={{ backgroundColor: theme.bgCard, borderColor: theme.borderColor }}
              >
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>No Computador (Chrome / Edge)</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Clique no ícone de <strong>instalar aplicativo</strong> (um computador com seta para baixo) na barra de navegação para ter uma janela dedicada e atalho na sua Área de Trabalho!
                </p>
              </div>
            </>
          )}

          {/* APK via PWABuilder Box */}
          <div
            className="p-3 rounded-xl border flex items-center justify-between gap-3"
            style={{ backgroundColor: theme.bgInput, borderColor: theme.borderColor }}
          >
            <div className="text-[11px] text-zinc-400">
              <span className="font-bold text-white block">Quer o arquivo .APK de verdade?</span>
              Gere direto pela Microsoft com 1 clique no PWABuilder.
            </div>
            <a
              href="https://www.pwabuilder.com?url=https://frontend-sage-sigma-u4aaj02dwa.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg font-bold text-[10px] text-white shadow hover:brightness-110 transition shrink-0"
              style={{ backgroundColor: accent.hex }}
            >
              Abrir PWABuilder
            </a>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex justify-end"
          style={{ borderColor: theme.borderColor }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-zinc-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
