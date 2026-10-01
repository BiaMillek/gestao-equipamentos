create extension if not exists "pgcrypto";

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table equipments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  model text,
  serial_number text not null unique,
  status text not null default 'disponivel'
    check (status in ('disponivel','em_uso','manutencao','baixado')),
  location_id uuid not null references locations(id),
  technician_id uuid references technicians(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
