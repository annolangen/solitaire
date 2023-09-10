// Number holes along one side of triangle board for 15 hole solitaire.
const N = 5;

// An individual hole on the board.
interface Hole {
  row: number;
  col: number;
  index: number;
}

// The board is a triangle of holes, which can be accessed by row and column.
interface Board {
  grid: Hole[][];
}

// Returns the standard 15 hole solitaire board.
function makeBoard(): Board {
  const grid: Hole[][] = [];
  let index = 0;
  for (let row = 0; row < N; row++) {
    const thisRow: Hole[] = [];
    for (let col = 0; col <= row; col++) {
      thisRow.push({ row, col, index });
      index++;
    }
    grid.push(thisRow);
  }
  return { grid };
}

interface Position {
  // 0 = empty, 1 = peg for each index in holes array.
  bits: number;
}

const hasPeg = ({ bits }: Position, { index }: Hole) => bits & (1 << index);
const isEmpty = (position: Position, hole: Hole) => !hasPeg(position, hole);

// Returns a full board except for the hole at the given index.
const fullBoardWithVacancyAt = (index: number) => ({
  bits: (1 << index) ^ 0x7fff,
});

interface Move {
  apply(position: Position): Position;
  start: Hole;
  middle: Hole;
  destination: Hole;
}

// Returns possible moves given a board and a position.
function* possibleMoves(position: Position, { grid }: Board): Generator<Move> {
  type Direction = (x: Hole) => Hole;

  for (const row of grid) {
    for (const start of row) {
      if (hasPeg(position, start)) {
        for (const direction of directions(start)) {
          const middle = direction(start);
          if (isEmpty(position, middle)) continue;
          const destination = direction(middle);
          if (hasPeg(position, destination)) continue;
          const mask =
            (1 << start.index) | (1 << middle.index) | (1 << destination.index);
          yield {
            start,
            middle,
            destination,
            apply: ({ bits }: Position) => ({ bits: bits ^ mask }),
          };
        }
      }
    }
  }

  // Returns possible directions to jump from a hole.
  function* directions({ row, col }: Hole): Generator<Direction> {
    if (col > 1) {
      yield ({ row, col }) => grid[row][col - 1];
    }
    if (col + 2 <= row) {
      yield ({ row, col }) => grid[row][col + 1];
    }
    if (row > 1 && col < row - 2) {
      yield ({ row, col }) => grid[row - 1][col];
    }
    if (row > 1 && col > 1) {
      yield ({ row, col }) => grid[row - 1][col - 1];
    }
    if (row < N - 2) {
      yield ({ row, col }) => grid[row + 1][col];
      yield ({ row, col }) => grid[row + 1][col + 1];
    }
  }
}

// Returns solution to a single peg solitaire board.
function solve(position: Position, board: Board): Move[] {
  // Maybe check that position has 14 pegs and one hole?
  return addMoves(13, position)!;

  function addMoves(depth: number, position: Position): Move[] | null {
    if (depth === 0) return [];
    for (const move of possibleMoves(position, board)) {
      const tail = addMoves(depth - 1, move.apply(position));
      if (tail) return [move, ...tail];
    }
    return null;
  }
}

// Returns a string representation of the moves.
const movesToString = (moves: Move[]) =>
  moves
    .map(
      ({ start, destination }) =>
        `${start.row}, ${start.col} -> ${destination.row}, ${destination.col}`
    )
    .join("\n");

console.log(movesToString(solve(fullBoardWithVacancyAt(12), makeBoard())));
