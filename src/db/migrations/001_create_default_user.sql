-- Create default user if not exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  '4234-4234-23-42-34-23-4-23-42-34-234-5-wedfssd',
  'default@example.com',
  '$2a$10$default_password_hash',
  NOW()
)
ON CONFLICT (id) DO NOTHING; 