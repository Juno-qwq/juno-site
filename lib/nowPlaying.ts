// Now Playing — a typed stub. TODO(Phase 2 backlog): replace with a real source
// (Last.fm / Spotify via a Cloudflare Worker) behind this same interface.
export type NowPlayingTrack = {
  title: string
  artist: string
  /** Registry key → resolved to a themed art path (random_{theme}_1). */
  art: string
  durationSec: number
  /** Where playback currently is (simulated). */
  progressSec: number
}

export const nowPlaying: NowPlayingTrack = {
  title: "Neon Dreams",
  artist: "Lofi Cyberpunk",
  art: "random_1",
  durationSec: 227,
  progressSec: 84,
}

export function resolveArt(key: string, theme: "light" | "dark"): string {
  const n = key.replace(/^random_/, "")
  return `/img/art/random_${theme}_${n}.png`
}
