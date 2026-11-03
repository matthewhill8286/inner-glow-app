# Hide the video pause button while playing, and consider full screen

Priority: P2

Status: Partial — pause button implemented and checked in the iPhone simulator; full screen outstanding

## Source feedback

- Report 45, Build 27, 13:13 UTC: "Maybe we need a full screen option — that's to consider. And the pause button is always on the screen, it's not disappearing and covering the video."

## Fix

`components/practices/VideoPlayer.tsx` fades the pause button 2.5 seconds after playback starts. While it is hidden, the first tap on the video brings it back and the next one pauses.

## Outstanding

Full screen needs a design decision. It could be a landscape player with `expo-screen-orientation`, which is a native module and needs a new build, or a full-window card in portrait.
