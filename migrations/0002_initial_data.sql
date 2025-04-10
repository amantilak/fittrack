-- Insert a default admin user
INSERT INTO admins (name, email, password, permissions, created_at)
VALUES ('Admin', 'admin@example.com', '$2a$10$JdJn6jEjzONQtBJT3yJ3Oet9JSQL0wSRPUcr6P9399JS5hFUdZpLW', '{"isAdmin": true}', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert a sample client
INSERT INTO clients (name, email, base_path, status, created_at)
VALUES ('Demo Client', 'demo@example.com', 'demo', 'active', NOW())
ON CONFLICT (base_path) DO NOTHING;