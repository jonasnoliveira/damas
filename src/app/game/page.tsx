'use client';

import { useGameStore } from '@/store/gameStore';
import { Menu } from '@/components/Menu/Menu';
import { Board } from '@/components/Board/Board';
import { GameInfo } from '@/components/GameInfo/GameInfo';
import { Chat } from '@/components/Chat/Chat';
import styles from './game.module.css';

export default function GamePage() {
    const gameStatus = useGameStore((state) => state.gameStatus);
    const gameMode = useGameStore((state) => state.gameMode);

    if (gameStatus === 'menu') {
        return <Menu />;
    }

    return (
        <main className={styles.gamePage}>
            <div className={styles.gameLayout}>
                <Board />
                <GameInfo />
            </div>
            {gameMode === 'online' && <Chat />}
        </main>
    );
}
