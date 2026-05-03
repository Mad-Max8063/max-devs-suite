-- Migration: Add whatsapp_catalog_url to businesses
-- Date: 2026-05-03
-- Purpose: Allow businesses to link their WhatsApp Business catalog so that
--          gallery clicks on the public card redirect visitors directly to the catalog.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS whatsapp_catalog_url TEXT DEFAULT NULL;

COMMENT ON COLUMN businesses.whatsapp_catalog_url IS
  'URL del catálogo de WhatsApp Business. Si está configurada, un clic en la galería de la tarjeta pública redirige al catálogo.';
