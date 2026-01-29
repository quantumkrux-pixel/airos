import React, { useState } from "react";
import { initialBoard, getLegalMoves, movePiece } from "./ChessEngine";
import ChessBoard from "./components/ChessBoard";
import ChessSidebar from "./components/ChessSidebar";

export default function ChessController() {
  const [board, setBoard] = useState(initialBoard());
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [history, setHistory] = useState([]);

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];

    // selecting a piece
    if (!selected && piece && piece[0] === turn) {
      setSelected({ row, col });
      setLegalMoves(getLegalMoves(board, row, col));
      return;
    }

    // moving a piece
    if (selected) {
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        const { newBoard, moveNotation } = movePiece(board, selected, { row, col });

        setBoard(newBoard);
        setHistory([...history, moveNotation]);
        setTurn(turn === "w" ? "b" : "w");
      }

      setSelected(null);
      setLegalMoves([]);
    }
  };

  const restart = () => {
    setBoard(initialBoard());
    setTurn("w");
    setSelected(null);
    setLegalMoves([]);
    setHistory([]);
  };

  return (
    <div className="chess-container">
      <ChessBoard
        board={board}
        selected={selected}
        legalMoves={legalMoves}
        onSquareClick={handleSquareClick}
      />
      <ChessSidebar turn={turn} history={history} restart={restart} />
    </div>
  );
}