-- Adds a configurable default WhatsApp message for public cards.
-- Run manually in Supabase SQL Editor before relying on the field in production.

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT '';
