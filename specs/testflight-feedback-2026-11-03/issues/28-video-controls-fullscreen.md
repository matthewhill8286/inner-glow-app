# Hide the video pause button while playing, and consider full screen

Priority: P2

Status: Implemented — pause button and full screen checked in the iPhone simulator; device retest required

## Source feedback

- Report 45, Build 27, 13:13 UTC: "Maybe we need a full screen option — that's to consider. And the pause button is always on the screen, it's not disappearing and covering the video."

## Fix

`components/practices/VideoPlayer.tsx` fades the pause button 2.5 seconds after playback starts. While it is hidden, the first tap on the video brings it back and the next one pauses.

## Full screen

A full-screen button sits at the bottom right of the video once it has started, and it hides along with the pause button. Full screen grows the same card to fill the window and rotates it to landscape, and it hides the status bar. The app is portrait-only, so the card turns instead of the device. The player is never remounted, so playback carries on without reloading. The button or Android Back returns to the card. No native module is needed, so this works in the current build.
