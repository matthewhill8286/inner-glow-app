type ModerationResult = { flagged: boolean };
function validatedResults(value: unknown): ModerationResult[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.some((item) => typeof item?.flagged !== 'boolean')
  ) {
    throw new Error('Moderation result missing');
  }
  return value;
}
/** Both paths require actual omni-moderation results. Never infer safety from generated text. */
export async function moderateCommunityText(
  content: string,
  apiKey: string,
  request: typeof fetch = fetch,
): Promise<boolean> {
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const response = await request('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ model: 'omni-moderation-latest', input: content }),
  });
  if (response.ok) {
    const data = await response.json();
    return validatedResults(data.results).some((item) => item.flagged);
  }
  if (response.status !== 403) throw new Error(`Moderation returned ${response.status}`);
  // Some projects reject the standalone endpoint but support documented inline moderation.
  const inline = await request('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1,
      messages: [
        { role: 'system', content: 'Reply OK.' },
        { role: 'user', content },
      ],
      moderation: { model: 'omni-moderation-latest' },
    }),
  });
  if (!inline.ok) throw new Error(`Inline moderation returned ${inline.status}`);
  const data = await inline.json();
  const input = data.moderation?.input;
  if (input?.type !== 'moderation_results') throw new Error('Input moderation result missing');
  return validatedResults(input.results).some((item) => item.flagged);
}
