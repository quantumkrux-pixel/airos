import React from "react";

const PIECE_SYMBOLS = {
  wP: "♙",
  wR: "♖",
  wN: "♘",
  wB: "♗",
  wQ: "♕",
  wK: "♔",

  bP: "♟︎",
  bR: "♜",
  bN: "♞",
  bB: "♝",
  bQ: "♛",
  bK: "♚"
};

export default function Piece({ piece }) {
  if (!piece) return null;

  return (
    <div className="piece">
      {PIECE_SYMBOLS[piece]}
    </div>
  );
}