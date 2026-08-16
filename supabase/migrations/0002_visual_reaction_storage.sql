-- Phase 5: Storage bucket for visual_reaction exercise images.
--
-- Created live via the Storage API (service-role key) rather than this
-- file, since the direct Postgres connection needed to run migration SQL
-- wasn't available in that environment - this file exists so the bucket is
-- reproducible from a fresh project, and so `supabase db push` doesn't
-- silently diverge from what's actually deployed.
--
-- Public bucket: images are shown to attendees on spotty event wifi, so
-- serving them via plain public URLs (no signed-URL round trip) matters
-- more than access control here - there's nothing sensitive in reference
-- images a facilitator chose to project.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visual-reaction',
  'visual-reaction',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
