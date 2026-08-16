-- Local/dev test fixture: one client, one session, one exercise of each
-- type. Fixed UUIDs so this is safe to re-run (on conflict do nothing).

insert into clients (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp (seed)')
on conflict (id) do nothing;

insert into sessions (id, client_id, name, status) values
  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Acme Discovery Session (seed)',
   'open')
on conflict (id) do nothing;

insert into exercises (id, session_id, type, position, config) values
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000002',
   'values_tension',
   0,
   '{"pairs":[
     {"id":"p1","left":"Speed","right":"Craft"},
     {"id":"p2","left":"Bold","right":"Safe"}
   ]}'::jsonb),

  ('00000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000002',
   'word_choice',
   1,
   '{"pairs":[
     {"id":"p1","left":"Modern","right":"Timeless"},
     {"id":"p2","left":"Playful","right":"Serious"}
   ]}'::jsonb),

  ('00000000-0000-0000-0000-000000000012',
   '00000000-0000-0000-0000-000000000002',
   'keep_cut',
   2,
   '{}'::jsonb),

  ('00000000-0000-0000-0000-000000000013',
   '00000000-0000-0000-0000-000000000002',
   'visual_reaction',
   3,
   '{"images":[
     {"id":"img1","url":"https://picsum.photos/seed/1/800/600","order":0},
     {"id":"img2","url":"https://picsum.photos/seed/2/800/600","order":1}
   ]}'::jsonb),

  ('00000000-0000-0000-0000-000000000014',
   '00000000-0000-0000-0000-000000000002',
   'perceptual_map',
   4,
   '{"xAxis":{"left":"Legacy","right":"Emerging"},
     "yAxis":{"bottom":"Regional","top":"National"},
     "competitors":[
       {"id":"c1","name":"Competitor A"},
       {"id":"c2","name":"Competitor B"},
       {"id":"c3","name":"Us"}
     ]}'::jsonb)
on conflict (id) do nothing;
