update public.evaluation_categories as category
set name = approved.name
from (values
  ('category-1', 'Výsledky písomného testu z ANJ'),
  ('category-2', 'Schopnosť komunikácie v anglickom jazyku – interview'),
  ('category-3', 'Odborné predmety – hodnotenie'),
  ('category-4', 'Vyjadrenie triedneho učiteľa – správanie / integrácia / inklúzia / spoľahlivosť'),
  ('category-5', 'Vyjadrenie majstra odbornej výchovy')
) as approved(slug, name)
where category.slug = approved.slug;
