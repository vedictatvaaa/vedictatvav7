BEGIN;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS logo_display_mode text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS logo_size_px integer NOT NULL DEFAULT 27,
  ADD COLUMN IF NOT EXISTS logo_scale_percent integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS logo_position text NOT NULL DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS logo_text_color text NOT NULL DEFAULT '#6D2B35',
  ADD COLUMN IF NOT EXISTS tagline_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tagline_color text NOT NULL DEFAULT '#6B5B52',
  ADD COLUMN IF NOT EXISTS tagline_size_px integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS logo_font_source text NOT NULL DEFAULT 'curated',
  ADD COLUMN IF NOT EXISTS logo_font_family text NOT NULL DEFAULT 'Tiro Devanagari Sanskrit',
  ADD COLUMN IF NOT EXISTS custom_logo_font_url text,
  ADD COLUMN IF NOT EXISTS logo_font_weight integer NOT NULL DEFAULT 400,
  ADD COLUMN IF NOT EXISTS logo_letter_spacing integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brand_studio_configured boolean NOT NULL DEFAULT false;

ALTER TABLE site_settings
  ALTER COLUMN logo_display_mode SET DEFAULT 'both',
  ALTER COLUMN logo_size_px SET DEFAULT 27,
  ALTER COLUMN logo_scale_percent SET DEFAULT 100,
  ALTER COLUMN logo_position SET DEFAULT 'left',
  ALTER COLUMN logo_text_color SET DEFAULT '#6D2B35',
  ALTER COLUMN tagline_visible SET DEFAULT false,
  ALTER COLUMN tagline_color SET DEFAULT '#6B5B52',
  ALTER COLUMN tagline_size_px SET DEFAULT 14,
  ALTER COLUMN logo_font_source SET DEFAULT 'curated',
  ALTER COLUMN logo_font_family SET DEFAULT 'Tiro Devanagari Sanskrit',
  ALTER COLUMN logo_font_weight SET DEFAULT 400,
  ALTER COLUMN logo_letter_spacing SET DEFAULT 0,
  ALTER COLUMN brand_studio_configured SET DEFAULT false;

ALTER TABLE site_settings
  DROP CONSTRAINT IF EXISTS site_settings_logo_display_mode_check,
  DROP CONSTRAINT IF EXISTS site_settings_logo_position_check,
  DROP CONSTRAINT IF EXISTS site_settings_logo_font_source_check,
  DROP CONSTRAINT IF EXISTS site_settings_logo_font_weight_check,
  DROP CONSTRAINT IF EXISTS site_settings_logo_size_check,
  DROP CONSTRAINT IF EXISTS site_settings_logo_scale_check,
  DROP CONSTRAINT IF EXISTS site_settings_tagline_size_check,
  DROP CONSTRAINT IF EXISTS site_settings_letter_spacing_check;

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_logo_display_mode_check
    CHECK (logo_display_mode IN ('text', 'image', 'both')),
  ADD CONSTRAINT site_settings_logo_position_check
    CHECK (logo_position IN ('left', 'center', 'right')),
  ADD CONSTRAINT site_settings_logo_font_source_check
    CHECK (logo_font_source IN ('curated', 'custom')),
  ADD CONSTRAINT site_settings_logo_font_weight_check
    CHECK (logo_font_weight IN (400, 500, 600)),
  ADD CONSTRAINT site_settings_logo_size_check CHECK (logo_size_px BETWEEN 16 AND 160),
  ADD CONSTRAINT site_settings_logo_scale_check CHECK (logo_scale_percent BETWEEN 50 AND 200),
  ADD CONSTRAINT site_settings_tagline_size_check CHECK (tagline_size_px BETWEEN 8 AND 32),
  ADD CONSTRAINT site_settings_letter_spacing_check CHECK (logo_letter_spacing BETWEEN -4 AND 20);

COMMIT;