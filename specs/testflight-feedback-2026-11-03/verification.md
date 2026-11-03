# Native verification — 3 November 2026

Target: iPhone 17 Pro simulator, iOS 26.5. Current local Debug build compiled and installed successfully. Metro used port 8082; another project already occupied 8081. No physical iPhone was available. This is not submitted Build 27.

| Check | Result |
| --- | --- |
| Redesigned mood insert with optional scores omitted | Passed against Supabase. Identified probe row removed. |
| Profile → score empty state → mood check-in → Save | Passed; native Mood logged confirmation shown. |
| Mood completion returns to Profile | Initial cross-tab POP_TO failed; corrected to clear available forms and navigate. Repeat returned to Profile. A canDismiss guard was added after a POP_TO_TOP warning. |
| Video pause before bridge correction | Failed: UI showed Play while timer advanced 00:15 → 00:30. |
| Video direct native pause | Passed: held at 01:42 while waiting. |
| Video resume and second pause | Passed: advanced to 02:03 and held there after pausing again. |
| End paused video session | Passed: returned to Practices. |
| Authenticator design and QR | Shared design-system layout and visible QR confirmed. No factor verified or disabled. |

Evidence: `../../../release-assets/feedback-fixes/video-paused-fixed.png`. The authenticator screenshot is deliberately not saved in the project because it includes a provisioning secret.

Physical-device sound output, background playback, authenticator scan/verification, denied-permission recovery and intermittent/offline mood saving remain open. Historical reports are not closed solely because the current happy path passes. Test check-in/session data created through the native UI remains in the signed-in test account.

The native video fix is persisted in `patches/react-native-youtube-iframe+2.4.1.patch`, applied by the package postinstall script. The library is pinned to version 2.4.1. The direct command uses the same WebView JavaScript mechanism already used by the library's seek function; the existing play prop remains in use as well.
