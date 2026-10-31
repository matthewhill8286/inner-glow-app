import type { ChatMessage } from './types';

export function conversationTitle(messages: ChatMessage[], fallback: string): string {
  const opening = messages.find((message) => message.role === 'user' && message.content.trim());
  return opening?.content.replace(/\s+/g, ' ').trim() || fallback;
}
export function conversationPreview(messages: ChatMessage[]): string {
  const last = messages.at(-1);
  return last
    ? `${last.role === 'user' ? 'You: ' : ''}${last.content.replace(/\s+/g, ' ').trim()}`
    : 'No messages yet';
}
export function matchesConversation(
  query: string,
  title: string,
  coach: string,
  topic: string,
): boolean {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = `${title} ${coach} ${topic}`.toLocaleLowerCase();
  return terms.every((term) => text.includes(term));
}
/** Retry the existing user turn instead of adding a second copy. */
export function prepareChatTurn(
  messages: ChatMessage[],
  message: ChatMessage,
  retry: boolean,
): ChatMessage[] {
  if (retry) {
    const last = messages.at(-1);
    if (!last || last.role !== 'user' || last.content !== message.content)
      throw new Error('This message can no longer be retried.');
    return messages;
  }
  return [...messages, message];
}
