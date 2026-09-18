-- TakeStart demo seed: кафе «Dana Food» (slug: dana-food).
-- Цены в тиынах. Применяется: pnpm db:seed:local
-- Повторный прогон безопасен (INSERT OR REPLACE / IGNORE).

INSERT OR REPLACE INTO shops
  (id, owner_id, slug, name, whatsapp_e164, currency, logo_r2_key, address_text,
   fulfillment_mode, delivery_fee_tiyin, min_order_tiyin, is_active, created_at)
VALUES
  ('shop_dana', 'owner_demo', 'dana-food', 'Dana Food', '77711779855', 'KZT', NULL,
   'Алматы, ул. Абая 10', 'both', 50000, 0, 1, 1726636800000);

INSERT OR IGNORE INTO categories (id, shop_id, name_ru, name_kk, name_en, sort_order) VALUES
  ('cat_soups', 'shop_dana', 'Супы', 'Сорпалар', 'Soups', 1),
  ('cat_mains', 'shop_dana', 'Горячее', 'Ыстық тағамдар', 'Mains', 2),
  ('cat_drinks', 'shop_dana', 'Напитки', 'Сусындар', 'Drinks', 3);

INSERT OR REPLACE INTO products
  (id, shop_id, category_id, name_ru, name_kk, name_en,
   desc_ru, desc_kk, desc_en, price_tiyin, photo_r2_key, is_available, sort_order)
VALUES
  ('prod_lagman', 'shop_dana', 'cat_mains',
   'Лагман', 'Лағман', 'Lagman',
   'Домашняя лапша, говядина, овощи', 'Үй кеспесі, сиыр еті, көкөністер', 'Hand-pulled noodles, beef, vegetables',
   120000, NULL, 1, 1),
  ('prod_plov', 'shop_dana', 'cat_mains',
   'Плов', 'Палау', 'Plov',
   'Рис, баранина, морковь, зира', 'Күріш, қой еті, сәбіз, зире', 'Rice, lamb, carrots, cumin',
   110000, NULL, 1, 2),
  ('prod_besh', 'shop_dana', 'cat_mains',
   'Бешбармак', 'Бешбармақ', 'Beshbarmak',
   'Конина, казы, тесто, лук', 'Жылқы еті, қазы, қамыр, пияз', 'Horse meat, kazy, dough, onion',
   150000, NULL, 0, 3),
  ('prod_sorpa', 'shop_dana', 'cat_soups',
   'Сорпа', 'Сорпа', 'Sorpa',
   'Наваристый бульон из баранины', 'Қой етінен қою сорпа', 'Rich lamb broth',
   70000, NULL, 1, 1),
  ('prod_lentil', 'shop_dana', 'cat_soups',
   'Чечевичный суп', 'Жасымық сорпасы', 'Lentil soup',
   'Красная чечевица, морковь, лимон', 'Қызыл жасымық, сәбіз, лимон', 'Red lentils, carrots, lemon',
   65000, NULL, 1, 2),
  ('prod_cola', 'shop_dana', 'cat_drinks',
   'Cola 0.5', 'Cola 0.5', 'Cola 0.5',
   NULL, NULL, NULL,
   60000, NULL, 1, 1),
  ('prod_kompot', 'shop_dana', 'cat_drinks',
   'Компот', 'Компот', 'Kompot',
   'Сухофрукты, вишня', 'Кептірілген жемістер, шие', 'Dried fruits, cherry',
   40000, NULL, 1, 2),
  ('prod_chai', 'shop_dana', 'cat_drinks',
   'Чай с молоком', 'Сүтті шәй', 'Milk tea',
   'Чайник 0.8 л', 'Шәйнек 0.8 л', 'Teapot 0.8 l',
   50000, NULL, 1, 3);
