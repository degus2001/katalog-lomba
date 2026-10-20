-- ==============================================================================
-- SISTEM RELASIONAL DATABASE KOST EKSKLUSIF TRIPLE B LIVING (SUPABASE SQL)
-- Tagline: "Triple B Living – Better Room, Better Life, Better Day."
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL PENGGUNA / PENYEWA (USERS)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  ktp_url TEXT NOT NULL,
  emergency_contact VARCHAR(50),
  role VARCHAR(20) DEFAULT 'tenant' CHECK (role IN ('tenant', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KAMAR KOST (ROOMS)
CREATE TABLE IF NOT EXISTS public.rooms (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  price NUMERIC NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'empty' 
    CHECK (status IN ('empty', 'reserved', 'occupied', 'due', 'overdue', 'maintenance')),
  tenant_name VARCHAR(150),
  due_date VARCHAR(50),
  phone VARCHAR(50),
  smart_lock_pin VARCHAR(20),
  image_url TEXT,
  description TEXT,
  facilities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION AMAN: Pastikan kolom baru tersedia jika tabel sudah pernah dibuat sebelumnya
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS facilities TEXT;

-- 3. TABEL PEMESANAN / SEWA (BOOKINGS) - Berelasi dengan ROOMS
CREATE TABLE IF NOT EXISTS public.bookings (
  id VARCHAR(50) PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL REFERENCES public.rooms(number) ON UPDATE CASCADE ON DELETE RESTRICT,
  tenant_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  ktp_url TEXT NOT NULL,
  emergency_contact VARCHAR(50),
  smart_lock_pin VARCHAR(20) NOT NULL,
  monthly_price NUMERIC NOT NULL,
  due_date VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'pending_approval' 
    CHECK (status IN ('pending_payment', 'pending_approval', 'approved', 'rejected')),
  key_handed_over BOOLEAN DEFAULT FALSE, -- Indikator sah penyerahan kunci kamar
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION AMAN: Pastikan kolom baru tersedia di bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS key_handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 4. TABEL TIKET KELUHAN (MAINTENANCE_TICKETS) - Berelasi dengan ROOMS
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
  id VARCHAR(50) PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL REFERENCES public.rooms(number) ON UPDATE CASCADE ON DELETE RESTRICT,
  tenant_name VARCHAR(150),
  tenant_phone VARCHAR(50),
  issue TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'Pending' 
    CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) & POLICY AKSES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public users access" ON public.users;
CREATE POLICY "Allow public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public rooms access" ON public.rooms;
CREATE POLICY "Allow public rooms access" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public bookings access" ON public.bookings;
CREATE POLICY "Allow public bookings access" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public tickets access" ON public.maintenance_tickets;
CREATE POLICY "Allow public tickets access" ON public.maintenance_tickets FOR ALL USING (true) WITH CHECK (true);

-- 6. DATA UNIT KAMAR RESMI TRIPLE B LIVING
INSERT INTO public.rooms (number, type, price, status, image_url, description, facilities, tenant_name, due_date, phone, smart_lock_pin) VALUES
('101', 'Deluxe AC + TV', 1750000, 'occupied', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700', 'Unit Deluxe lantai 1 dengan pencahayaan alami dan interior modern.', 'Kasur Queen, AC Daikin, Smart TV, Kamar Mandi Dalam, Wi-Fi 100 Mbps', 'Budi Santoso', '2026-10-25', '081234567890', '8829#'),
('102', 'Standard Cozy', 1200000, 'empty', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700', 'Unit ekonomis nyaman dengan sirkulasi udara baik dan meja kerja.', 'Kasur Single, Kipas Angin, Kamar Mandi Bersih, Meja Belajar, Wi-Fi Cepat', NULL, NULL, NULL, NULL),
('103', 'Deluxe AC + TV', 1750000, 'empty', 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700', 'Unit Deluxe tenang menghadap taman dalam, lengkap dengan water heater.', 'Kasur Queen, AC Daikin, Smart TV, Kamar Mandi Dalam, Water Heater, Wi-Fi', NULL, NULL, NULL, NULL),
('104', 'VIP King Suite', 2200000, 'empty', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700', 'Unit VIP termewah dengan kasur King Size, Smart TV 43 Inch, dan mini bar kulkas.', 'Kasur King, Smart TV 43", AC 1 PK, Kulkas Mini, Balkon Pribadi, Water Heater', NULL, NULL, NULL, NULL),
('201', 'Deluxe AC + TV', 1750000, 'occupied', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=700', 'Unit lantai 2 dengan pemandangan kota dan akses smart lock privat.', 'Kasur Queen, AC Daikin, Kamar Mandi Dalam, Smart Door Lock, Lemari 2 Pintu', 'Dewi Lestari', '2026-10-28', '085566778899', '3481#'),
('202', 'Standard Cozy', 1200000, 'empty', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700', 'Unit tenang lantai 2 sangat cocok untuk mahasiswa atau pekerja fokus.', 'Kasur Single, AC Hemat Energi, Meja & Kursi Kerja, Wi-Fi Cepat', NULL, NULL, NULL, NULL),
('203', 'VIP King Suite', 2200000, 'empty', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700', 'Unit VIP lantai 2 dengan pencahayaan luas, balkon privat, dan fasilitas lengkap.', 'Kasur King, Smart TV 43", AC 1 PK, Balkon Pribadi, Dapur Mini, Water Heater', NULL, NULL, NULL, NULL)
ON CONFLICT (number) DO NOTHING;
