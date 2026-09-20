import { version } from "../../../package.json";
/** One player, one generation: page changes and replay can never overlap clips. */
export function createNarrator(
  onState: (playing: boolean) => void,
  onError: (message: string) => void,
) {
  const player = new Audio();
  player.preload = "none";
  let generation = 0;
  const stop = () => {
    generation++;
    player.pause();
    player.onended = null;
    player.onerror = null;
    onState(false);
  };
  const play = (files: readonly string[]) => {
    stop();
    const current = generation;
    const queue = [...files];
    const next = () => {
      if (current !== generation) return;
      const file = queue.shift();
      if (!file) {
        onState(false);
        return;
      }
      player.src = `assets/audio/${file}.mp3?v=${version}`;
      player.onended = next;
      player.onerror = () => {
        if (current === generation) {
          onState(false);
          onError(
            "This recording could not play. The written clue is still here.",
          );
        }
      };
      onState(true);
      player.play().catch((error: unknown) => {
        if (current !== generation) return;
        onState(false);
        if (!(error instanceof DOMException && error.name === "AbortError"))
          onError("Tap the listen button to play Pip’s recording.");
      });
    };
    next();
  };
  return { play, stop, isPlaying: () => !player.paused };
}
