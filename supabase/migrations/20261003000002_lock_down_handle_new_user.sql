revoke execute on function public.handle_new_user() from public, anon, authenticated;
comment on table public.pitches is 'Service-role only: contains hidden outcomes. RLS enabled with no policies on purpose.';
