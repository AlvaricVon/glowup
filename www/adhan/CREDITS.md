# Adhan Audio Credits

`adhan.mp3` — "Adhan Indonesia" from the
[Kiwifu/adhan-mp3](https://github.com/Kiwifu/adhan-mp3) collection.

- Source: https://github.com/Kiwifu/adhan-mp3
- License per repository README: free for Islamic apps, prayer-time
  software, and personal use.
- Duration: ~399 KB MP3.

## Swapping in your own recording

Replace `public/adhan/adhan.mp3`, then rebuild:

    npm run build
    Remove-Item -Recurse -Force www; Copy-Item -Recurse dist www
    npx cap sync android

Audio is resolved at runtime from `/adhan/adhan.mp3`, so any
browser-playable format (mp3/ogg/m4a) works as long as you keep the
filename or update `src/lib/adhanAudio.ts`.