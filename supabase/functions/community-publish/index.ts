import { moderateCommunityText } from '../_shared/community-moderation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token || '');
  if (authError || !user)
    return Response.json({ error: 'Authentication required' }, { status: 401, headers });
  try {
    const body = await req.json();
    const { type } = body;
    if (!['post', 'comment', 'profile'].includes(type))
      return Response.json({ error: 'Invalid content type' }, { status: 400, headers });
    const content =
      type === 'profile'
        ? [body.displayName, body.bio].filter(Boolean).join('\n')
        : body.content?.trim();
    if (
      typeof content !== 'string' ||
      !content ||
      content.length > (type === 'comment' ? 500 : 5000)
    ) {
      return Response.json({ error: 'Content is empty or too long' }, { status: 400, headers });
    }
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('Moderation is not configured');
    if (await moderateCommunityText(content, apiKey)) {
      return Response.json(
        { error: 'This content cannot be published. Please review the Community Guidelines.' },
        { status: 422, headers },
      );
    }
    let write;
    if (type === 'post') {
      if (
        !['self-care', 'mindfulness', 'cheers', 'support', 'therapy', 'others'].includes(
          body.category,
        )
      ) {
        return Response.json({ error: 'Invalid category' }, { status: 400, headers });
      }
      write = await sb
        .from('community_posts')
        .insert({
          user_id: user.id,
          content,
          category: body.category,
          post_type: 'story',
          is_hidden: body.isHidden === true,
        })
        .select()
        .single();
    } else if (type === 'comment') {
      // Read using the caller's JWT so hidden/blocked posts cannot be targeted.
      const caller = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: `Bearer ${token}` } } },
      );
      const { data: post, error } = await caller
        .from('community_posts')
        .select('id')
        .eq('id', body.postId)
        .single();
      if (error || !post)
        return Response.json({ error: 'Post unavailable' }, { status: 404, headers });
      write = await sb
        .from('community_comments')
        .insert({ user_id: user.id, post_id: post.id, content })
        .select()
        .single();
    } else {
      if (body.displayName?.length > 80 || body.bio?.length > 500)
        return Response.json({ error: 'Profile is too long' }, { status: 400, headers });
      const updates: Record<string, string> = {};
      if (typeof body.displayName === 'string') updates.display_name = body.displayName.trim();
      if (typeof body.bio === 'string') updates.bio = body.bio;
      if (typeof body.avatar === 'string' && body.avatar.length <= 32) updates.avatar = body.avatar;
      write = await sb
        .from('community_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
    }
    if (write.error) throw write.error;
    return Response.json({ data: write.data }, { headers });
  } catch (err) {
    console.error('[community-publish]', err);
    return Response.json(
      { error: 'Unable to publish right now. Please try again.' },
      { status: 503, headers },
    );
  }
});
