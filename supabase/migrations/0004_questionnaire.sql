-- Phase 7: Questionnaire exercise type - async pre-session intake, not a
-- live in-room exercise. Reuses the same exercises/attendees/responses
-- schema as every other exercise type (one response row per attendee for
-- the whole exercise, same as keep_cut/perceptual_map/priority_ranking -
-- item_key stays ''). What's different is entirely at the app layer: it's
-- deliberately excluded from /join/[sessionId]'s live exercise queue and
-- answered instead via its own public /questionnaire/[sessionId] link,
-- meant to be sent out before the session, with results readable by the
-- facilitator any time (no reveal-state gating).

alter type exercise_type add value 'questionnaire';
