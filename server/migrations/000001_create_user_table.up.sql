CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(50) NOT NULL,
    email TEXT NOT NULL UNIQUE,
    hash_password TEXT,
    avatar_url TEXT DEFAULT '',
    avatar_public_id TEXT,
    auth_provider VARCHAR(15) NOT NULL DEFAULT 'local',
    auth_provider_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);