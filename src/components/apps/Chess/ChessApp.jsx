import React from "react";
import ChessController from "./ChessController";
import "./styles/chess.css";

export default function ChessApp({ windowId }) {
  return (
    <div className="chess-app">
      <ChessController windowId={windowId} />
    </div>
  );
}