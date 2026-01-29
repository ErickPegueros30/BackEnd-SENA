-- Add featured boolean to eventos table
ALTER TABLE eventos ADD COLUMN featured BOOLEAN DEFAULT FALSE;
