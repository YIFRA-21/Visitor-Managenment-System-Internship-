-- Migration script to expand photo_url, photo_path, and document_url column sizes to LONGTEXT
-- Solves "Data too long for column 'photo_url'" permanently

ALTER TABLE visitors MODIFY COLUMN photo_url LONGTEXT NULL COMMENT 'Path or base64 data URL to active profile photograph';
ALTER TABLE visitor_photos MODIFY COLUMN photo_path LONGTEXT NOT NULL COMMENT 'File path/URL of captured photograph';
ALTER TABLE visitor_documents MODIFY COLUMN document_url LONGTEXT NOT NULL COMMENT 'Path or URL to uploaded document scan';
