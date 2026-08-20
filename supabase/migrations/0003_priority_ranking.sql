-- Phase 6: Priority Ranking exercise type.
--
-- Facilitator sets up a list of items; each attendee submits their own full
-- ranking of them in one go. Same "single response per attendee" shape as
-- keep_cut/perceptual_map - no pairId/imageId in the payload, so
-- responses.item_key is '' and the existing unique constraint already
-- enforces one submission per attendee for this type too. No new tables,
-- columns, or RLS policies needed - just the new enum value.

alter type exercise_type add value 'priority_ranking';
