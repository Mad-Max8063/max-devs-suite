-- ============================================
-- Migration: disable_share + font_scale columns
-- 2026-04-30
-- ============================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS disable_share BOOLEAN DEFAULT FALSE;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS font_scale NUMERIC DEFAULT 1.0
    CHECK (font_scale >= 0.8 AND font_scale <= 1.5);
