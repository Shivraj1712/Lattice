CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_image_url TEXT NOT NULL,
    project_image_public_id TEXT NOT NULL,
    title TEXT NOT NULL,
    poject_description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'NoCategory',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT project_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ON projects(title);
CREATE INDEX ON projects(project_description);
CREATE INDEX ON projects(category);