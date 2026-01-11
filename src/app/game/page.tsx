'use client';

import { useGameStore } from '@/store/gameStore';
import { Menu } from '@/components/Menu/Menu';
import { Board } from '@/components/Board/Board';
import { GameInfo } from '@/components/GameInfo/GameInfo';
import styles from './game.module.css';

export default function GamePage() {
    const gameStatus = useGameStore((state) => state.gameStatus);

    if (gameStatus === 'menu') {
        return <Menu />;
    }

    return (
        <main className={styles.gamePage}>
            <div className={styles.gameLayout}>
                <Board />
                <GameInfo />
            </div>
        </main>
    );
}
