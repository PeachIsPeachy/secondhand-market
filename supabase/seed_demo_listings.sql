-- Demo listings for ReListed (run in Supabase SQL Editor)
-- Prerequisite: create an account in the app once so a row exists in public.profiles.

DO $$
DECLARE
  demo_seller uuid;
BEGIN
  SELECT id INTO demo_seller
  FROM public.profiles
  ORDER BY created_at
  LIMIT 1;

  IF demo_seller IS NULL THEN
    RAISE EXCEPTION 'No user profile found. Sign up at http://localhost:3000/signup , then run this script again.';
  END IF;

  INSERT INTO public.products (seller_id, title, description, price, category, condition)
  VALUES
    (
      demo_seller,
      'MacBook Air 13" (2020)',
      'Intel i5, 8GB RAM, 256GB SSD. Battery health 87%. Small scuffs on lid; screen is clean. Includes original charger.',
      549.00,
      'electronics',
      'used'
    ),
    (
      demo_seller,
      'IKEA KALLAX 4-cube shelf',
      'White 2x2 Kallax in good shape. Disassembled for pickup; all hardware bagged and labeled.',
      35.00,
      'home',
      'like_new'
    ),
    (
      demo_seller,
      'Patagonia Better Sweater — Men''s M',
      'Forge grey, fleece. Washed cold, no pilling. Fits true to size.',
      72.00,
      'fashion',
      'used'
    ),
    (
      demo_seller,
      'Trek hybrid bike — medium frame',
      'Recently tuned: new cables, brake pads. Tires good for another season. Selling because I upgraded.',
      320.00,
      'sports',
      'used'
    ),
    (
      demo_seller,
      'Set of 4 ceramic dinner plates',
      'Handmade glaze, subtle blue-grey. One plate has a hairline crack (see photo idea — none uploaded in seed).',
      28.00,
      'home',
      'damaged'
    ),
    (
      demo_seller,
      'Sony WH-1000XM4 headphones',
      'Black. Noise cancelling works great. Ear cushions replaced last year. Comes with case and cable.',
      189.00,
      'electronics',
      'like_new'
    ),
    (
      demo_seller,
      'The Design of Everyday Things — paperback',
      'Don Norman classic. Highlighting on a few pages; spine intact.',
      9.00,
      'books',
      'used'
    );

  RAISE NOTICE 'Inserted 7 demo listings for seller %', demo_seller;
END $$;
