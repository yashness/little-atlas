import { version } from "../../../package.json";
/** One player, one generation; a channel identifies the control that owns playback. */
export function createNarrator(
  onState: (playing: boolean, channel: string | null) => void,
  onError: (message: string) => void,
) {
  const player = new Audio();
  player.preload = "none";
  let generation = 0;
  let activeChannel: string | null = null;
  const idle = () => {
    activeChannel = null;
    onState(false, null);
  };
  const stop = () => {
    generation++;
    player.pause();
    player.onended = null;
    player.onerror = null;
    idle();
  };
  const play = (files: readonly string[], channel = "session") => {
    stop();
    const current = generation;
    const queue = [...files];
    const next = () => {
      if (current !== generation) return;
      const file = queue.shift();
      if (!file) {
        idle();
        return;
      }
      activeChannel = channel;
      player.src = `assets/audio/${file}.mp3?v=${version}`;
      player.onended = next;
      player.onerror = () => {
        if (current === generation) {
          idle();
          onError(
            "This recording could not play. The written clue is still here.",
          );
        }
      };
      onState(true, channel);
      player.play().catch((error: unknown) => {
        if (current !== generation) return;
        idle();
        if (!(error instanceof DOMException && error.name === "AbortError"))
          onError("Tap the listen button to play Pip’s recording.");
      });
    };
    next();
  };
  return {
    play,
    stop,
    isPlaying: (channel?: string) =>
      !player.paused &&
      activeChannel !== null &&
      (channel === undefined || channel === activeChannel),
  };
}
