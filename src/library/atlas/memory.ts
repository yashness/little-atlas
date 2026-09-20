import { shuffled } from "../../utils/collections";
import type { MemoryBoard } from "../../contracts/atlas";
export type { MemoryBoard } from "../../contracts/atlas";
export function createBoard(
  codes: readonly string[],
  random: () => number = Math.random,
): MemoryBoard {
  const distinct = [...new Set(codes)];
  if (distinct.length < 2)
    throw new Error("A memory board needs at least two countries.");
  return {
    cards: shuffled(
      distinct.flatMap((c) => [c, c]),
      random,
    ),
    faceUp: [],
    matched: [],
  };
}
export function turnCard(
  board: MemoryBoard,
  index: number,
): { board: MemoryBoard; matchedCode: string | null } {
  if (
    !Number.isInteger(index) ||
    !board.cards[index] ||
    board.faceUp.length === 2 ||
    board.faceUp.includes(index) ||
    board.matched.includes(index)
  )
    return { board, matchedCode: null };
  const faceUp = [...board.faceUp, index];
  if (faceUp.length === 2 && board.cards[faceUp[0]!] === board.cards[index])
    return {
      board: { ...board, faceUp: [], matched: [...board.matched, ...faceUp] },
      matchedCode: board.cards[index]!,
    };
  return { board: { ...board, faceUp }, matchedCode: null };
}
export function resetTurn(board: MemoryBoard): MemoryBoard {
  return { ...board, faceUp: [] };
}
