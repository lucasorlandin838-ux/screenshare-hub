import React from 'react';
import Home from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { DiscordProvider, useDiscord } from './context/DiscordContext';
import DiscordActivityLoader from './components/DiscordActivityLoader';

function AppInner() {
  const { isDiscord, loading, error } = useDiscord();

  // Dentro do Discord: mostrar loader enquanto faz handshake
  if (isDiscord && loading) {
    return <DiscordActivityLoader />;
  }

  if (isDiscord && error) {
    return <DiscordActivityLoader error={error} />;
  }

  return <Home />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <DiscordProvider>
          <AppInner />
        </DiscordProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
