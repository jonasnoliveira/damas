import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Damas Brasileiras - Jogo Online',
  description: 'Jogue Damas Brasileiras online! Desafie um amigo ou enfrente a inteligência artificial em diferentes níveis de dificuldade.',
  keywords: ['damas', 'damas brasileiras', 'jogo de damas', 'checkers', 'jogo online', 'jogo de tabuleiro'],
  authors: [{ name: 'Brazilian Checkers Game' }],
  openGraph: {
    title: 'Damas Brasileiras',
    description: 'O clássico jogo de estratégia - agora online!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
