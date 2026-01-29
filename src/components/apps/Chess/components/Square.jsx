import React from "react";
import Piece from "./Piece";

export default function Square({
  row,
  col,
  piece,
  selected,
  legal,
  onClick
}) {
  const isDark = (row + col) % 2 === 1;

  let className = "square ";
  className += isDark ? "dark " : "light ";
  if (selected) className += "selected ";
  if (legal) className += "legal ";

  return (
    <div className={className} onClick={onClick}>
      <Piece piece={piece} />
    </div>
  );
}