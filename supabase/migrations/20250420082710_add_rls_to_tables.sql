-- Enable RLS for flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies for flashcards
CREATE POLICY "Users can view their own flashcards" ON flashcards
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards" ON flashcards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" ON flashcards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" ON flashcards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Create policies for generations
CREATE POLICY "Users can view their own generations" ON generations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" ON generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" ON generations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" ON generations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for generation_error_logs
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for generation_error_logs
CREATE POLICY "Users can view their own error logs" ON generation_error_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own error logs" ON generation_error_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own error logs" ON generation_error_logs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own error logs" ON generation_error_logs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE flashcards IS 'Flashcards table with RLS enabled. Users can only access their own flashcards.';
COMMENT ON TABLE generations IS 'Generations table with RLS enabled. Users can only access their own generations.';
COMMENT ON TABLE generation_error_logs IS 'Generation error logs table with RLS enabled. Users can only access their own error logs.'; 