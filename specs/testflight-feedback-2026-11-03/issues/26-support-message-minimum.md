# Explain why Send is disabled on Message our team

Priority: P2

Status: Implemented — checked in the iPhone simulator; device retest required

## Source feedback

- Report 43, Build 27, 12:45 UTC: "Send button doesn't work". The screenshot shows the message "You smell" and the consent box ticked, with Send disabled.

## Cause

The contact-support function accepts 20 to 5000 characters, so Send stays disabled below 20. The only mention of the minimum was the placeholder, which disappears as soon as the person types.

## Fix

`app/(utils)/support-message.tsx` shows "N more characters and you can send it." under the field while the message is between 1 and 19 characters.
