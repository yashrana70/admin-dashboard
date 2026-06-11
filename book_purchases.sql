CREATE TABLE IF NOT EXISTS book_purchases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    book_title text NOT NULL,
    amount text NOT NULL,
    transaction_id text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE book_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own purchases
CREATE POLICY "Users can insert their own purchases"
    ON book_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own purchases
CREATE POLICY "Users can view their own purchases"
    ON book_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Allow admins to manage all purchases
CREATE POLICY "Admins can manage all purchases"
    ON book_purchases FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
      )
    );
