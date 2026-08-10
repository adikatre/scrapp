insert into public.jurisdictions (id, country_code, region, municipality, timezone, supported_locales, status)
values ('us-ca-san-diego', 'US', 'California', 'City of San Diego', 'America/Los_Angeles', array['en'], 'supported')
on conflict (id) do nothing;

insert into public.service_profiles (id, jurisdiction_id, name, property_type, provider_name)
values
  ('sd-city-serviced-home', 'us-ca-san-diego', 'City-serviced home', 'city-serviced-home', 'City of San Diego Environmental Services'),
  ('sd-service-unknown', 'us-ca-san-diego', 'Provider not confirmed', 'unknown', null)
on conflict (id) do nothing;

insert into public.rule_sources (id, publisher, title, url, language, last_checked, verification_status)
values
  ('sd-what-goes-where', 'City of San Diego Environmental Services', 'What Goes Where and curbside recycling resources', 'https://www.sandiego.gov/environmental-services/recycling', 'en', '2026-08-09', 'official'),
  ('sd-household-hazardous-waste', 'City of San Diego Environmental Services', 'Household Hazardous Waste', 'https://www.sandiego.gov/environmental-services/ep/hazardous', 'en', '2026-08-09', 'official')
on conflict (id) do nothing;

insert into public.materials (id, canonical_name, hazard_tags)
values
  ('plastic-bottle', 'Plastic bottle or jug', '{}'),
  ('plastic-film', 'Plastic bag or film', '{}'),
  ('food-scraps', 'Food scraps', '{}'),
  ('battery', 'Battery', array['fire', 'chemical']),
  ('electronics', 'Electronics or cable', array['battery-possible'])
on conflict (id) do nothing;

insert into public.rule_versions (
  id, material_id, jurisdiction_id, service_profile_id, source_id, route, bin,
  instruction, preparation, safety, search_queries, location_eligible,
  effective_from, priority, review_status, published_at
)
values
  ('sd-plastic-bottle-v1', 'plastic-bottle', 'us-ca-san-diego', 'sd-city-serviced-home', 'sd-what-goes-where', 'recycle', 'Blue Bin (Recycling)', 'Put it loose in the blue recycling bin.', '["Empty the container","Rinse away food or liquid","Replace the cap"]', '[]', '[]', false, '2026-01-01', 100, 'published', now()),
  ('sd-plastic-film-v1', 'plastic-film', 'us-ca-san-diego', 'sd-city-serviced-home', 'sd-what-goes-where', 'trash', 'Gray Bin (Trash)', 'Put it in the gray trash bin, never the blue recycling bin.', '["Contain loose film so it cannot blow away"]', '[]', '[]', false, '2026-01-01', 100, 'published', now()),
  ('sd-food-scraps-v1', 'food-scraps', 'us-ca-san-diego', 'sd-city-serviced-home', 'sd-what-goes-where', 'compost', 'Green Bin (Organics)', 'Put food scraps in the green organics bin.', '["Remove all plastic, glass, and metal"]', '[]', '[]', false, '2026-01-01', 100, 'published', now()),
  ('sd-battery-v1', 'battery', 'us-ca-san-diego', null, 'sd-household-hazardous-waste', 'hazardous-waste', 'Special Drop-off', 'Keep every battery out of curbside bins and use a verified drop-off.', '["Tape exposed terminals"]', '["Do not place batteries in curbside carts"]', '["battery recycling drop-off"]', true, '2026-01-01', 100, 'published', now()),
  ('sd-electronics-v1', 'electronics', 'us-ca-san-diego', null, 'sd-household-hazardous-waste', 'e-waste', 'Special Drop-off', 'Use a verified electronics recycling program.', '["Remove personal data where possible"]', '[]', '["electronics recycling"]', true, '2026-01-01', 100, 'published', now())
on conflict (id) do nothing;
