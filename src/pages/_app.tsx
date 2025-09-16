import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import React from 'react';
import type { AppProps } from 'next/app';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, chains } from '@/config/wagmi';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <ThemeProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#00ff88',
                    secondary: '#000000',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff006e',
                    secondary: '#000000',
                  },
                },
              }}
            />
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}