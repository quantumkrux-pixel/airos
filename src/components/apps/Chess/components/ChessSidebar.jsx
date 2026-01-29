import React from "react";

export default function ChessSidebar({ turn, history, restart }) {
  return (
    <div className="chess-sidebar">
      <div className="sidebar-section turn-indicator">
        <div className="label">Turn</div>
        <div className="value">{turn === "w" ? "White" : "Black"}</div>
      </div>

      <div className="sidebar-section move-history">
        <div className="label">Moves</div>
        <div className="history-list">
          {history.length === 0 && (
            <div className="empty">No moves yet</div>
          )}
          {history.map((move, i) => (
            <div key={i} className="history-item">
              {i + 1}. {move}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <button className="restart-btn" onClick={restart}>
          Restart Game
        </button>
      </div>
    </div>
  );
}