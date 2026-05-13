-- Użytkownicy 
CREATE TABLE users (
    id UUID PRIMARY KEY,         
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dokumenty Word
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    owner_id UUID REFERENCES users(id),
    content JSONB NOT NULL DEFAULT '{}',   
    content_snapshot TEXT,                 
    version BIGINT NOT NULL DEFAULT 0,     
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Historia operacji (Operational Transform log)
CREATE TABLE document_operations (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    operation JSONB NOT NULL,              
    base_version BIGINT NOT NULL,
    result_version BIGINT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uprawnienia do dokumentów
CREATE TABLE document_permissions (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER','EDITOR','VIEWER')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (document_id, user_id)
);

CREATE TABLE active_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES users(id),
    cursor_position JSONB,                
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);
