# `exercises.config` and `responses.payload` shapes

`config` is facilitator-authored exercise setup (written by the service-role
client). `payload` is what an attendee submits (written by the anon client,
insert-only, never readable back by anon). Both are untyped `jsonb` at the
database level — this is the source of truth for their shapes per exercise
`type`.

Every `payload` that represents a choice among multiple items (a pair, an
image) must include that item's id under the key `pairId` or `imageId` —
`responses.item_key` is a generated column derived from those keys and is
what the unique constraint `(exercise_id, attendee_id, item_key)` is built
on. Get the key name wrong and duplicate-submission protection silently
stops working for that exercise type.

## `values_tension` / `word_choice`

Same shape for both — only the copy differs (value-pair vs. single
descriptive word).

**config**
```json
{
  "pairs": [
    { "id": "p1", "left": "Speed", "right": "Craft" }
  ]
}
```

**payload** (one row per attendee per pair)
```json
{ "pairId": "p1", "choice": "left", "note": "optional short text" }
```
`choice` is `"left"` or `"right"`. `note` is optional.

## `keep_cut`

**config**: `{}` — no facilitator setup needed.

**payload** (one row per attendee for the whole exercise — no `pairId`, so
`item_key` is `''`, which is what makes the unique constraint enforce
"one submission per attendee" here instead of "one per item")
```json
{ "keep": "the thing they couldn't lose", "cut": "the thing that needs to go" }
```

Content-hiding pre-reveal is enforced by the server action layer (a
service-role query that selects `id`/`attendee_id` but never `payload` while
`exercises.reveal_state = 'hidden'`), not by RLS — anon can never read
`payload` regardless of reveal state anyway.

## `visual_reaction`

**config**
```json
{
  "images": [
    { "id": "img1", "url": "https://.../image.jpg", "path": "exerciseId/uuid.jpg", "order": 0 }
  ]
}
```
`url` is a public Supabase Storage URL (bucket `visual-reaction`). `path`
is the bucket-relative storage path, kept alongside `url` so removing an
image can delete the actual blob without reverse-parsing it out of the URL.

**payload** (one row per attendee per image)
```json
{ "imageId": "img1", "reaction": "up", "note": "optional short text" }
```
`reaction` is `"up"` or `"down"`.

## `perceptual_map`

**config**
```json
{
  "xAxis": { "left": "Legacy", "right": "Emerging" },
  "yAxis": { "bottom": "Regional", "top": "National" },
  "competitors": [{ "id": "c1", "name": "Competitor A" }]
}
```

**payload** (one row per attendee for the whole exercise — all competitor
placements submitted together, so again no `pairId`/`imageId` and `item_key`
is `''`)
```json
{
  "placements": [
    { "competitorId": "c1", "x": 0.42, "y": 0.87 }
  ]
}
```
`x`/`y` are normalized `0..1` within the axis bounds, not pixel coordinates.

## `priority_ranking`

**config**
```json
{
  "items": [{ "id": "i1", "label": "Speed to market" }]
}
```

**payload** (one row per attendee for the whole exercise - the attendee's
full ranking submitted together, so again no `pairId`/`imageId` and
`item_key` is `''`)
```json
{ "order": ["i1", "i3", "i2"] }
```
`order` is every item id, most important first. Results are scored as a
Borda count: within one respondent's ranking of `n` items, the item at
index `i` earns `n - i` points, summed across respondents (see
`/api/facilitator/priority-ranking-results/[exerciseId]`).
