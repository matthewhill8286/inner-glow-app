# Restore Deep Sleep sound playback

Priority: P1

Status: Implemented locally — awaiting native audio verification

## Source feedback

- Report 24, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AP8mvQMkWGC3Mbxn2rXBRqQ.zip) · [screenshot](../evidence/24-1.jpg)

## Cross-reference with current code

Build 26 Deep Sleep / Ocean Waves reports silence. Check the selected sound, lib/soundscape and the native player; root cause is not established.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Verify audible start, pause/resume, volume, output route, silent-mode behaviour, asset loading and failures on a physical iPhone.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Soundscapes now explicitly configure playback with `allowsRecording: false` and `playsInSilentMode: true` before creating the player. Previously only the recorder configured audio mode, leaving later playback dependent on recording state and silent-mode defaults. This is a concrete playback defect; the original report still requires physical-device confirmation.

An operation generation cancels delayed startup after navigation or a newer sound selection. Pause during startup is preserved, and silence releases the old player. Five mocked audio behaviour tests cover configuration, cancellation, pending pause/resume, silence and rapid replacement. The existing verification suite passed typecheck, lint and 65 tests. No binary has been built or uploaded.

Native checks remaining: Ocean Waves from a clean launch, after a voice recording, with silent mode on/off, through speaker/headphones, and while repeatedly entering/leaving the player. Rain volume and loop quality (task 06) are separate and remain outstanding.

Reference: https://docs.expo.dev/versions/v54.0.0/sdk/audio/
