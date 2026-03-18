'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

type Player = 'X' | 'O';
type Cell = Player | null;

interface GameRecord {
  id: number;
  winner: string;
  datePlayed: string;
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(cells: Cell[]): { winner: Player | null; line: number[] | null } {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a] as Player, line };
    }
  }
  return { winner: null, line: null };
}

export default function Home() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player | 'Draw' | null; line: number[] | null }>({
    winner: null,
    line: null,
  });
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveResult = useCallback(async (winner: string) => {
    setSavingResult(true);
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner }),
      });
      await fetchHistory();
    } catch (e) {
      console.error('Failed to save result', e);
    } finally {
      setSavingResult(false);
    }
  }, [fetchHistory]);

  const handleCellClick = useCallback(
    async (index: number) => {
      if (board[index] || gameOver) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const { winner, line } = calculateWinner(newBoard);

      if (winner) {
        setWinnerInfo({ winner, line });
        setGameOver(true);
        await saveResult(winner);
        return;
      }

      if (newBoard.every((cell) => cell !== null)) {
        setWinnerInfo({ winner: 'Draw', line: null });
        setGameOver(true);
        await saveResult('Draw');
        return;
      }

      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    },
    [board, currentPlayer, gameOver, saveResult]
  );

  const handleRestart = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setWinnerInfo({ winner: null, line: null });
  }, []);

  const getStatusMessage = () => {
    if (winnerInfo.winner === 'Draw') return "It's a Draw!";
    if (winnerInfo.winner) return `Player ${winnerInfo.winner} Wins! 🎉`;
    return `Player ${currentPlayer}'s Turn`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Tic-Tac-Toe</h1>

        <div
          className={`${styles.statusBar} ${
            winnerInfo.winner === 'X'
              ? styles.statusX
              : winnerInfo.winner === 'O'
              ? styles.statusO
              : winnerInfo.winner === 'Draw'
              ? styles.statusDraw
              : currentPlayer === 'X'
              ? styles.statusX
              : styles.statusO
          }`}
        >
          {getStatusMessage()}
        </div>

        <div className={styles.board}>
          {board.map((cell, index) => {
            const isWinningCell = winnerInfo.line?.includes(index) ?? false;
            return (
              <button
                key={index}
                className={`${styles.cell} ${
                  cell === 'X' ? styles.cellX : cell === 'O' ? styles.cellO : ''
                } ${isWinningCell ? styles.winningCell : ''} ${
                  !cell && !gameOver ? styles.cellHover : ''
                }`}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || gameOver}
                aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ''}`}
              >
                {cell && <span className={styles.cellContent}>{cell}</span>}
              </button>
            );
          })}
        </div>

        <button className={styles.restartBtn} onClick={handleRestart}>
          Restart Game
        </button>

        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>Game History</h2>
          {loadingHistory ? (
            <p className={styles.loadingText}>Loading history...</p>
          ) : history.length === 0 ? (
            <p className={styles.noHistory}>No games played yet.</p>
          ) : (
            <div className={styles.historyList}>
              <div className={styles.historyHeader}>
                <span>#</span>
                <span>Result</span>
                <span>Date Played</span>
              </div>
              {history
                .slice()
                .reverse()
                .map((record, idx) => (
                  <div key={record.id} className={styles.historyItem}>
                    <span className={styles.historyIndex}>{history.length - idx}</span>
                    <span
                      className={`${styles.historyWinner} ${
                        record.winner === 'X'
                          ? styles.winnerX
                          : record.winner === 'O'
                          ? styles.winnerO
                          : styles.winnerDraw
                      }`}
                    >
                      {record.winner === 'Draw' ? 'Draw' : `Player ${record.winner} Won`}
                    </span>
                    <span className={styles.historyDate}>{formatDate(record.datePlayed)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
