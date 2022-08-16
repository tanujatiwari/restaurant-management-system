/* Replace with your SQL commands */
ALTER TABLE images
ALTER COLUMN created_at 
SET DEFAULT now();