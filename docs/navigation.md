# Feature navigation

The five primary tabs are Home, Chat, Journal, Mood and Profile. Community, Notifications, Sleep, Stress, Mindfulness and Freud Score have their own nested stacks. Community is accessible from Home and Profile and remains free for signed-in users; posting still requires community consent and server moderation.

## Back and completion rules

- Ordinary Back pops the actual history, preserving the screen the user came from.
- A direct link without history returns to its feature root. Nested breathing exercises and stress videos return to their respective lists.
- Finishing a form dismisses the intermediate form screens to the feature root, preventing Back from reopening a completed form.
- Notifications carry a Home or Profile origin. Details dismiss to the inbox, and the inbox explicitly returns to that origin. It never pops into a previous detail screen.
- Existing flat URLs redirect to canonical feature paths through a separate legacy stack outside the tab navigator. Safe content parameters are preserved, while nested navigator controls are discarded.
- Refreshing authentication for the same account preserves the mounted navigation tree. Changing accounts or signing out rechecks access.

## Canonical feature paths

Profile utilities use `/profile/edit`, `/profile/overview` and `/profile/categories`. Community children use `/community/new-post`, `/community/post`, `/community/profile`, `/community/filter`, `/community/notifications` and `/community/post-success`. Community filters now open as a modal bottom sheet over the existing feed. The `/community/filter` route is retained only to redirect existing links into that sheet. The notification inbox uses `/notifications`, and its detail uses `/notifications/detail`.

## Verification

Automated navigation tests cover canonical routes, old links, parent fallbacks, completion dismissal and notification origins. A component test verifies that same-account token refresh does not reset history. Browser checks verified direct legacy Profile links, Community filters, and Home/Profile notification return flows. Native gestures and hardware Back require verification in the next binary. Build 23 is not changed by this source refactor.
