import React from "react";
import Square from "./Square";

export default function ChessBoard({
  board,
  selected,
  legalMoves,
  onSquareClick
}) {
  return (
    <div className="chess-board">
      {board.map((row, r) =>
        row.map((piece, c) => {
          const isSelected =
            selected && selected.row === r && selected.col === c;

          const isLegal = legalMoves.some(
            (m) => m.row === r && m.col === c
          );

          return (
            <Square
              key={`${r}-${c}`}
              row={r}
              col={c}
              piece={piece}
              selected={isSelected}
              legal={isLegal}
              onClick={() => onSquareClick(r, c)}
            />
          );
        })
      )}
    </div>
  );
}