# Return from Ask Glow to Home

Priority: P2

Status: Implemented locally — awaiting device verification

## Source feedback

- Report 11, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AMFNtHXEZUEyLEQmxWAlqv4.zip) · [screenshot](../evidence/11-1.jpg)

## Cross-reference with current code

Home opens new-conversation without a from parameter; chat defaults its fallback to the chat tab. Existing navigation tests do not establish native stack behaviour.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Open Ask Glow from Home, navigate back before and after starting a conversation, and verify Home appears rather than a previous chat. Preserve chat-origin behaviour.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.

## Implementation update — 3 November 2026

Home passes an explicit origin into Glow AI. The origin survives conversation creation, and both chat back actions dismiss to Home for that origin instead of popping into an older chat.

Changes are local and are not in submitted Build 27. Automated regression tests pass; native navigation, persistence and layout need iPhone verification before closure.
