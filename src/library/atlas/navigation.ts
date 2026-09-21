import type { Session } from "../../contracts/session";

/** Capture mutable view state without copying the immutable country catalog. */
export function captureSession(session: Session): Session {
  return session.type === "visit" || session.type === "quiz"
    ? {
        ...session,
        answer: { ...session.answer },
        options: { ...session.options },
      }
    : { ...session }; // MemoryBoard is immutable; cards/order remain the same.
}
function frameKey(session: Session): string {
  if (session.type === "guide") return "guide";
  if (session.type === "memory")
    return `${session.id}:memory:${session.complete}:${session.board.faceUp.join(",")}:${session.board.matched.join(",")}`;
  return `${session.id}:${session.type}:${session.index}:${session.stage}:${session.step}:${session.tab}`;
}

/** Review history, not reward undo. Existing questions and answers survive revisits. */
export function createSessionHistory() {
  const past: Session[] = [],
    future: Session[] = [];
  const rewards = new Set<string>();
  const remember = (session: Session) => {
    past.push(captureSession(session));
    if (past.length > 200) past.shift();
  };
  const clear = () => {
    past.length = 0;
    future.length = 0;
    rewards.clear();
  };
  return {
    clear,
    canForward: () => future.length > 0,
    move(before: Session | null, after: Session): Session {
      if (!before) {
        clear();
        return after;
      }
      if (frameKey(before) === frameKey(after)) return after;
      remember(before);
      const saved = future.at(-1);
      if (saved && frameKey(saved) === frameKey(after)) {
        future.pop();
        return captureSession(saved);
      }
      future.length = 0;
      return after;
    },
    back(current: Session): Session | null {
      const previous = past.pop();
      if (!previous) return null;
      future.push(captureSession(current));
      return captureSession(previous);
    },
    forward(current: Session): Session | null {
      const next = future.pop();
      if (!next) return null;
      remember(current);
      return captureSession(next);
    },
    claimReward(key: string): boolean {
      if (rewards.has(key)) return false;
      rewards.add(key);
      return true;
    },
  };
}
