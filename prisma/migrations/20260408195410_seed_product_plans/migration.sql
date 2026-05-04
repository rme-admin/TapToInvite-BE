-- Insert Product Plans with new features structure
INSERT INTO `ProductPlan` (`name`, `description`, `base_price`, `is_recommended`, `min_nfc_qty`, `min_normal_qty`, `features`, `icon_url`, `created_at`, `updated_at`) 
VALUES 
(
  'Classic Invitation',
  'Traditional elegance with a digital touch via QR. Perfect for simple but elegant invitations.',
  200,
  false,
  0,
  0,
  JSON_OBJECT(
    'qr_code', true,
    'website', 'not available',
    'reminder', 'not available',
    'accommodation', false,
    'other_features', JSON_ARRAY()
  ),
  'https://api.iconify.design/mdi/card-multiple.svg?color=%23666666',
  NOW(),
  NOW()
),
(
  'Premium Invitation',
  'The perfect balance of physical luxury and digital convenience. Includes NFC cards and web access.',
  2500,
  true,
  2,
  10,
  JSON_OBJECT(
    'qr_code', true,
    'website', 'basic',
    'reminder', 'basic',
    'accommodation', false,
    'other_features', JSON_ARRAY(
      JSON_OBJECT('feature_name', 'NFC Digital Integration'),
      JSON_OBJECT('feature_name', 'Photo Embed Support')
    )
  ),
  'https://api.iconify.design/mdi/crown.svg?color=%23FFD700',
  NOW(),
  NOW()
),
(
  'Freedom Plan',
  'Complete customization with all features. Design your own experience.',
  999,
  false,
  1,
  5,
  JSON_OBJECT(
    'qr_code', true,
    'website', 'premium',
    'reminder', 'special',
    'accommodation', false,
    'other_features', JSON_ARRAY(
      JSON_OBJECT('feature_name', 'Full NFC Customization'),
      JSON_OBJECT('feature_name', 'Advanced Analytics'),
      JSON_OBJECT('feature_name', 'Custom Domain Support'),
      JSON_OBJECT('feature_name', 'Guest Engagement Tools')
    )
  ),
  'https://api.iconify.design/mdi/lightning-bolt.svg?color=%2300AA00',
  NOW(),
  NOW()
);
