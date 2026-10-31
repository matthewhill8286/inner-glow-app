// A new conversation's opening text stays in memory instead of the navigation URL.
const drafts = new Map<string, string>();
export function stageChatDraft(key: string, message: string): string {
  drafts.set(key, message);
  // Bound memory if a user repeatedly abandons draft conversations.
  if (drafts.size > 20) drafts.delete(drafts.keys().next().value!);
  return key;
}
export function takeChatDraft(key: string): string | undefined {
  const message = drafts.get(key);
  drafts.delete(key);
  return message;
}
