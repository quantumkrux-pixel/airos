// -------------------------
// Utility helpers
// -------------------------
function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isEnemy(board, r, c, color) {
  return board[r][c] && board[r][c][0] !== color;
}

function isEmpty(board, r, c) {
  return !board[r][c];
}

// -------------------------
// Initial board
// -------------------------
export function initialBoard() {
  return [
    ["bR","bN","bB","bQ","bK","bB","bN","bR"],
    ["bP","bP","bP","bP","bP","bP","bP","bP"],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ["wP","wP","wP","wP","wP","wP","wP","wP"],
    ["wR","wN","wB","wQ","wK","wB","wN","wR"]
  ];
}

// -------------------------
// Pawn movement
// -------------------------
export function pawnMoves(board, row, col, color) {
  const dir = color === "w" ? -1 : 1;
  const startRow = color === "w" ? 6 : 1;
  const moves = [];

  // forward 1
  if (inBounds(row + dir, col) && isEmpty(board, row + dir, col)) {
    moves.push({ row: row + dir, col });
  }

  // forward 2
  if (
    row === startRow &&
    isEmpty(board, row + dir, col) &&
    isEmpty(board, row + 2 * dir, col)
  ) {
    moves.push({ row: row + 2 * dir, col });
  }

  // captures
  for (const dc of [-1, 1]) {
    const r = row + dir;
    const c = col + dc;
    if (inBounds(r, c) && isEnemy(board, r, c, color)) {
      moves.push({ row: r, col: c });
    }
  }

  return moves;
}

// -------------------------
// Rook movement
// -------------------------
export function rookMoves(board, row, col, color) {
  const moves = [];
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];

  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;

    while (inBounds(r, c)) {
      if (isEmpty(board, r, c)) {
        moves.push({ row: r, col: c });
      } else {
        if (isEnemy(board, r, c, color)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
}

// -------------------------
// Knight movement
// -------------------------
export function knightMoves(board, row, col, color) {
  const moves = [];
  const jumps = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];

  for (const [dr, dc] of jumps) {
    const r = row + dr;
    const c = col + dc;

    if (!inBounds(r, c)) continue;

    if (isEmpty(board, r, c) || isEnemy(board, r, c, color)) {
      moves.push({ row: r, col: c });
    }
  }

  return moves;
}

// -------------------------
// Bishop movement
// -------------------------
export function bishopMoves(board, row, col, color) {
  const moves = [];
  const dirs = [
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;

    while (inBounds(r, c)) {
      if (isEmpty(board, r, c)) {
        moves.push({ row: r, col: c });
      } else {
        if (isEnemy(board, r, c, color)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
}

// -------------------------
// Queen movement
// -------------------------
export function queenMoves(board, row, col, color) {
  return [
    ...rookMoves(board, row, col, color),
    ...bishopMoves(board, row, col, color)
  ];
}

// -------------------------
// King movement
// -------------------------
export function kingMoves(board, row, col, color) {
  const moves = [];
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;

    if (!inBounds(r, c)) continue;

    if (isEmpty(board, r, c) || isEnemy(board, r, c, color)) {
      moves.push({ row: r, col: c });
    }
  }

  return moves;
}

// -------------------------
// Move dispatcher
// -------------------------
export function getLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const color = piece[0];
  const type = piece[1];

  switch (type) {
    case "P": return pawnMoves(board, row, col, color);
    case "R": return rookMoves(board, row, col, color);
    case "N": return knightMoves(board, row, col, color);
    case "B": return bishopMoves(board, row, col, color);
    case "Q": return queenMoves(board, row, col, color);
    case "K": return kingMoves(board, row, col, color);
    default: return [];
  }
}

// -------------------------
// Move execution
// -------------------------
export function movePiece(board, from, to) {
  const newBoard = board.map(r => [...r]);
  const piece = newBoard[from.row][from.col];

  newBoard[from.row][from.col] = null;
  newBoard[to.row][to.col] = piece;

  return {
    newBoard,
    moveNotation: `${piece} ${from.row},${from.col} → ${to.row},${to.col}`
  };
}