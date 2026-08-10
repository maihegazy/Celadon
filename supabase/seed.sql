-- Celadon — catalogue seed.
--
-- The foods and recipes from the approved design, in both languages. Safe to
-- re-run: everything upserts on its natural key.
--
-- Applied automatically by `supabase db reset`; for a hosted project run it
-- once from the SQL editor.

/* ── foods ────────────────────────────────────────────────────────────── */

insert into public.foods (slug, name_en, name_ar, note_en, note_ar, celadon_score, tone, category, calories_per_100g)
values
  ('turmeric', 'Turmeric', 'الكركم',
   'Curcumin — best absorbed with black pepper and fat',
   'الكركمين — يُمتصّ بشكل أفضل مع الفلفل الأسود والدهون',
   92, 'supportive', 'spices', 312),
  ('sumac', 'Sumac', 'السمّاق',
   'Antioxidant-rich souring spice, easy daily habit',
   'بهار حامض غني بمضادات الأكسدة، عادة يومية سهلة',
   88, 'supportive', 'spices', 260),
  ('white-pita', 'White pita', 'العيش الأبيض',
   'Refined flour — contains gluten',
   'دقيق مكرر — يحتوي على الغلوتين',
   38, 'limit', 'grains', 275),
  ('salmon', 'Wild salmon', 'سلمون بري',
   'Rich in omega-3 EPA/DHA — one of the strongest anti-inflammatory foods',
   'غني بأوميغا ٣ — من أقوى الأطعمة المضادة للالتهاب',
   95, 'supportive', 'fish', 208),
  ('olive-oil', 'Extra-virgin olive oil', 'زيت زيتون بكر ممتاز',
   'Oleocanthal has well-studied anti-inflammatory activity',
   'الأوليوكانثال له نشاط مضاد للالتهاب مدروس جيدًا',
   94, 'supportive', 'pantry', 884),
  ('quinoa', 'Quinoa', 'كينوا',
   'Gluten-free whole grain, gentle on most protocols',
   'حبة كاملة خالية من الغلوتين، لطيفة على معظم الأنظمة',
   76, 'balanced', 'grains', 120),
  ('molokhia', 'Molokhia', 'ملوخية',
   'Leafy green, high in fibre and minerals',
   'ورق أخضر غني بالألياف والمعادن',
   90, 'supportive', 'greens', 58),
  ('walnuts', 'Walnuts', 'جوز',
   'Plant omega-3 (ALA) and polyphenols',
   'أوميغا ٣ نباتية ومركّبات بوليفينول',
   89, 'supportive', 'nuts', 654),
  ('labneh', 'Labneh', 'لبنة',
   'Strained, probiotic — daily-friendly',
   'مصفّاة وغنية بالبروبيوتيك — مناسبة يوميًا',
   76, 'balanced', 'dairy', 160),
  ('feta', 'Feta', 'جبن فيتا',
   'Aged, salty — occasional accent',
   'معتّقة ومملّحة — لمسة عرضية',
   46, 'limit', 'dairy', 265),
  ('tomatoes', 'Cherry tomatoes', 'طماطم كرزية',
   'Nightshade — fine for most, worth watching if your joints flare',
   'من الباذنجانيات — مناسبة لمعظم الناس، وتستحق الملاحظة إن تهيّجت مفاصلك',
   70, 'balanced', 'produce', 18),
  ('green-tea', 'Green tea', 'شاي أخضر',
   'Anti-inflammatory catechins', 'كاتيكينات مضادة للالتهاب',
   90, 'supportive', 'drinks', 1),
  ('dates', 'Dates', 'تمر',
   'Natural sweetness, some fibre', 'حلاوة طبيعية وبعض الألياف',
   72, 'balanced', 'produce', 282),
  ('chickpeas', 'Chickpeas', 'حمص',
   'Legume — excluded on some protocols', 'من البقوليات — مستبعدة في بعض الأنظمة',
   74, 'balanced', 'legumes', 164)
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  note_en = excluded.note_en,
  note_ar = excluded.note_ar,
  celadon_score = excluded.celadon_score,
  tone = excluded.tone,
  category = excluded.category,
  calories_per_100g = excluded.calories_per_100g;

/* ── recipes ──────────────────────────────────────────────────────────── */

insert into public.recipes (
  slug, name_en, name_ar, blurb_en, blurb_ar, why_en, why_ar,
  minutes, base_servings, celadon_score, classification,
  calories, protein_g, carbs_g, fat_g, fibre_g, cuisine, tags
)
values
  ('salmon-quinoa-bowl', 'Salmon quinoa bowl', 'سلطة السلمون بالكينوا',
   'Wild salmon over herbed quinoa with cucumber, avocado and a lemon–olive oil dressing.',
   'سلمون بري فوق كينوا بالأعشاب مع الخيار والأفوكادو وصلصة الليمون وزيت الزيتون.',
   'Salmon and olive oil are among the best-studied foods for an anti-inflammatory pattern.',
   'السلمون وزيت الزيتون من أكثر الأطعمة دراسةً ضمن النمط المضاد للالتهاب.',
   25, 2, 86, 'supportive', 540, 34, 42, 21, 6, 'mediterranean', array['omega3', 'quick']),
  ('molokhia-grilled-chicken', 'Molokhia with grilled chicken', 'ملوخية بالدجاج المشوي',
   'The Egyptian classic, with grilled chicken and plenty of coriander and garlic.',
   'الطبق المصري الكلاسيكي، مع دجاج مشوي وكثير من الكزبرة والثوم.',
   'Leafy greens and lean protein, with no gluten or nightshades.',
   'أوراق خضراء وبروتين خفيف، بلا غلوتين ولا باذنجانيات.',
   35, 4, 88, 'supportive', 520, 38, 30, 22, 8, 'egyptian', array['supportive', 'batch']),
  ('zaatar-baked-cod', 'Za''atar baked cod', 'سمك القد بالزعتر',
   'Cod baked with za''atar and lemon, alongside sautéed greens.',
   'سمك القد بالزعتر والليمون، مع خضار سوتيه.',
   'A second omega-3 source for the week, ready in twenty minutes.',
   'مصدر أوميغا ٣ إضافي للأسبوع، جاهز في عشرين دقيقة.',
   20, 2, 88, 'supportive', 480, 36, 18, 24, 5, 'levantine', array['omega3', 'quick']),
  ('shorbet-ads', 'Shorbet ads (red lentil soup)', 'شوربة عدس أحمر',
   'Red lentil soup with cumin, finished with lemon.',
   'شوربة عدس أحمر بالكمون، مع رشة ليمون.',
   'Gentle on digestion and easy to batch for the week.',
   'لطيفة على الهضم وسهلة التحضير بكميات للأسبوع.',
   30, 4, 82, 'supportive', 460, 20, 58, 12, 11, 'egyptian', array['gut-gentle', 'batch']),
  ('bessara-greens', 'Bessara with greens', 'بصارة بالخضار',
   'Split fava purée with herbs and a pour of olive oil.',
   'بوريه الفول المدشوش بالأعشاب مع زيت الزيتون.',
   'A familiar breakfast that happens to be fibre-dense and plant-forward.',
   'فطور مألوف يصادف أنه غني بالألياف ونباتي في أساسه.',
   10, 2, 84, 'supportive', 320, 16, 38, 12, 10, 'egyptian', array['supportive', 'quick']),
  ('ginger-carrot-soup', 'Ginger carrot soup', 'شوربة جزر بالزنجبيل',
   'Roasted carrots blended with ginger and a little coconut milk.',
   'جزر مشوي مخلوط بالزنجبيل وقليل من حليب جوز الهند.',
   'Ginger is a well-tolerated anti-inflammatory, and this is easy on a rough day.',
   'الزنجبيل مضاد للالتهاب ومقبول جيدًا، وهذه الشوربة لطيفة في الأيام الصعبة.',
   35, 4, 80, 'supportive', 260, 6, 34, 11, 7, 'international', array['gut-gentle'])
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  blurb_en = excluded.blurb_en,
  blurb_ar = excluded.blurb_ar,
  why_en = excluded.why_en,
  why_ar = excluded.why_ar,
  minutes = excluded.minutes,
  celadon_score = excluded.celadon_score,
  classification = excluded.classification,
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  fibre_g = excluded.fibre_g,
  cuisine = excluded.cuisine,
  tags = excluded.tags;

/* ── salmon bowl: ingredients, method, substitutions ──────────────────── */

delete from public.recipe_ingredients
where recipe_id = (select id from public.recipes where slug = 'salmon-quinoa-bowl');

insert into public.recipe_ingredients
  (recipe_id, position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
select r.id, v.position, v.food_slug, v.name_en, v.name_ar, v.quantity, v.unit_en, v.unit_ar, v.tone::public.ingredient_tone
from public.recipes r,
  (values
    (1, 'salmon', 'Wild salmon', 'سلمون بري', 300, 'g', 'غ', 'supportive'),
    (2, 'quinoa', 'Quinoa, cooked', 'كينوا مطهوّة', 160, 'g', 'غ', 'balanced'),
    (3, null, 'Avocado', 'أفوكادو', 1, null, null, 'supportive'),
    (4, null, 'Cucumber & herbs', 'خيار وأعشاب', 2, 'cup', 'كوب', 'balanced'),
    (5, 'olive-oil', 'Lemon–olive oil dressing', 'صلصة الليمون وزيت الزيتون', 2, 'tbsp', 'ملعقة كبيرة', 'supportive')
  ) as v(position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
where r.slug = 'salmon-quinoa-bowl';

delete from public.recipe_steps
where recipe_id = (select id from public.recipes where slug = 'salmon-quinoa-bowl');

insert into public.recipe_steps (recipe_id, position, text_en, text_ar)
select r.id, v.position, v.text_en, v.text_ar
from public.recipes r,
  (values
    (1, 'Rinse the quinoa and simmer 15 minutes with a pinch of salt.',
        'اشطف الكينوا واتركها على نار هادئة ١٥ دقيقة مع رشة ملح.'),
    (2, 'Season the salmon with lemon, cumin and olive oil; grill 4 minutes per side.',
        'تبّل السلمون بالليمون والكمون وزيت الزيتون، واشوِه ٤ دقائق لكل جهة.'),
    (3, 'Toss cucumber and herbs with the lemon–olive oil dressing.',
        'قلّب الخيار والأعشاب مع صلصة الليمون وزيت الزيتون.'),
    (4, 'Assemble over the quinoa, top with avocado and finish with sumac.',
        'رتّب المكوّنات فوق الكينوا، وأضف الأفوكادو ورشة سماق.')
  ) as v(position, text_en, text_ar)
where r.slug = 'salmon-quinoa-bowl';

delete from public.recipe_substitutions
where recipe_id = (select id from public.recipes where slug = 'salmon-quinoa-bowl');

insert into public.recipe_substitutions (recipe_id, from_en, from_ar, to_en, to_ar)
select r.id, v.from_en, v.from_ar, v.to_en, v.to_ar
from public.recipes r,
  (values
    ('Quinoa', 'الكينوا', 'brown rice, if quinoa is hard to find', 'أرز بني، إن كان من الصعب إيجاد الكينوا'),
    ('Avocado', 'الأفوكادو', 'extra olive oil and toasted walnuts', 'زيت زيتون إضافي وجوز محمّص')
  ) as v(from_en, from_ar, to_en, to_ar)
where r.slug = 'salmon-quinoa-bowl';

/* ── remaining recipes: ingredients ───────────────────────────────────────
   Enough to cook from and to derive the week's shopping list. Linked into
   the foods catalogue by slug where an entry exists. */

delete from public.recipe_ingredients
where recipe_id in (select id from public.recipes where slug in
  ('molokhia-grilled-chicken', 'zaatar-baked-cod', 'shorbet-ads', 'bessara-greens', 'ginger-carrot-soup'));

insert into public.recipe_ingredients
  (recipe_id, position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
select r.id, v.position, v.food_slug, v.name_en, v.name_ar, v.quantity, v.unit_en, v.unit_ar, v.tone::public.ingredient_tone
from public.recipes r,
  (values
    (1, 'molokhia', 'Molokhia leaves', 'ورق ملوخية', 400, 'g', 'غ', 'supportive'),
    (2, null, 'Chicken breast', 'صدر دجاج', 500, 'g', 'غ', 'balanced'),
    (3, null, 'Garlic', 'ثوم', 6, 'clove', 'فص', 'supportive'),
    (4, null, 'Fresh coriander', 'كزبرة خضراء', 1, 'bunch', 'حزمة', 'supportive'),
    (5, 'olive-oil', 'Extra-virgin olive oil', 'زيت زيتون بكر ممتاز', 2, 'tbsp', 'ملعقة كبيرة', 'supportive'),
    (6, null, 'Brown rice', 'أرز بني', 300, 'g', 'غ', 'balanced')
  ) as v(position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
where r.slug = 'molokhia-grilled-chicken';

insert into public.recipe_ingredients
  (recipe_id, position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
select r.id, v.position, v.food_slug, v.name_en, v.name_ar, v.quantity, v.unit_en, v.unit_ar, v.tone::public.ingredient_tone
from public.recipes r,
  (values
    (1, null, 'Cod fillets', 'شرائح سمك القد', 400, 'g', 'غ', 'supportive'),
    (2, null, 'Za''atar', 'زعتر', 2, 'tbsp', 'ملعقة كبيرة', 'supportive'),
    (3, 'olive-oil', 'Extra-virgin olive oil', 'زيت زيتون بكر ممتاز', 3, 'tbsp', 'ملعقة كبيرة', 'supportive'),
    (4, null, 'Lemons', 'ليمون', 2, null, null, 'supportive'),
    (5, 'tomatoes', 'Cherry tomatoes', 'طماطم كرزية', 250, 'g', 'غ', 'balanced')
  ) as v(position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
where r.slug = 'zaatar-baked-cod';

insert into public.recipe_ingredients
  (recipe_id, position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
select r.id, v.position, v.food_slug, v.name_en, v.name_ar, v.quantity, v.unit_en, v.unit_ar, v.tone::public.ingredient_tone
from public.recipes r,
  (values
    (1, null, 'Red lentils', 'عدس أحمر', 300, 'g', 'غ', 'supportive'),
    (2, null, 'Onion', 'بصل', 1, null, null, 'balanced'),
    (3, null, 'Carrots', 'جزر', 2, null, null, 'supportive'),
    (4, null, 'Ground cumin', 'كمون مطحون', 2, 'tsp', 'ملعقة صغيرة', 'supportive'),
    (5, 'turmeric', 'Turmeric', 'كركم', 1, 'tsp', 'ملعقة صغيرة', 'supportive'),
    (6, 'olive-oil', 'Extra-virgin olive oil', 'زيت زيتون بكر ممتاز', 2, 'tbsp', 'ملعقة كبيرة', 'supportive')
  ) as v(position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
where r.slug = 'shorbet-ads';

insert into public.recipe_ingredients
  (recipe_id, position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
select r.id, v.position, v.food_slug, v.name_en, v.name_ar, v.quantity, v.unit_en, v.unit_ar, v.tone::public.ingredient_tone
from public.recipes r,
  (values
    (1, null, 'Split fava beans', 'فول مقشور', 250, 'g', 'غ', 'supportive'),
    (2, null, 'Leafy greens', 'خضار ورقية', 200, 'g', 'غ', 'supportive'),
    (3, null, 'Garlic', 'ثوم', 4, 'clove', 'فص', 'supportive'),
    (4, null, 'Ground cumin', 'كمون مطحون', 1, 'tsp', 'ملعقة صغيرة', 'supportive'),
    (5, 'olive-oil', 'Extra-virgin olive oil', 'زيت زيتون بكر ممتاز', 2, 'tbsp', 'ملعقة كبيرة', 'supportive')
  ) as v(position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
where r.slug = 'bessara-greens';

insert into public.recipe_ingredients
  (recipe_id, position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
select r.id, v.position, v.food_slug, v.name_en, v.name_ar, v.quantity, v.unit_en, v.unit_ar, v.tone::public.ingredient_tone
from public.recipes r,
  (values
    (1, null, 'Carrots', 'جزر', 6, null, null, 'supportive'),
    (2, null, 'Fresh ginger', 'زنجبيل طازج', 30, 'g', 'غ', 'supportive'),
    (3, null, 'Onion', 'بصل', 1, null, null, 'balanced'),
    (4, null, 'Vegetable stock', 'مرق خضار', 1, 'l', 'لتر', 'balanced'),
    (5, 'olive-oil', 'Extra-virgin olive oil', 'زيت زيتون بكر ممتاز', 2, 'tbsp', 'ملعقة كبيرة', 'supportive')
  ) as v(position, food_slug, name_en, name_ar, quantity, unit_en, unit_ar, tone)
where r.slug = 'ginger-carrot-soup';
