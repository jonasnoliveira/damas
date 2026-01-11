# 🎮 Damas Brasileiras

Jogo de Damas Brasileiras com modo local e multiplayer online em tempo real.

## ✨ Funcionalidades

- 👥 **Jogar vs Amigo** - Modo local para dois jogadores
- 🤖 **Jogar vs Máquina** - IA com 3 níveis de dificuldade
- 🌐 **Jogar Online** - Multiplayer em tempo real via WebSocket

## 🚀 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento (Next.js + WebSocket)
npm run dev

# Abrir http://localhost:3000
```

## 📦 Deploy em Produção

### Opção 1: Servidor VPS (recomendado para multiplayer)

Deploy em um servidor que suporta Node.js (ex: DigitalOcean, AWS EC2):

```bash
npm run build
npm run start
```

### Opção 2: Vercel + Servidor WebSocket Externo

A Vercel não suporta WebSockets persistentes. Para multiplayer online, você precisa:

1. **Deploy do frontend na Vercel**
   - Conecte seu repositório GitHub à Vercel
   - O build usará `next build`

2. **Deploy do servidor WebSocket no Railway/Render**
   - Crie um novo projeto no [Railway](https://railway.app) ou [Render](https://render.com)
   - Use o arquivo `ws-server.js`
   - Configure o start command: `npm run start:ws`

3. **Configure a variável de ambiente na Vercel**
   - Vá em Settings > Environment Variables
   - Adicione: `NEXT_PUBLIC_WS_SERVER_URL` = `https://seu-app.railway.app`

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Next.js + WebSocket) |
| `npm run dev:ws` | Apenas servidor WebSocket (porta 3001) |
| `npm run build` | Build de produção do Next.js |
| `npm run start` | Servidor de produção completo |
| `npm run start:ws` | Apenas servidor WebSocket em produção |

## 🎯 Regras do Jogo

- Tabuleiro 8x8
- Peças brancas começam
- Captura obrigatória
- Peças promovem a Dama ao chegar no lado oposto
- Damas movem em qualquer direção diagonal

## 🛠️ Tecnologias

- [Next.js 16](https://nextjs.org/) - Framework React
- [Zustand](https://zustand-demo.pmnd.rs/) - Gerenciamento de estado
- [Socket.IO](https://socket.io/) - Comunicação em tempo real
- [Framer Motion](https://www.framer.com/motion/) - Animações
