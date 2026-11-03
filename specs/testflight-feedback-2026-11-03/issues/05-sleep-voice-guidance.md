# Provide sleep voice guidance and its designed controls

Priority: P2

Status: Outstanding — narration assets required

## Source feedback

- Report 4, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AJW62DuI9_TyLLvY0n4kIi0.zip) · [screenshot](../evidence/04-1.jpg)
- Report 5, Build 26: [Apple source](https://appstoreconnect.apple.com/testflight/v3/providers/128596004/apps/6760898488/feedback/download/AHzmN7Yrajuxzo8Ab-XEpac.zip) · [screenshot](../evidence/05-1.jpg)

## Cross-reference with current code

app/(tabs)/mindful/practice/[id].tsx explicitly omits voice guidance because narration recordings are not available.

Reviewed against main `89dfc04` (Build 27), including implementation commit `97c7d7b`. Code inspection is not physical-device verification.

## Acceptance and verification

Supply narration assets, implement audible on/off behaviour, and place the selected sound label beneath the guidance control as designed. Do not expose a switch with no audible effect.

Record the tested build, device, result and evidence before closing. Original Apple feedback remains unchanged.
