import { html, svg, render } from "lit-html";

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
  for (const row of grid) {
    for (const start of row) {
      if (hasPeg(position, start)) {
        for (const { rowDelta, colDelta } of directions(start)) {
          const neighbor = ({ row, col }: Hole) =>
            grid[row + rowDelta][col + colDelta];
          const middle = neighbor(start);
          if (isEmpty(position, middle)) continue;
          const destination = neighbor(middle);
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

  function* directions({ row, col }: Hole) {
    if (col > 1) yield { rowDelta: 0, colDelta: -1 };
    if (col + 2 <= row) yield { rowDelta: 0, colDelta: 1 };
    if (row > 1 && col < row - 2) yield { rowDelta: -1, colDelta: 0 };
    if (row > 1 && col > 1) yield { rowDelta: -1, colDelta: -1 };
    if (row < N - 2) {
      yield { rowDelta: 1, colDelta: 0 };
      yield { rowDelta: 1, colDelta: 1 };
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

const board = makeBoard();
const position = fullBoardWithVacancyAt(12);
console.log(movesToString(solve(position, board)));

// Render the SVG content to the DOM
const sin60 = Math.sqrt(0.75);
const coordinates = ({ row, col }: Hole) => ({
  cx: (row * -sin60) / 2 + col * sin60 + 2.5,
  cy: row * 0.5 + 1,
});

function circle(hole: Hole) {
  const { cx, cy } = coordinates(hole);
  return svg`<circle cx=${cx} cy=${cy} r=".2" fill=${
    hasPeg(position, hole) ? "teal" : "black"
  } />`;
}

function renderBody() {
  const w = document.getElementById("board");
  const magnification = w ? Math.min(w.clientWidth, w.clientHeight) * 0.3 : 120;
  return render(
    html`
      <nav class="main-nav navbar is-light"></nav>
      <div class="columns">
        <div class="column is-2"></div>
        <div class="column">
          <div style="width:80%">
            <h3 class="title is-3">15 Hole Triangle Solitaire</h3>
            <div>See console for solution</div>
            <div style="width:100%;height:400px">
              ${svg`
            <svg id="board" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <g transform="scale(${magnification}, ${magnification})">
                  ${board.grid.map(row => row.map(circle))}
                </g>
              </g>
            </svg>
            `}
            </div>
          </div>
        </div>
      </div>
    `,
    document.body
  );
}

window.onclick = renderBody;
renderBody();
