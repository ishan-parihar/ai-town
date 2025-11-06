-- PostgreSQL initialization script for AI Town
-- This script creates the necessary database schema for self-hosted deployment

-- Create pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the main tables based on convex schema

-- Worlds table (main game state)
CREATE TABLE IF NOT EXISTS worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    map_data JSONB,
    player_data JSONB,
    agent_data JSONB,
    conversation_data JSONB,
    engine_state JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- World status table
CREATE TABLE IF NOT EXISTS world_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    engine_id UUID,
    last_viewed TIMESTAMP,
    status TEXT CHECK (status IN ('running', 'stoppedByDeveloper', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Maps table (separate from worlds for performance)
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    map_data JSONB NOT NULL,
    dimensions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Player descriptions
CREATE TABLE IF NOT EXISTS player_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    name TEXT,
    description TEXT,
    personality JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(world_id, player_id)
);

-- Agent descriptions  
CREATE TABLE IF NOT EXISTS agent_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL,
    name TEXT,
    description TEXT,
    personality JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(world_id, agent_id)
);

-- Archived players (for historical data)
CREATE TABLE IF NOT EXISTS archived_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    player_id UUID,
    player_data JSONB,
    archive_reason TEXT,
    archived_at TIMESTAMP DEFAULT NOW()
);

-- Archived conversations
CREATE TABLE IF NOT EXISTS archived_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    conversation_id UUID,
    conversation_data JSONB,
    archive_reason TEXT,
    archived_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID,
    message_uuid TEXT NOT NULL,
    author UUID,
    text TEXT NOT NULL,
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Engine inputs
CREATE TABLE IF NOT EXISTS engine_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_id UUID NOT NULL,
    input_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    args JSONB,
    return_value JSONB,
    received TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Engine state
CREATE TABLE IF NOT EXISTS engines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_time TIMESTAMP,
    last_step_ts TIMESTAMP,
    processed_input_number INTEGER,
    running BOOLEAN DEFAULT TRUE,
    generation_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent memories
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    description TEXT NOT NULL,
    embedding_id UUID,
    importance FLOAT,
    last_access TIMESTAMP,
    category TEXT,
    confidence FLOAT,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Memory embeddings (vector table)
CREATE TABLE IF NOT EXISTS memory_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    embedding vector(1024), -- Default to 1024 dimensions for GLM-4.6
    created_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings cache
CREATE TABLE IF NOT EXISTS embeddings_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash BYTEA UNIQUE NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Music table
CREATE TABLE IF NOT EXISTS music (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_id TEXT,
    type TEXT CHECK (type IN ('background', 'player')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance

-- Vector indexes
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector ON memory_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_embeddings_cache_vector ON embeddings_cache USING ivfflat (embedding vector_cosine_ops);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_worlds_updated ON worlds(updated_at);
CREATE INDEX IF NOT EXISTS idx_world_status_world_id ON world_status(world_id);
CREATE INDEX IF NOT EXISTS idx_maps_world_id ON maps(world_id);
CREATE INDEX IF NOT EXISTS idx_player_descriptions_world_id ON player_descriptions(world_id);
CREATE INDEX IF NOT EXISTS idx_agent_descriptions_world_id ON agent_descriptions(world_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_world_id ON messages(world_id);
CREATE INDEX IF NOT EXISTS idx_memories_player_id ON memories(player_id);
CREATE INDEX IF NOT EXISTS idx_memories_embedding_id ON memories(embedding_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories USING GIN ((data->>'type'));
CREATE INDEX IF NOT EXISTS idx_embeddings_cache_text_hash ON embeddings_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_engine_inputs_engine_id ON engine_inputs(engine_id);
CREATE INDEX IF NOT EXISTS idx_engine_inputs_number ON engine_inputs(engine_id, input_number);

-- Insert default world
INSERT INTO worlds (id, name, description, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'AI Council LifeOS',
    'Default AI Council world for personal life management',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_status_updated_at BEFORE UPDATE ON world_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maps_updated_at BEFORE UPDATE ON maps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_descriptions_updated_at BEFORE UPDATE ON player_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_descriptions_updated_at BEFORE UPDATE ON agent_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engines_updated_at BEFORE UPDATE ON engines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aitown;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aitown;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'AI Town PostgreSQL database initialized successfully';
END
$$;