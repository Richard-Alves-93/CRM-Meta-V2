-- Add `ativo` flag for soft-delete behavior
-- These columns are expected by the client code when marking records as inactive.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

ALTER TABLE public.pet_purchases
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
