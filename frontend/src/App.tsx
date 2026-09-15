import React from 'react';
import Home from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Home />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
