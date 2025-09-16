import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import ParticleBackground from './ui/ParticleBackground';
import CursorParticles from './ui/CursorParticles';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Flash Liquidity Layer - Somnia Network</title>
        <meta name="description" content="On-chain liquidity aggregator for Somnia Network with flash loans and instant swaps" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col relative">
        {/* Global Particle Background - Only render on client */}
        {mounted && <ParticleBackground />}
        
        {/* Interactive Cursor Particles - Only render on client */}
        {mounted && <CursorParticles />}
        
        {/* Matrix Rain Effect - Only render on client */}
        {mounted && (
          <div className="matrix-rain">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="matrix-char"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 10}s`,
                }}
              >
                {Math.random() > 0.5 ? '1' : '0'}
              </div>
            ))}
          </div>
        )}
        
        <Navbar />
        <main className="flex-1 relative z-10">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}