# TestFlight feedback tasks — 3 November 2026

Reviewed all 42 screenshot reports and the one historical crash report visible in App Store Connect. Reports 1–25 are Build 26; the remaining screenshots are Builds 11, 14 and 23. No Build 27 feedback was present in this captured set. These are local project tasks, following the existing repository convention; no external tracker issues were created.

Reviewed against main `89dfc04`, released as Build 27, with fixes in `97c7d7b`. Build 27 is available to the external testing group. No item is marked verified fixed without device evidence.

## Tasks and current disposition

| Task | Priority | Status | Reports |
| --- | --- | --- | --- |
| [01 — Make QR setup and repeated enrollment reliable](issues/01-two-factor-setup.md) | P1 | Implemented — authenticator QR/layout checked in iPhone simulator; physical-device verification pending | 1, 27 |
| [02 — Return to Profile after logging from its empty score history](issues/02-profile-mood-return.md) | P2 | Implemented — native return tested; broader regression verification pending | 2 |
| [03 — Dismiss completion overlay before opening Glow AI](issues/03-practice-completion-overlay.md) | P1 | Implemented locally — awaiting device verification | 3 |
| [04 — Restore sleep player Back navigation](issues/04-sleep-player-back.md) | P2 | Outstanding | 4 |
| [05 — Provide sleep voice guidance and its designed controls](issues/05-sleep-voice-guidance.md) | P2 | Outstanding — narration assets required | 4, 5 |
| [06 — Improve rain volume and loop quality](issues/06-rain-sound-quality.md) | P2 | Outstanding | 4 |
| [07 — Align sleep icon and wind-down list with the approved design](issues/07-sleep-winddown-design.md) | P2 | Outstanding — design comparison required | 6, 7 |
| [08 — Repair breathing player rewind and forward controls](issues/08-practice-transport.md) | P2 | Outstanding — reproduce | 8 |
| [09 — Render the practice goal ring correctly at zero](issues/09-practice-progress-ring.md) | P2 | Outstanding | 9 |
| [10 — Align Home score and header icons](issues/10-home-alignment.md) | P2 | Partial — icon sizes aligned; score centring still outstanding | 10, 12 |
| [11 — Return from Ask Glow to Home](issues/11-home-ai-return.md) | P2 | Implemented locally — awaiting device verification | 11 |
| [12 — Match the Glow AI composer design](issues/12-chat-composer-design.md) | P2 | Outstanding — design comparison required | 13 |
| [13 — Save the Home mood slider inline](issues/13-home-inline-mood.md) | P2 | Implemented locally — awaiting device verification | 14 |
| [14 — Verify complete first-run onboarding in Build 27](issues/14-onboarding-verification.md) | P1 | Partial — signup fix shipped in Build 27; device retest required | 15 |
| [15 — Make check-in time selection discoverable and reliable](issues/15-checkin-time-picker.md) | P2 | Waiting for design — reproduction still required | 16 |
| [16 — Retest assessment keyboard dismissal](issues/16-keyboard-dismissal.md) | P2 | Implemented in Build 27 — device retest required | 17, 19 |
| [17 — Make assessment recording start and stop explicit](issues/17-voice-record-affordance.md) | P2 | Implemented locally — awaiting device verification | 18 |
| [18 — Complete microphone permission and recovery flows](issues/18-microphone-recovery.md) | P1 | Implemented locally — awaiting device verification | 20, 22 |
| [19 — Verify assessment goals and medication branching](issues/19-assessment-multiselect.md) | P2 | Implemented in Build 27 — device retest required | 21, 39, 36 |
| [20 — Make Relax video pause stop native playback](issues/20-video-pause.md) | P1 | Implemented — pause/resume verified on iPhone simulator; physical-device verification pending | 23 |
| [21 — Restore Deep Sleep sound playback](issues/21-deep-sleep-audio.md) | P1 | Implemented locally — awaiting native audio verification | 24 |
| [22 — Prevent score range labels overlapping](issues/22-score-label-overlap.md) | P2 | Implemented locally — awaiting device verification | 25 |
| [23 — Reproduce and resolve mood save failure](issues/23-mood-save-error.md) | P1 | Not reproduced — current backend and iPhone simulator saves passed | 29 |
| [24 — Verify historical feedback against current redesigned screens](issues/24-historical-layout-navigation.md) | P2 | Historical — redesigned screens require regression verification | 26, 28, 30, 31, 32, 33, 34, 35, 37, 40, 41, 42 |
| [25 — Resolve multiple-feelings assessment requirement](issues/25-mixed-feelings.md) | P2 | Outstanding — product/design decision required | 38 |

## Historical crash

The crash list contains one report: Build 2, iPhone 13 Pro Max, iOS 26.4, 20 March 2026, “Crashes upon opening”. No Build 26 or 27 crash report was visible. This does not prove the historical crash is fixed. Continue [October task 07](../testflight-feedback-2026-10-17/issues/07-historical-startup-crash.md); the original ZIP had metadata but no stack trace.

## Complete report cross-reference

[Machine-readable inventory](feedback-inventory.json) preserves source IDs, build, time, comment and task mapping. Screenshots are local evidence; report 27 is intentionally omitted because it contains an authenticator provisioning secret. Private tester contact metadata was excluded.

| Report | Build | Disposition | Task |
| --- | --- | --- | --- |
| [01](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ANbUS2r6yJ0I6DdvCfV0Zt0.zip) | 26 | Outstanding | [01](issues/01-two-factor-setup.md) |
| [02](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALweWl4hEX1nZF3sIJtauAo.zip) | 26 | Outstanding | [02](issues/02-profile-mood-return.md) |
| [03](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ABBVMlhFzo_nkmY0JtnfG5k.zip) | 26 | Outstanding | [03](issues/03-practice-completion-overlay.md) |
| [04](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AJW62DuI9_TyLLvY0n4kIi0.zip) | 26 | Outstanding | [04](issues/04-sleep-player-back.md), [05](issues/05-sleep-voice-guidance.md), [06](issues/06-rain-sound-quality.md) |
| [05](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHzmN7Yrajuxzo8Ab-XEpac.zip) | 26 | Outstanding — narration assets required | [05](issues/05-sleep-voice-guidance.md) |
| [06](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AKgCC-bHN7_fyL92n0WICEs.zip) | 26 | Outstanding — design comparison required | [07](issues/07-sleep-winddown-design.md) |
| [07](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMuPdhE8E0uW38FQY4yQN2w.zip) | 26 | Outstanding — design comparison required | [07](issues/07-sleep-winddown-design.md) |
| [08](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALV0UE0h0lOVZdv2oQkMpDo.zip) | 26 | Outstanding — reproduce | [08](issues/08-practice-transport.md) |
| [09](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AOVuC43PpBH-ef8BLXio9po.zip) | 26 | Outstanding | [09](issues/09-practice-progress-ring.md) |
| [10](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AC8nF2GKRSt4detuAvEJ9x4.zip) | 26 | Outstanding | [10](issues/10-home-alignment.md) |
| [11](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMFNtHXEZUEyLEQmxWAlqv4.zip) | 26 | Outstanding | [11](issues/11-home-ai-return.md) |
| [12](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AEa8se4B_Fo5zzqY9N7c5T0.zip) | 26 | Outstanding | [10](issues/10-home-alignment.md) |
| [13](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AEC8YbNaDYro6HZo4VjT0VM.zip) | 26 | Outstanding — design comparison required | [12](issues/12-chat-composer-design.md) |
| [14](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AL7TiAhJDE747yh4rqixJWY.zip) | 26 | Outstanding | [13](issues/13-home-inline-mood.md) |
| [15](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AP_11-BgtL7yZpWz6w7oAmg.zip) | 26 | Partial — signup fix shipped in Build 27; device retest required | [14](issues/14-onboarding-verification.md) |
| [16](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ADs_oF-Ia1pXspXEQHs7AeE.zip) | 26 | Waiting for design — reproduction still required | [15](issues/15-checkin-time-picker.md) |
| [17](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ANnZy3itE8o1-yMVf8z9qlc.zip) | 26 | Implemented in Build 27 — device retest required | [16](issues/16-keyboard-dismissal.md) |
| [18](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AFLbNRwWdnabgLj-e9k3pHU.zip) | 26 | Outstanding | [17](issues/17-voice-record-affordance.md) |
| [19](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHHRUEIi8o8WUX0pG3PVQhA.zip) | 26 | Implemented in Build 27 — device retest required | [16](issues/16-keyboard-dismissal.md) |
| [20](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALurPFlSvh3R5CjmxnzL6zk.zip) | 26 | Partial — assessment recovery shipped; journal recovery outstanding | [18](issues/18-microphone-recovery.md) |
| [21](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ACfkXD50TQqI5KdaxXRAKEc.zip) | 26 | Implemented in Build 27 — device retest required | [19](issues/19-assessment-multiselect.md) |
| [22](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHDVSXRUHnLkF3RiSthUyJ4.zip) | 26 | Partial — assessment recovery shipped; journal recovery outstanding | [18](issues/18-microphone-recovery.md) |
| [23](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AAMrXzmk8NF1j-RMgRbDb9w.zip) | 26 | Outstanding — reported after earlier fix | [20](issues/20-video-pause.md) |
| [24](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AP8mvQMkWGC3Mbxn2rXBRqQ.zip) | 26 | Outstanding | [21](issues/21-deep-sleep-audio.md) |
| [25](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AIdiHdmIO-HqMDLavE7t5I8.zip) | 26 | Outstanding | [22](issues/22-score-label-overlap.md) |
| [26](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AJ7byKBSgvnY3UPl5dHqVr4.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [27](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ABCNi0iVjbCEXfzUXL_0atA.zip) | 23 | Outstanding | [01](issues/01-two-factor-setup.md) |
| [28](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AC6hdhsriMXv_PFVq6I7Ez4.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [29](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ABw1C7fwlQJv0QIMjOyQtrk.zip) | 23 | Historical — current device retest required | [23](issues/23-mood-save-error.md) |
| [30](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHmlu-zC0mdy7qtrNbpYMWs.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [31](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AIDx7_hXkq69tyr-K_ecwHk.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [32](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMP4sse1pFWRCp_mK9zyBAA.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [33](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AAuHWBuO4dT8qJ2nTLE0gu0.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [34](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMN8h51jh-KcpfMj-6wHZR8.zip) | 23 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [35](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AGX2-7P9mN5Xoqkpw8AeM2s.zip) | 11 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [36](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMLGAxyCOZPhYXrJVd42zcU.zip) | 11 | Implemented in Build 27 — device retest required | [19](issues/19-assessment-multiselect.md) |
| [37](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AF6NIN0p_LcxY3HogZ78UHE.zip) | 11 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [38](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ADAMsfY8Dq72PoyAFdREzEA.zip) | 11 | Outstanding — product/design decision required | [25](issues/25-mixed-feelings.md) |
| [39](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ALAOCuPkJgEyFw4EGM2josY.zip) | 11 | Implemented in Build 27 — device retest required | [19](issues/19-assessment-multiselect.md) |
| [40](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHWRfWsxffUdyg02Q0vM_0M.zip) | 11 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [41](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMxHCe4eZss_NqTq-j_md30.zip) | 14 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |
| [42](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AIgPUmsdu_uqWORfMiLTVa4.zip) | 11 | Historical — redesigned screens require regression verification | [24](issues/24-historical-layout-navigation.md) |

## Release validation already performed

Before Build 27, submission checks and the verification suite passed (typecheck, lint and 65 tests), plus 11 assessment/keyboard tests. These establish code checks, not a native retest of these 42 reports. This feedback review changes documentation only.

## Fix batch started — 3 November 2026

Local fixes address tasks 01 (enrollment and QR, design still outstanding), 03 (completion overlay), and 18 (journal microphone recovery). No new binary has been built or submitted. Next P1 investigations are task 20 (native video pause), 21 (Deep Sleep sound), and 23 (historical mood-save failure); task 14 still needs clean-install device verification.

Soundscape follow-up: task 21 now has a local audio-mode and delayed-start fix with five regression tests. Native video pause (20) remains outstanding; the existing React-state tests do not verify native iframe playback.

## Navigation and layout follow-up

Tasks 02, 11, 13, 17 and 22 have local fixes pending iPhone verification. Task 10 has matching header icon sizes, while score centring remains outstanding. All 263 tests passed. Native video pause (20), original mood-save failure diagnosis (23), and design-dependent tasks remain outstanding; the mocked tests do not prove those reports resolved.

## Native verification follow-up

See the [3 November simulator verification record](verification.md). Video pause was reproduced and fixed at the native WebView command boundary. The authenticator screen was restyled and QR rendering checked. Current mood saving passed both a backend probe and native UI testing; the historical save error was not reproduced. Remaining design/asset and physical-device checks stay open.

## Build 27 reports (swept 3 November 2026, 13:30 UTC)

Three new screenshot reports arrived on Build 27 after the first sweep. No new crash reports were present.

| Report | Time (UTC) | Comment | Disposition | Task |
| --- | --- | --- | --- | --- |
| 43 | 12:45 | "Send button doesn't work" on Message our team | Fixed on `feature/glow-ai-chat-elements`: the form needs 20 characters and gave no sign of it. A live hint now says how many more are needed. | [26](issues/26-support-message-minimum.md) |
| 44 | 12:46 | "I need to make changes here" on the Help Centre | Fixed on `feature/glow-ai-chat-elements`: FAQ and Contact us are one screen, and the heading and tabs stay fixed while only the content changes. | [27](issues/27-help-centre-tabs.md) |
| 45 | 13:13 | Relax video: the pause button never hides; consider full screen | Pause button fixed on `feature/glow-ai-chat-elements`: it fades 2.5 s after play starts, and a tap brings it back. Full screen is outstanding. | [28](issues/28-video-controls-fullscreen.md) |
