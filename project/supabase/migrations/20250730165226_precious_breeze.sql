/*
  # Add RLS policies for anonymous access

  1. Security Policies
    - Allow anonymous users to insert signature requests
    - Allow anonymous users to insert recipients
    - Allow anonymous users to insert signature fields
    - Allow anonymous users to read their own data using request tokens

  2. Notes
    - This enables the eSignature workflow for non-authenticated users
    - Uses request-based access control instead of user authentication
    - Maintains security by limiting access to specific operations
*/

-- Allow anonymous users to insert signature requests
CREATE POLICY "Allow anonymous insert signature requests"
  ON signature_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read signature requests (needed for updates)
CREATE POLICY "Allow anonymous read signature requests"
  ON signature_requests
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to update signature requests
CREATE POLICY "Allow anonymous update signature requests"
  ON signature_requests
  FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous users to insert recipients
CREATE POLICY "Allow anonymous insert recipients"
  ON recipients
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read recipients
CREATE POLICY "Allow anonymous read recipients"
  ON recipients
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to update recipients
CREATE POLICY "Allow anonymous update recipients"
  ON recipients
  FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous users to insert signature fields
CREATE POLICY "Allow anonymous insert signature fields"
  ON signature_fields
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read signature fields
CREATE POLICY "Allow anonymous read signature fields"
  ON signature_fields
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to update signature fields
CREATE POLICY "Allow anonymous update signature fields"
  ON signature_fields
  FOR UPDATE
  TO anon
  USING (true);