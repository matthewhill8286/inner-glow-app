# 01 — Show medication details only after an explicit Yes

**Priority:** P1

**Status:** implemented — awaiting next binary/device verification

**Blocked by:** None — can start immediately.

**Source:** User report, 17 October 2026. Confirmed in current source: the details step was in the unconditional assessment step list.

**Reproduction:** In assessment, answer No to taking medication and press Next. The app previously still opened medication details.

**What to build:** The assessment omits medication details unless taking medication is Yes. Next, Back, step count and completion use the same conditional route.

## Acceptance criteria

- [ ] No, Not sure and unanswered skip directly from medication use to other symptoms.
- [ ] Yes opens medication details and retains its existing required-details validation.
- [ ] Back from symptoms skips details for non-Yes answers and returns to details for Yes.
- [ ] Changing Yes to No clears saved medication names and the unsaved medication input.
- [ ] Progress and Complete use the visible step count, with no missing final question.

## Triage and validation

Implemented locally on 17 October. TypeScript and 55 tests pass, including two new branching regression tests. This change is not in submitted Build 23.

## Implementation verification

Source changes and automated checks are complete. Browser evidence is available in ../verification/. Native acceptance checks require the next binary. 
