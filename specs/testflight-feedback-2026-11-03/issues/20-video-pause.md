# Make Relax video pause stop native playback

Priority: P1

Status: Implemented — pause/resume verified on iPhone simulator; physical-device verification pending

## Source feedback

- Report 23, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AAMrXzmk8NF1j-RMgRbDb9w.zip) · [screenshot](../evidence/23-1.jpg)

## Cross-reference with current code

Commit 6fe83cc predates Build 26 and attempted video pause fixes. A new Build 26 report says playback continues while the overlay shows paused; earlier code tests are insufficient to close it.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

On physical iPhone pause and resume repeatedly, background/foreground and leave the screen; confirm audio and video stop together and UI reflects actual playback.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Native investigation — 3 November 2026

Reproduced the exact symptom on iPhone 17 Pro / iOS 26.5: Play was shown after pause while time advanced from 00:15 to 00:30. Protecting React intent alone did not stop native playback. Added explicit playVideo/pauseVideo WebView injection methods to react-native-youtube-iframe 2.4.1 via a reproducible patch-package patch, and invoke them for playback requests and late playing events. Simulator retest: paused at 01:42 and stayed there after waiting; resumed, advanced to 02:03, paused again and stayed fixed. End session returned to Practices. Dependency version is pinned so the patch cannot silently target another version. Two regression tests cover stale events and explicit native commands. Physical iPhone audio/background checks remain outstanding.

See [verification record](../verification.md). These changes are not in submitted Build 27.
