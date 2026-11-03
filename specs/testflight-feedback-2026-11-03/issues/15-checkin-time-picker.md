# Make check-in time selection discoverable and reliable

Priority: P2

Status: Implemented — an inline wheel of 15-minute times with the chosen time large in the middle, as in 6787:5765, 6787:5819 and 6676:3066; the chips jump to the presets. Checked in the iPhone simulator

## Source feedback

- Report 16, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/ADs_oF-Ia1pXspXEQHs7AeE.zip) · [screenshot](../evidence/16-1.jpg)

## Cross-reference with current code

Tester explicitly says the check-in time selection will be redesigned. Do not infer a final interaction from the screenshot.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Obtain the revised design, verify current taps and persisted time, implement the agreed control and check its accessibility and small-screen behaviour.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
