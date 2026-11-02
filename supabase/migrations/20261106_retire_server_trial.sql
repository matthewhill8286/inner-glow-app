-- The free week is now the App Store intro offer on the yearly plan (08 §2.4–2.5), and the app no
-- longer calls the server trial. Any signed-in user could still call start_free_trial() directly to
-- give themselves seven days of Pro, so remove it. Existing trial rows keep working until they end.
DROP FUNCTION IF EXISTS public.start_free_trial();
