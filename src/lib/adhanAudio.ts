let audio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  if (audio) return audio;
  const a = new Audio();
  a.preload = 'auto';
  a.volume = 1.0;
  a.loop = true;
  audio = a;
  return a;
}

export async function unlockAudio(): Promise<void> {
  if (unlocked) return;
  const a = getAudio();
  try {
    a.src = '/adhan/adhan.mp3';
    await a.play();
    a.pause();
    a.currentTime = 0;
    unlocked = true;
  } catch {
    unlocked = true;
  }
}

export async function playAdhan(loop = false): Promise<void> {
  const a = getAudio();
  try {
    if (a.src.indexOf('/adhan/adhan.mp3') === -1 && a.src.indexOf('/adhan/adan.ogg') === -1) {
      a.src = '/adhan/adhan.mp3';
    }
    a.currentTime = 0;
    a.loop = loop;
    await a.play();
  } catch {}
}

export function stopAdhan(): void {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {}
}

