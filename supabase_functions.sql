-- 1. Create the Vault table
create table if not exists public.vault (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  brand_name text not null,
  item_name text not null,
  price integer not null,
  product_link text not null,
  image_url text not null,
  dna_tags jsonb not null,
  pillar_match_score integer null,
  dna_attributes jsonb null,
  aesthetic_tags text null,
  primary_pillar text null,
  auditor_note text null,
  "ITEM_COLOR" text null,
  color jsonb null,
  standardized_dna_tags text[] null,
  standardized_aesthetic_tags text[] null,
  dna_vector public.vector(4) null,
  constraint vault_pkey primary key (id)
);

-- 2. Enable Vector Extensions (Run this in Supabase SQL Editor if not enabled)
-- create extension if not exists vector;

-- 3. Create the match_items RPC function
create or replace function match_items (
  query_vector vector(4),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  brand_name text,
  item_name text,
  price int,
  product_link text,
  image_url text,
  dna_vector vector(4),
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    v.id,
    v.brand_name,
    v.item_name,
    v.price,
    v.product_link,
    v.image_url,
    v.dna_vector,
    1 - (v.dna_vector <=> query_vector) as similarity
  from vault v
  where 1 - (v.dna_vector <=> query_vector) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
