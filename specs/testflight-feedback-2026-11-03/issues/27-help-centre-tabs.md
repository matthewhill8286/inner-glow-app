# Make the Help Centre one tabbed screen

Priority: P2

Status: Implemented — checked in the iPhone simulator; device retest required

## Source feedback

- Report 44, Build 27, 12:46 UTC: "I need to make changes here" on the Help Centre FAQ.

## Fix

FAQ and Contact us were two screens, and Contact us pushed a new view. They are now one screen in `components/help/HelpCentre.tsx`. The nav bar, "How can we help?" and the switch stay fixed, and only the content below changes. The switch follows frames `6722:4755` and `6722:4837`, and `/support` opens the Contact us tab.
