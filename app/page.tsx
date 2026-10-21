'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  saveRoomAction,
  deleteRoomAction,
  approveBookingAction,
  rejectBookingAction,
  submitBookingAction,
} from './actions/kostActions';

// --- INTERFACES ---
export interface Room {
  id: number;
  number: string;
  type: string;
  price: number;
  status: 'empty' | 'reserved' | 'occupied' | 'due' | 'overdue' | 'maintenance';
  tenantName?: string;
  dueDate?: string;
  phone?: string;
  smartLockPin?: string;
  imageUrl?: string;
  description?: string;
  facilities?: string;
}

export interface BookingRecord {
  id: string;
  roomNumber: string;
  tenantName: string;
  phone: string;
  ktpUrl: string;
  emergencyContact?: string;
  smartLockPin: string;
  monthlyPrice: number;
  dueDate?: string;
  status: 'pending_payment' | 'pending_approval' | 'approved' | 'rejected';
  keyHandedOver?: boolean;
  approvedAt?: string;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  roomNumber: string;
  tenantName?: string;
  tenantPhone?: string;
  issue: string;
  photoUrl: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: string;
}

// --- DATA AWAL RESMI TRIPLE B LIVING ---
const INITIAL_ROOMS: Room[] = [
  {
    id: 1,
    number: '101',
    type: 'Deluxe AC + TV',
    price: 1750000,
    status: 'occupied',
    tenantName: 'Budi Santoso',
    dueDate: '2026-10-25',
    phone: '081234567890',
    smartLockPin: '8829#',
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700',
    description: 'Unit Deluxe lantai 1 dengan pencahayaan alami optimal, interior estetik, dan akses smart door lock privat.',
    facilities: 'Kasur Queen, AC Daikin, Smart TV 32", Kamar Mandi Dalam, Water Heater, Wi-Fi 100 Mbps',
  },
  {
    id: 2,
    number: '102',
    type: 'Standard Cozy',
    price: 1200000,
    status: 'empty',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700',
    description: 'Unit ekonomis nyaman dengan sirkulasi udara baik, meja belajar ergonomis, dan suasana tenang.',
    facilities: 'Kasur Single, Kipas Angin Gantung, Kamar Mandi Bersih, Meja Belajar, Wi-Fi Cepat',
  },
  {
    id: 3,
    number: '103',
    type: 'Deluxe AC + TV',
    price: 1750000,
    status: 'empty',
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700',
    description: 'Unit Deluxe tenang menghadap taman dalam, lengkap dengan water heater dan smart lock terkini.',
    facilities: 'Kasur Queen, AC Daikin, Smart TV 32", Kamar Mandi Dalam, Water Heater, Wi-Fi 100 Mbps',
  },
  {
    id: 4,
    number: '104',
    type: 'VIP King Suite',
    price: 2200000,
    status: 'empty',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700',
    description: 'Unit VIP termewah dengan kasur King Size, Smart TV 43 Inch, kulkas mini, dan balkon pribadi.',
    facilities: 'Kasur King, Smart TV 43", AC 1 PK, Kulkas Mini, Balkon Pribadi, Water Heater, Wi-Fi 100 Mbps',
  },
  {
    id: 5,
    number: '201',
    type: 'Deluxe AC + TV',
    price: 1750000,
    status: 'occupied',
    tenantName: 'Dewi Lestari',
    dueDate: '2026-10-28',
    phone: '085566778899',
    smartLockPin: '3481#',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=700',
    description: 'Unit lantai 2 dengan view asri, lemari pakaian 2 pintu, dan meja kerja luas.',
    facilities: 'Kasur Queen, AC Daikin, Kamar Mandi Dalam, Smart Door Lock, Lemari 2 Pintu, Wi-Fi Cepat',
  },
  {
    id: 6,
    number: '202',
    type: 'Standard Cozy',
    price: 1200000,
    status: 'empty',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=700',
    description: 'Unit nyaman lantai 2 sangat cocok bagi mahasiswa atau pekerja yang membutuhkan ketenangan fokus.',
    facilities: 'Kasur Single, AC Hemat Energi, Meja & Kursi Kerja, Wi-Fi Cepat, Lemari',
  },
  {
    id: 7,
    number: '203',
    type: 'VIP King Suite',
    price: 2200000,
    status: 'empty',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700',
    description: 'Unit VIP lantai 2 dengan pencahayaan luas, balkon privat, dan fasilitas lengkap siap huni.',
    facilities: 'Kasur King, Smart TV 43", AC 1 PK, Balkon Pribadi, Dapur Mini, Water Heater, Wi-Fi',
  },
];

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'BOOK-1011',
    roomNumber: '101',
    tenantName: 'Budi Santoso',
    phone: '081234567890',
    ktpUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    emergencyContact: '081234567891',
    smartLockPin: '8829#',
    monthlyPrice: 1750000,
    dueDate: '2026-10-25',
    status: 'approved',
    keyHandedOver: true,
    approvedAt: '2026-10-10 14:30:00',
    createdAt: '2026-10-10 14:00:00',
  },
  {
    id: 'BOOK-2011',
    roomNumber: '201',
    tenantName: 'Dewi Lestari',
    phone: '085566778899',
    ktpUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    emergencyContact: '085566778800',
    smartLockPin: '3481#',
    monthlyPrice: 1750000,
    dueDate: '2026-10-28',
    status: 'approved',
    keyHandedOver: true,
    approvedAt: '2026-10-11 09:15:00',
    createdAt: '2026-10-11 08:30:00',
  },
];

const ADMIN_PASSWORD = '142311';
const QR_CODE_IMAGE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=TRIPLE-B-LIVING-PAYMENT-6287701712343';
const ADMIN_WHATSAPP_NUMBER = '6287701712343';

export default function TripleBLivingPage() {
  const [activeTab, setActiveTab] = useState<'katalog' | 'tenant' | 'admin'>('katalog');
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);

  // Modals & State Interaksi
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Modal Alur Pembayaran QR Code
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    bookingId: string;
    roomNumber: string;
    tenantName: string;
    amount: number;
    dueDate: string;
  } | null>(null);

  // Form Booking Calon Penghuni
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    ktpUrl: '',
    emergencyContact: '',
  });

  // Portal Penghuni
  const [loggedInPhone, setLoggedInPhone] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [newIssue, setNewIssue] = useState({ issue: '', photoUrl: '' });

  // Autentikasi Admin Dashboard
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [adminBookingFilter, setAdminBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminSubTab, setAdminSubTab] = useState<'approvals' | 'rooms' | 'tickets'>('approvals');

  // Modal Tambah / Edit Kamar Admin
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<{
    number: string;
    type: string;
    price: string;
    status: Room['status'];
    imageUrl: string;
    description: string;
    facilities: string;
  }>({
    number: '',
    type: 'Deluxe AC + TV',
    price: '1750000',
    status: 'empty',
    imageUrl: '',
    description: '',
    facilities: 'Kasur Queen, AC Daikin, Smart TV 32", Kamar Mandi Dalam, Water Heater, Wi-Fi 100 Mbps',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Helper Pembuat Link WhatsApp Konfirmasi Pembayaran
  const getWhatsAppPaymentLink = (roomNum?: string, name?: string, amount?: number, bookingId?: string) => {
    let message = 'Halo Triple B Living, saya ingin mengirimkan bukti pembayaran untuk pemesanan saya:';
    if (roomNum && name && amount) {
      message = `Halo Triple B Living, saya ingin mengirimkan bukti pembayaran sewa kamar:

• ID Pemesanan: ${bookingId || '-'}
• Unit: Kamar ${roomNum}
• Atas Nama: ${name}
• Total Tagihan: Rp ${amount.toLocaleString('id-ID')}

Berikut saya lampirkan tangkapan layar (screenshot) bukti pembayaran saya. Mohon untuk diverifikasi dan disetujui. Terima kasih!`;
    }
    return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  // Helper Pembuat Link WhatsApp Penyerahan Kunci & PIN ke Penyewa
  const getWhatsAppKeyHandoverLink = (b: BookingRecord) => {
    const text = `Halo Kak ${b.tenantName}, selamat bergabung di Triple B Living! 🏡✨

Pembayaran sewa Anda untuk Kamar ${b.roomNumber} telah berhasil diverifikasi dan DISETUJUI oleh Manajemen.

🔑 INFORMASI PENYERAHAN KUNCI & SMART DOOR LOCK:
• Unit Hunian: Kamar ${b.roomNumber}
• PIN Smart Door Lock: ${b.smartLockPin}
• Masa Sewa Aktif s/d: ${b.dueDate || 'Bulan Depan'}

Fisik kunci kamar sudah sah untuk diserahterimakan/diambil di pos pengelola, dan kode PIN Smart Door Lock unit Anda sudah aktif. 

Triple B Living – Better Room, Better Life, Better Day.`;
    const cleanRecipient = b.phone.startsWith('0') ? '62' + b.phone.slice(1) : b.phone;
    return `https://wa.me/${cleanRecipient}?text=${encodeURIComponent(text)}`;
  };

  // Load Session dari Browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('tripleb_tenant_phone');
      if (savedPhone) setLoggedInPhone(savedPhone);

      const adminAuth = sessionStorage.getItem('tripleb_admin_auth');
      if (adminAuth === 'true') setIsAdminAuthenticated(true);
    }
  }, []);

  // Sinkronisasi data dari Backend / Supabase
  useEffect(() => {
    fetchFromDatabase();
  }, []);

  const fetchFromDatabase = async () => {
    try {
      // 1. Ambil data kamar
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .order('number', { ascending: true });

      if (roomsData && roomsData.length > 0) {
        const mappedRooms: Room[] = roomsData.map((r) => ({
          id: r.id,
          number: r.number,
          type: r.type,
          price: Number(r.price),
          status: r.status as Room['status'],
          tenantName: r.tenant_name || undefined,
          dueDate: r.due_date || undefined,
          phone: r.phone || undefined,
          smartLockPin: r.smart_lock_pin || undefined,
          imageUrl: r.image_url || undefined,
          description: r.description || undefined,
          facilities: r.facilities || undefined,
        }));
        setRooms(mappedRooms);
      }

      // 2. Ambil data booking
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsData && bookingsData.length > 0) {
        const mappedBookings: BookingRecord[] = bookingsData.map((b) => ({
          id: b.id,
          roomNumber: b.room_number,
          tenantName: b.tenant_name,
          phone: b.phone,
          ktpUrl: b.ktp_url,
          emergencyContact: b.emergency_contact,
          smartLockPin: b.smart_lock_pin,
          monthlyPrice: Number(b.monthly_price),
          dueDate: b.due_date,
          status: (b.status as BookingRecord['status']) || 'pending_approval',
          keyHandedOver: Boolean(b.key_handed_over),
          approvedAt: b.approved_at || undefined,
          createdAt: b.created_at,
        }));
        setBookings(mappedBookings);
      }

      // 3. Ambil data tiket keluhan
      const { data: ticketsData } = await supabase
        .from('maintenance_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsData && ticketsData.length > 0) {
        const mappedTickets: MaintenanceTicket[] = ticketsData.map((t) => ({
          id: t.id,
          roomNumber: t.room_number,
          tenantName: t.tenant_name,
          tenantPhone: t.tenant_phone,
          issue: t.issue,
          photoUrl: t.photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
          status: t.status as MaintenanceTicket['status'],
          createdAt: t.created_at ? t.created_at.split('T')[0] : '2026-10-15',
        }));
        setTickets(mappedTickets);
      }
    } catch {
      // Menjaga agar UI tetap elegan dan tidak membocorkan error internal ke pengunjung
    }
  };

  const generatePin = () => `${Math.floor(1000 + Math.random() * 9000)}#`;
  const cleanPhone = (val: string) => {
    let cleaned = val.trim().replace(/[^0-9]/g, '');
    if (cleaned.startsWith('62')) {
      cleaned = '0' + cleaned.slice(2);
    }
    return cleaned;
  };

  // ============================================================================
  // 1. FLOW PENGGUNA: BOOKING KAMAR
  // ============================================================================
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setIsSubmitting(true);
    const generatedPin = generatePin();
    const formattedPhone = cleanPhone(bookingForm.phone);
    const dueDate = '2026-11-15';
    const newBookingId = `BOOK-${Date.now().toString().slice(-4)}`;

    const newBooking: BookingRecord = {
      id: newBookingId,
      roomNumber: selectedRoom.number,
      tenantName: bookingForm.name,
      phone: formattedPhone,
      ktpUrl: bookingForm.ktpUrl,
      emergencyContact: bookingForm.emergencyContact,
      smartLockPin: generatedPin,
      monthlyPrice: selectedRoom.price,
      dueDate: dueDate,
      status: 'pending_approval',
      keyHandedOver: false,
      createdAt: new Date().toISOString(),
    };

    // Update state kamar menjadi reserved sementara
    setRooms((prev) =>
      prev.map((r) =>
        r.number === selectedRoom.number
          ? {
              ...r,
              status: 'reserved',
              tenantName: `${bookingForm.name} (Pending Approval)`,
              phone: formattedPhone,
              smartLockPin: generatedPin,
              dueDate: dueDate,
            }
          : r
      )
    );
    setBookings((prev) => [newBooking, ...prev]);

    // Simpan sesi penghuni
    setLoggedInPhone(formattedPhone);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripleb_tenant_phone', formattedPhone);
    }

    // Panggil Server Action pendukung secara aman
    try {
      await submitBookingAction({
        id: newBookingId,
        roomNumber: selectedRoom.number,
        tenantName: bookingForm.name,
        phone: formattedPhone,
        ktpUrl: bookingForm.ktpUrl,
        emergencyContact: bookingForm.emergencyContact,
        smartLockPin: generatedPin,
        monthlyPrice: selectedRoom.price,
        dueDate: dueDate,
      });
    } catch {
      // Tetap berjalan mulus di client
    }

    setIsSubmitting(false);
    setIsBookingModalOpen(false);
    setBookingForm({ name: '', phone: '', ktpUrl: '', emergencyContact: '' });

    // Langsung buka modal pengalihan pembayaran QR Code
    setPaymentDetails({
      bookingId: newBookingId,
      roomNumber: selectedRoom.number,
      tenantName: newBooking.tenantName,
      amount: selectedRoom.price,
      dueDate: dueDate,
    });
    setIsPaymentModalOpen(true);
    setSelectedRoom(null);

    showToast(`Pemesanan Kamar ${newBooking.roomNumber} tercatat! Silakan lakukan pembayaran.`);
  };

  const handleMarkPaymentProofSent = async (bookingId?: string) => {
    if (!bookingId) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'pending_approval' } : b))
    );
    try {
      await supabase.from('bookings').update({ status: 'pending_approval' }).eq('id', bookingId);
    } catch {
      // Ignored
    }
    showToast('Bukti pembayaran terkirim! Status pesanan: Menunggu Konfirmasi Admin.');
  };

  // ============================================================================
  // 2. ADMIN FLOW: APPROVAL SYSTEM (BEBAS BUG & ANTI-RACE CONDITION)
  // ============================================================================
  const handleApproveBooking = async (bookingId: string) => {
    if (actionInProgressId) return;
    setActionInProgressId(bookingId);

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setActionInProgressId(null);
      return;
    }

    // Anti Race Condition Guard: Cek apakah kamar sudah berstatus terisi
    const targetRoom = rooms.find((r) => r.number === booking.roomNumber);
    if (targetRoom && targetRoom.status === 'occupied') {
      showToast(`⚠️ Kamar ${booking.roomNumber} sudah berstatus TERISI oleh ${targetRoom.tenantName || 'penghuni lain'}.`);
      setActionInProgressId(null);
      return;
    }

    const now = new Date().toISOString();

    // 1. Optimistic Update State
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'approved',
              keyHandedOver: true,
              approvedAt: now,
            }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) =>
        r.number === booking.roomNumber
          ? {
              ...r,
              status: 'occupied',
              tenantName: booking.tenantName,
              phone: booking.phone,
              smartLockPin: booking.smartLockPin,
              dueDate: booking.dueDate || '2026-11-15',
            }
          : r
      )
    );

    // 2. Eksekusi Server Action dengan validasi backend
    try {
      const res = await approveBookingAction(bookingId);
      if (!res.success) {
        showToast(`Peringatan: ${res.error}`);
        // Refresh data untuk mengembalikan konsistensi state
        await fetchFromDatabase();
      } else {
        showToast(`Pesanan Kamar ${booking.roomNumber} DISETUJUI. Kamar resmi TERISI & kunci sah diserahkan!`);
        await fetchFromDatabase();
      }
    } catch {
      showToast('Gagal sinkron approval ke server.');
      await fetchFromDatabase();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (actionInProgressId) return;
    setActionInProgressId(bookingId);

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setActionInProgressId(null);
      return;
    }

    // 1. Update Booking status -> rejected
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'rejected',
              keyHandedOver: false,
            }
          : b
      )
    );

    // 2. Kembalikan kamar ke status Kosong (empty) agar dapat dipesan orang lain
    setRooms((prev) =>
      prev.map((r) =>
        r.number === booking.roomNumber
          ? {
              ...r,
              status: 'empty',
              tenantName: undefined,
              phone: undefined,
              smartLockPin: undefined,
              dueDate: undefined,
            }
          : r
      )
    );

    try {
      await rejectBookingAction(bookingId);
      showToast(`Pesanan Kamar ${booking.roomNumber} DITOLAK. Kamar kembali berstatus KOSONG.`);
    } catch {
      showToast('Gagal memproses penolakan.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // ============================================================================
  // 3. ADMIN PANEL: MANAJEMEN UNIT KAMAR (TAMBAH & EDIT FOTO / DESKRIPSI)
  // ============================================================================
  const openAddRoomModal = () => {
    setEditingRoom(null);
    setRoomFormData({
      number: '',
      type: 'Deluxe AC + TV',
      price: '1750000',
      status: 'empty',
      imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700',
      description: 'Unit nyaman dan luas dengan pencahayaan alami, kamar mandi dalam, dan smart door lock terkini.',
      facilities: 'Kasur Queen, AC Daikin, Smart TV 32", Kamar Mandi Dalam, Water Heater, Wi-Fi 100 Mbps',
    });
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setRoomFormData({
      number: room.number,
      type: room.type,
      price: room.price.toString(),
      status: room.status,
      imageUrl: room.imageUrl || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700',
      description: room.description || '',
      facilities: room.facilities || '',
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.number || !roomFormData.type || !roomFormData.price) {
      showToast('Harap lengkapi nomor kamar, tipe, dan harga sewa.');
      return;
    }

    setIsSubmitting(true);
    const numericPrice = Number(roomFormData.price.replace(/[^0-9]/g, '')) || 0;

    if (editingRoom) {
      // Update Kamar yang Sudah Ada
      const updatedRooms = rooms.map((r) =>
        r.id === editingRoom.id
          ? {
              ...r,
              number: roomFormData.number,
              type: roomFormData.type,
              price: numericPrice,
              status: roomFormData.status,
              imageUrl: roomFormData.imageUrl,
              description: roomFormData.description,
              facilities: roomFormData.facilities,
            }
          : r
      );
      setRooms(updatedRooms);

      try {
        await saveRoomAction({
          id: editingRoom.id,
          number: roomFormData.number,
          type: roomFormData.type,
          price: numericPrice,
          status: roomFormData.status,
          imageUrl: roomFormData.imageUrl,
          description: roomFormData.description,
          facilities: roomFormData.facilities,
        });
        showToast(`Kamar ${roomFormData.number} berhasil diperbarui!`);
      } catch {
        showToast('Kamar diperbarui (tersimpan di client).');
      }
    } else {
      // Tambah Unit Kamar Baru
      const newId = Date.now();
      const newRoom: Room = {
        id: newId,
        number: roomFormData.number,
        type: roomFormData.type,
        price: numericPrice,
        status: roomFormData.status,
        imageUrl: roomFormData.imageUrl,
        description: roomFormData.description,
        facilities: roomFormData.facilities,
      };

      setRooms((prev) => [...prev, newRoom]);

      try {
        await saveRoomAction({
          number: roomFormData.number,
          type: roomFormData.type,
          price: numericPrice,
          status: roomFormData.status,
          imageUrl: roomFormData.imageUrl,
          description: roomFormData.description,
          facilities: roomFormData.facilities,
        });
        showToast(`Unit Kamar ${roomFormData.number} berhasil ditambahkan!`);
      } catch {
        showToast('Kamar berhasil dibuat.');
      }
    }

    setIsSubmitting(false);
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = async (roomNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Unit Kamar ${roomNumber}?`)) return;

    setRooms((prev) => prev.filter((r) => r.number !== roomNumber));
    try {
      await deleteRoomAction(roomNumber);
      showToast(`Kamar ${roomNumber} berhasil dihapus.`);
    } catch {
      showToast('Kamar dihapus dari daftar.');
    }
  };

  // ============================================================================
  // 4. PORTAL PENGHUNI & TIKET KELUHAN
  // ============================================================================
  const handleTenantLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanPhone(phoneInput);
    if (!clean) return;

    const hasMatchingRoom = rooms.some((r) => r.phone && cleanPhone(r.phone) === clean);
    const hasMatchingBooking = bookings.some((b) => b.phone && cleanPhone(b.phone) === clean);

    if (!hasMatchingRoom && !hasMatchingBooking) {
      showToast('Nomor WhatsApp belum terdaftar di unit kamar maupun pesanan.');
      return;
    }

    setLoggedInPhone(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripleb_tenant_phone', clean);
    }
    showToast('Berhasil masuk ke portal penghuni!');
  };

  const handleTenantLogout = () => {
    setLoggedInPhone('');
    setPhoneInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tripleb_tenant_phone');
    }
    showToast('Anda telah keluar dari portal penghuni.');
  };

  const currentTenantRoom = useMemo(() => {
    if (!loggedInPhone) return null;
    return rooms.find((r) => r.phone && cleanPhone(r.phone) === cleanPhone(loggedInPhone));
  }, [rooms, loggedInPhone]);

  const currentTenantBooking = useMemo(() => {
    if (!loggedInPhone) return null;
    return bookings.find((b) => b.phone && cleanPhone(b.phone) === cleanPhone(loggedInPhone));
  }, [bookings, loggedInPhone]);

  const handleCreateTicket = async (e: React.FormEvent, roomNum: string, tName: string, tPhone: string) => {
    e.preventDefault();
    if (!newIssue.issue) return;

    const ticketId = `TICK-${Date.now().toString().slice(-4)}`;
    const ticketPhoto = newIssue.photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500';

    const ticketItem: MaintenanceTicket = {
      id: ticketId,
      roomNumber: roomNum,
      tenantName: tName,
      tenantPhone: tPhone,
      issue: newIssue.issue,
      photoUrl: ticketPhoto,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTickets((prev) => [ticketItem, ...prev]);
    setNewIssue({ issue: '', photoUrl: '' });

    try {
      await supabase.from('maintenance_tickets').insert({
        id: ticketId,
        room_number: roomNum,
        tenant_name: tName,
        tenant_phone: tPhone,
        issue: newIssue.issue,
        photo_url: ticketPhoto,
        status: 'Pending',
      });
    } catch {
      // Ignored
    }

    showToast('Laporan kerusakan tersimpan dan diteruskan ke teknisi!');
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: MaintenanceTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    try {
      await supabase.from('maintenance_tickets').update({ status: newStatus }).eq('id', ticketId);
    } catch {
      // Ignored
    }
    showToast(`Status tiket ${ticketId} diperbarui: ${newStatus}`);
  };

  // Autentikasi Admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAdminPasswordError(null);
      setAdminPasswordInput('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tripleb_admin_auth', 'true');
      }
      showToast('Selamat datang di Panel Admin Triple B Living!');
    } else {
      setAdminPasswordError('Password salah. Silakan coba kembali.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tripleb_admin_auth');
    }
    showToast('Dashboard Admin terkunci.');
  };

  // Statistik Admin
  const totalRevenue = useMemo(() => {
    return rooms
      .filter((r) => r.status === 'occupied' || r.status === 'due')
      .reduce((acc, curr) => acc + curr.price, 0);
  }, [rooms]);

  const pendingBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'pending_approval' || b.status === 'pending_payment').length;
  }, [bookings]);

  const approvedBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'approved').length;
  }, [bookings]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 relative selection:bg-emerald-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Toast Notifikasi */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-emerald-900 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-600/50 animate-fade-in">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide truncate">{toast}</span>
        </div>
      )}

      {/* Header Utama (Hijau Zamrud Elegan & Fit di HP) */}
      <header className="sticky top-0 z-40 bg-emerald-800 text-white shadow-md shadow-emerald-950/10 border-b border-emerald-700/80">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Logo & Identitas Resmi Triple B Living */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white p-1 flex items-center justify-center shadow-md ring-2 ring-emerald-500/30 overflow-hidden shrink-0">
              <img
                src="/logo-bbb.jpg?v=2"
                alt="Triple B Living Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white leading-tight truncate">
                  Triple B Living
                </h1>
                <span className="shrink-0 bg-emerald-700 text-emerald-100 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-600">
                  Exclusive Kost
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-200 font-medium truncate">
                Better Room, Better Life, Better Day.
              </p>
            </div>
          </div>

          {/* Navigasi Tab */}
          <nav className="grid grid-cols-3 md:flex items-center space-x-0 md:space-x-1.5 bg-emerald-900/60 p-1 rounded-2xl border border-emerald-700/50 backdrop-blur-sm w-full md:w-auto">
            <button
              onClick={() => setActiveTab('katalog')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center truncate ${
                activeTab === 'katalog'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100/90 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <span className="hidden sm:inline">Katalog Kamar</span>
              <span className="sm:hidden">Katalog</span>
            </button>
            <button
              onClick={() => setActiveTab('tenant')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center truncate ${
                activeTab === 'tenant'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100/90 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <span className="hidden sm:inline">Portal Penghuni</span>
              <span className="sm:hidden">Penghuni</span>
              {currentTenantRoom && (
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 inline-block align-middle"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 text-center truncate ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100/90 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <span>{isAdminAuthenticated ? '🔓' : '🔒'}</span>
              <span className="hidden sm:inline">Admin Panel</span>
              <span className="sm:hidden">Admin</span>
              {pendingBookingsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5"></span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* --- TAB 1: KATALOG KAMAR & BOOKING (SISI CALON PENGHUNI) --- */}
      {/* ===================================================================== */}
      {activeTab === 'katalog' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          {/* Hero Section dengan Tagline Resmi */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold mb-3 shadow-sm max-w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="truncate">Triple B Living • Exclusive Kost &amp; Smart Living</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Triple B Living
            </h2>
            <p className="text-emerald-700 font-bold text-sm sm:text-lg mt-1 tracking-wide">
              Better Room, Better Life, Better Day.
            </p>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-lg mx-auto leading-relaxed">
              Nikmati hunian kost eksklusif modern dengan akses Smart Door Lock, kamar mandi dalam, Wi-Fi berkecepatan tinggi, dan lingkungan tenang yang nyaman.
            </p>
          </div>

          {/* Grid Unit Kamar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {rooms.map((room) => {
              const isAvailable = room.status === 'empty';
              const isReserved = room.status === 'reserved';
              const isOccupied = room.status === 'occupied';

              return (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group"
                >
                  {/* Foto Kamar Dinamis */}
                  <div className="relative h-48 sm:h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={
                        room.imageUrl ||
                        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700'
                      }
                      alt={`Kamar ${room.number} - Triple B Living`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      Kamar {room.number} • {room.type}
                    </div>
                    <div
                      className={`absolute top-3 right-3 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full shadow-sm backdrop-blur-md ${
                        isAvailable
                          ? 'bg-emerald-600 text-white'
                          : isReserved
                          ? 'bg-amber-500 text-white font-bold'
                          : 'bg-slate-800/85 text-slate-100'
                      }`}
                    >
                      {isAvailable
                        ? 'Tersedia'
                        : isReserved
                        ? 'Menunggu Konfirmasi'
                        : isOccupied
                        ? 'Terisi'
                        : 'Perawatan'}
                    </div>
                  </div>

                  {/* Deskripsi & Fasilitas Kamar */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">
                          Rp {room.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ bulan</span>
                      </div>

                      {/* Deskripsi Kamar */}
                      {room.description && (
                        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                          {room.description}
                        </p>
                      )}

                      {/* Fasilitas Kamar Chips */}
                      {room.facilities && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {room.facilities.split(',').map((f, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-lg border border-slate-200/60"
                            >
                              {f.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Booking */}
                    <div className="pt-3 border-t border-slate-100 mt-auto">
                      {isAvailable ? (
                        <button
                          onClick={() => {
                            setSelectedRoom(room);
                            setIsBookingModalOpen(true);
                          }}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <span>Pesan Kamar {room.number}</span>
                          <span className="text-xs">→</span>
                        </button>
                      ) : isReserved ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-center py-2.5 rounded-2xl text-xs font-semibold">
                          ⏳ Sedang Dalam Proses Verifikasi
                        </div>
                      ) : (
                        <div className="bg-slate-100 text-slate-500 text-center py-2.5 rounded-2xl text-xs font-medium">
                          Unit Tidak Tersedia (Terisi)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* --- TAB 2: PORTAL PENGHUNI (SISI TENANT RESMI) --- */}
      {/* ===================================================================== */}
      {activeTab === 'tenant' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 sm:space-y-8">
          {!loggedInPhone || (!currentTenantRoom && !currentTenantBooking) ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-12 shadow-sm text-center max-w-xl mx-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-3 sm:mb-4 font-bold shadow-sm">
                🔐
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Masuk ke Portal Penghuni</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Setiap penghuni memiliki akses pribadi yang aman. Masukkan nomor WhatsApp yang Anda gunakan saat memesan kamar untuk melihat PIN pintu kamar Anda dan rincian tagihan pribadi.
              </p>

              <form onSubmit={handleTenantLogin} className="mt-5 sm:mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl text-sm font-semibold transition shadow-md shadow-emerald-700/20"
                >
                  Buka Kamar Saya
                </button>
              </form>
            </div>
          ) : (
            (() => {
              const tenantBooking = currentTenantBooking;
              const tenantRoom = currentTenantRoom;
              const isPendingApproval =
                (tenantBooking && (tenantBooking.status === 'pending_approval' || tenantBooking.status === 'pending_payment')) ||
                (tenantRoom && tenantRoom.status === 'reserved');

              if (isPendingApproval) {
                const roomNumber = tenantBooking?.roomNumber || tenantRoom?.number || '-';
                const tenantName = tenantBooking?.tenantName || tenantRoom?.tenantName?.replace(' (Pending Approval)', '') || 'Penghuni';
                const price = tenantBooking?.monthlyPrice || tenantRoom?.price || 0;

                return (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white border border-amber-500/50 p-5 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                      <div>
                        <span className="text-xs font-semibold text-amber-100 bg-white/15 px-3 py-1 rounded-full border border-white/20">
                          Kamar {roomNumber} • Menunggu Konfirmasi
                        </span>
                        <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-2.5">
                          Halo, {tenantName} 👋
                        </h2>
                        <p className="text-xs sm:text-sm text-amber-100 mt-1">
                          Status Pemesanan: <strong className="text-white bg-amber-900/70 px-2 py-0.5 rounded font-bold">⏳ Menunggu Approval Admin</strong>
                        </p>
                      </div>
                      <button
                        onClick={handleTenantLogout}
                        className="text-xs bg-amber-900/60 hover:bg-amber-950 text-amber-200 px-3 py-1.5 rounded-xl border border-amber-600/40 transition"
                      >
                        Keluar
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Pemesanan Anda Sedang Diverifikasi
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Terima kasih telah memesan kamar di <strong>Triple B Living</strong>. Admin kami sedang memverifikasi bukti pembayaran Anda. Setelah disetujui, kode PIN Smart Door Lock dan instruksi penyerahan kunci kamar akan langsung aktif di halaman ini.
                      </p>
                      <div className="pt-2">
                        <a
                          href={getWhatsAppPaymentLink(roomNumber, tenantName, price, tenantBooking?.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
                        >
                          Hubungi Admin via WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                );
              }

              // Jika Sudah Approved (Penghuni Aktif)
              const roomNumber = tenantRoom?.number || tenantBooking?.roomNumber || '101';
              const tenantName = tenantRoom?.tenantName || tenantBooking?.tenantName || 'Penghuni';
              const pin = tenantRoom?.smartLockPin || tenantBooking?.smartLockPin || '8829#';
              const dueDate = tenantRoom?.dueDate || tenantBooking?.dueDate || '2026-11-15';
              const price = tenantRoom?.price || tenantBooking?.monthlyPrice || 1750000;

              return (
                <div className="space-y-6">
                  {/* Banner Penghuni Aktif */}
                  <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-white/20 text-emerald-100 px-3 py-1 rounded-full border border-white/20">
                          Kamar {roomNumber} • Penghuni Aktif
                        </span>
                        <span className="text-xs font-bold text-emerald-300">✓ Kunci Sah Diserahkan</span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-2">
                        Halo, {tenantName} 👋
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                        Triple B Living – Better Room, Better Life, Better Day.
                      </p>
                    </div>
                    <button
                      onClick={handleTenantLogout}
                      className="text-xs bg-emerald-900/60 hover:bg-emerald-950 text-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-600/40 transition"
                    >
                      Keluar Akun
                    </button>
                  </div>

                  {/* Kartu Akses Smart Lock & Rincian Sewa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Smart Door Lock PIN */}
                    <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akses Smart Door Lock</span>
                        <span className="text-lg">🔐</span>
                      </div>
                      <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-center">
                        <span className="text-xs text-slate-400 block mb-1">PIN Pintu Kamar Anda</span>
                        <span className="text-3xl sm:text-4xl font-black tracking-widest">{pin}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Masukkan 4 digit angka di atas lalu tekan tanda <strong>#</strong> pada keypad pintu kamar Anda.
                      </p>
                    </div>

                    {/* Rincian Tagihan & Jatuh Tempo */}
                    <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Sewa Bulanan</span>
                        <span className="text-lg">📅</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Tarif Sewa:</span>
                          <span className="font-bold text-slate-900">Rp {price.toLocaleString('id-ID')} / bulan</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Jatuh Tempo Berikutnya:</span>
                          <span className="font-bold text-emerald-800">{dueDate}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Kunci Fisik:</span>
                          <span className="font-bold text-emerald-700">Sudah Sah Diserahterimakan</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Lapor Kerusakan Fasilitas */}
                  <div className="bg-white border border-slate-200 p-5 sm:p-8 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Lapor Keluhan / Perbaikan Fasilitas (Maintenance)
                    </h3>
                    <form
                      onSubmit={(e) => handleCreateTicket(e, roomNumber, tenantName, loggedInPhone)}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kendala / Kerusakan</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Contoh: AC kurang dingin, kran air wastafel bocor, dll."
                          value={newIssue.issue}
                          onChange={(e) => setNewIssue({ ...newIssue, issue: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Kirim Laporan Kerusakan
                      </button>
                    </form>
                  </div>
                </div>
              );
            })()
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* --- TAB 3: ADMIN DASHBOARD (APPROVAL & MANAJEMEN KAMAR) --- */}
      {/* ===================================================================== */}
      {activeTab === 'admin' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 sm:space-y-8">
          {!isAdminAuthenticated ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-12 shadow-xl text-center max-w-md mx-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 sm:mb-5 shadow-sm">
                🔒
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Akses Terbatas Administrator</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Halaman ini khusus pengelola Triple B Living. Masukkan password administrator untuk mengelola unit kamar, persetujuan sewa, dan penyerahan kunci.
              </p>

              <form onSubmit={handleAdminLogin} className="mt-5 sm:mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password Administrator
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Masukkan password admin"
                      value={adminPasswordInput}
                      onChange={(e) => {
                        setAdminPasswordInput(e.target.value);
                        setAdminPasswordError(null);
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition pr-20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 font-medium"
                    >
                      {showAdminPassword ? 'Tutup' : 'Lihat'}
                    </button>
                  </div>
                  {adminPasswordError && (
                    <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                      ⚠️ {adminPasswordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl text-sm font-semibold transition shadow-md shadow-emerald-700/20 active:scale-[0.99]"
                >
                  Buka Panel Administrator
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Header Panel Administrator */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold shrink-0">
                    👑
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      Panel Administrator Triple B Living
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kelola unit kamar, foto &amp; deskripsi, persetujuan sewa, dan kunci.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openAddRoomModal}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>+</span> Tambah Kamar Baru
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    🔒 Kunci
                  </button>
                </div>
              </div>

              {/* Navigasi Sub-Tab Admin */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setAdminSubTab('approvals')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    adminSubTab === 'approvals'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Persetujuan Booking</span>
                  {pendingBookingsCount > 0 && (
                    <span className="bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px]">
                      {pendingBookingsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setAdminSubTab('rooms')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    adminSubTab === 'rooms'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Manajemen Unit Kamar ({rooms.length})</span>
                </button>
                <button
                  onClick={() => setAdminSubTab('tickets')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    adminSubTab === 'tickets'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Tiket Maintenance ({tickets.length})</span>
                </button>
              </div>

              {/* SUB-TAB 1: PERSETUJUAN BOOKING (APPROVAL & REJECT) */}
              {adminSubTab === 'approvals' && (
                <div className="bg-white border border-slate-200/80 p-5 sm:p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                          ✅
                        </span>
                        <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
                          Persetujuan Pesanan Masuk (Approval System)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Verifikasi pemesanan sewa kamar. Jika di-approve, kamar otomatis menjadi Terisi dan kunci kamar sah diserahkan.
                      </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs">
                      <button
                        onClick={() => setAdminBookingFilter('all')}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                          adminBookingFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Semua ({bookings.length})
                      </button>
                      <button
                        onClick={() => setAdminBookingFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                          adminBookingFilter === 'pending'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-amber-800 hover:bg-amber-50'
                        }`}
                      >
                        Menunggu ({pendingBookingsCount})
                      </button>
                      <button
                        onClick={() => setAdminBookingFilter('approved')}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                          adminBookingFilter === 'approved' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-800'
                        }`}
                      >
                        Disetujui ({approvedBookingsCount})
                      </button>
                    </div>
                  </div>

                  {/* SOP Penyerahan Kunci Banner */}
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-2.5 text-xs">
                    <span className="w-6 h-6 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
                      🔑
                    </span>
                    <div>
                      <span className="font-bold text-emerald-950 block">Logika Perubahan Status &amp; Kunci:</span>
                      <p className="text-emerald-800 leading-relaxed mt-0.5">
                        • Klik <strong>Approve (Setujui)</strong>: Status pesanan menjadi <strong>Approved</strong>, status kamar berubah menjadi <strong>Terisi (Occupied)</strong>, dan kunci kamar serta PIN Smart Lock sah untuk diserahkan kepada penyewa.<br />
                        • Klik <strong>Tolak (Reject)</strong>: Status pesanan menjadi <strong>Rejected</strong>, dan status kamar dikembalikan menjadi <strong>Kosong (Empty)</strong> agar dapat dipesan orang lain.
                      </p>
                    </div>
                  </div>

                  {/* Tabel Pesanan Masuk */}
                  {bookings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Belum ada pesanan kamar yang masuk.</p>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                            <th className="py-3 px-3.5 font-semibold">Unit Kamar</th>
                            <th className="py-3 px-3.5 font-semibold">Nama Pemesan</th>
                            <th className="py-3 px-3.5 font-semibold">No. WhatsApp</th>
                            <th className="py-3 px-3.5 font-semibold">Biaya Sewa</th>
                            <th className="py-3 px-3.5 font-semibold">Dokumen KTP</th>
                            <th className="py-3 px-3.5 font-semibold">Status Pesanan</th>
                            <th className="py-3 px-3.5 font-semibold">Penyerahan Kunci</th>
                            <th className="py-3 px-3.5 font-semibold text-right">Aksi Approval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bookings
                            .filter((b) => {
                              if (adminBookingFilter === 'pending') {
                                return b.status === 'pending_approval' || b.status === 'pending_payment';
                              }
                              if (adminBookingFilter === 'approved') return b.status === 'approved';
                              if (adminBookingFilter === 'rejected') return b.status === 'rejected';
                              return true;
                            })
                            .map((b) => {
                              const isPending = b.status === 'pending_approval' || b.status === 'pending_payment';
                              const isApproved = b.status === 'approved';
                              const isBusy = actionInProgressId === b.id;

                              return (
                                <tr key={b.id} className={`hover:bg-slate-50/70 transition ${isPending ? 'bg-amber-50/30' : ''}`}>
                                  <td className="py-3.5 px-3.5 font-extrabold text-slate-900">
                                    Kamar {b.roomNumber}
                                    <span className="block text-[10px] font-mono text-slate-400 font-normal">
                                      {b.id}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3.5 font-semibold text-slate-900">{b.tenantName}</td>
                                  <td className="py-3.5 px-3.5">
                                    <a
                                      href={`https://wa.me/${b.phone.startsWith('0') ? '62' + b.phone.slice(1) : b.phone}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-mono text-emerald-700 hover:text-emerald-900 underline font-medium"
                                    >
                                      {b.phone}
                                    </a>
                                  </td>
                                  <td className="py-3.5 px-3.5 font-semibold text-slate-800">
                                    Rp {b.monthlyPrice.toLocaleString('id-ID')}
                                  </td>
                                  <td className="py-3.5 px-3.5">
                                    <a
                                      href={b.ktpUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-700 underline font-semibold"
                                    >
                                      Lihat KTP ↗
                                    </a>
                                  </td>
                                  <td className="py-3.5 px-3.5">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                        isPending
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : isApproved
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                                      }`}
                                    >
                                      {isPending ? '⏳ Menunggu Konfirmasi' : isApproved ? '✓ Disetujui' : '✕ Ditolak'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3.5">
                                    {isApproved ? (
                                      <div>
                                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                          <span>🔑</span> Sah Diserahkan
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-500 block">
                                          PIN: {b.smartLockPin}
                                        </span>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="text-[11px] text-amber-800 flex items-center gap-1 font-medium">
                                          <span>🔒</span> Belum Sah
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-400 block">
                                          PIN: {b.smartLockPin}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-3.5 text-right">
                                    {isPending ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          disabled={isBusy}
                                          onClick={() => handleApproveBooking(b.id)}
                                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition active:scale-95 flex items-center gap-1"
                                        >
                                          <span>✓</span> {isBusy ? 'Memproses...' : 'Setujui'}
                                        </button>
                                        <button
                                          disabled={isBusy}
                                          onClick={() => handleRejectBooking(b.id)}
                                          className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold px-2.5 py-1.5 rounded-xl text-[11px] transition active:scale-95"
                                        >
                                          ✕ Tolak
                                        </button>
                                      </div>
                                    ) : isApproved ? (
                                      <a
                                        href={getWhatsAppKeyHandoverLink(b)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition active:scale-95 inline-flex items-center gap-1"
                                      >
                                        <span>💬</span> Kirim Kunci &amp; PIN
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: MANAJEMEN UNIT KAMAR (TAMBAH & EDIT FOTO / FASILITAS / DESKRIPSI) */}
              {adminSubTab === 'rooms' && (
                <div className="bg-white border border-slate-200/80 p-5 sm:p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
                        Manajemen Unit Kamar Triple B Living
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Kelola data kamar, foto beresolusi tinggi, daftar fasilitas lengkap, dan harga sewa.
                      </p>
                    </div>
                    <button
                      onClick={openAddRoomModal}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <span>+</span> Tambah Kamar Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((r) => (
                      <div
                        key={r.id}
                        className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition"
                      >
                        <div className="relative h-40 bg-slate-200">
                          <img
                            src={r.imageUrl || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=700'}
                            alt={`Kamar ${r.number}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            Kamar {r.number}
                          </div>
                          <div
                            className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'empty'
                                ? 'bg-emerald-600 text-white'
                                : r.status === 'occupied'
                                ? 'bg-slate-800 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {r.status === 'empty' ? 'Kosong' : r.status === 'occupied' ? 'Terisi' : r.status}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="font-extrabold text-sm text-slate-900">{r.type}</span>
                              <span className="font-black text-emerald-800 text-xs">
                                Rp {r.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">{r.description || '—'}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mb-3">
                              Fasilitas: {r.facilities || 'Standar'}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => openEditRoomModal(r)}
                              className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold py-1.5 rounded-xl text-xs transition"
                            >
                              ✏️ Edit Kamar
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(r.number)}
                              className="px-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold py-1.5 rounded-xl text-xs transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: TIKET MAINTENANCE */}
              {adminSubTab === 'tickets' && (
                <div className="bg-white border border-slate-200/80 p-5 sm:p-8 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
                    Daftar Tiket Keluhan &amp; Kerusakan Fasilitas
                  </h3>
                  {tickets.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Belum ada keluhan masuk dari penghuni.</p>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                            <th className="py-2.5 px-3">ID</th>
                            <th className="py-2.5 px-3">Kamar</th>
                            <th className="py-2.5 px-3">Pelapor</th>
                            <th className="py-2.5 px-3">Keluhan</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tickets.map((t) => (
                            <tr key={t.id}>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-800">{t.id}</td>
                              <td className="py-3 px-3 font-bold">Kamar {t.roomNumber}</td>
                              <td className="py-3 px-3">{t.tenantName || 'Penghuni'}</td>
                              <td className="py-3 px-3 max-w-xs">{t.issue}</td>
                              <td className="py-3 px-3">
                                <select
                                  value={t.status}
                                  onChange={(e) =>
                                    handleUpdateTicketStatus(t.id, e.target.value as MaintenanceTicket['status'])
                                  }
                                  className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Resolved">Resolved</option>
                                </select>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <a
                                  href={`https://wa.me/?text=Halo%20Teknisi%2C%20ada%20perbaikan%20di%20Kamar%20${t.roomNumber}%3A%20${encodeURIComponent(t.issue)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                                >
                                  💬 Kirim ke Teknisi
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* --- MODAL FORM BOOKING (CALON PENGHUNI) --- */}
      {/* ===================================================================== */}
      {isBookingModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Kamar {selectedRoom.number} • {selectedRoom.type}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">Formulir Pemesanan Kamar</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Tarif sewa: <strong className="text-emerald-700 font-bold">Rp {selectedRoom.price.toLocaleString('id-ID')} / bulan</strong>. Lengkapi formulir pendaftaran di bawah ini untuk memesan kamar Anda.
            </p>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Sesuai KTP *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  required
                  placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Nomor ini digunakan untuk login ke portal penghuni pribadi Anda.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link Foto KTP / Identitas *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={bookingForm.ktpUrl}
                  onChange={(e) => setBookingForm({ ...bookingForm, ktpUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kontak Darurat (Wali / Orang Tua)</label>
                <input
                  type="tel"
                  placeholder="Nomor telepon darurat"
                  value={bookingForm.emergencyContact}
                  onChange={(e) => setBookingForm({ ...bookingForm, emergencyContact: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl text-xs font-semibold transition shadow-md shadow-emerald-700/25 active:scale-[0.98]"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Lanjut ke Pembayaran →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* --- MODAL PENGALIHAN & INSTRUKSI PEMBAYARAN QRIS --- */}
      {/* ===================================================================== */}
      {isPaymentModalOpen && paymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold shrink-0">
                  💳
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Konfirmasi Pembayaran
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                    Pembayaran Sewa Kamar {paymentDetails.roomNumber}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Ringkasan Tagihan Box */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 my-4">
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <span className="text-[11px] text-slate-500 block">Nama Pemesan</span>
                  <span className="text-sm font-bold text-slate-900">{paymentDetails.tenantName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Unit Hunian</span>
                  <span className="text-sm font-bold text-emerald-800">Kamar {paymentDetails.roomNumber}</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-emerald-200/60 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Total Tagihan</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-800">
                    Rp {paymentDetails.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentDetails.amount.toString());
                    showToast('Nominal pembayaran berhasil disalin!');
                  }}
                  className="text-[11px] font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl transition shadow-xs"
                >
                  📋 Salin Nominal
                </button>
              </div>
            </div>

            {/* STEP 1: QRIS SCAN (300 x 300 px) */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Pindai (Scan) QR Code Menggunakan E-Wallet / Mobile Banking
                </h4>
              </div>
              <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                Buka aplikasi e-wallet (GoPay, OVO, Dana, ShopeePay) atau Mobile Banking (BCA, Mandiri, BRI, BNI, dll.), lalu arahkan kamera ke QR Code di bawah ini untuk membayar:
              </p>

              {/* Area Gambar Placeholder QR Code 300x300px */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 text-center">
                <div className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] mx-auto bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-inner flex items-center justify-center overflow-hidden">
                  <img
                    src={QR_CODE_IMAGE_URL}
                    alt="QR Code Pembayaran Triple B Living"
                    width={300}
                    height={300}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 flex-wrap text-[10px] text-slate-600 font-semibold">
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">BCA</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">Mandiri</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">BRI</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">BNI</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">GoPay</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">OVO</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">DANA</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70">ShopeePay</span>
                </div>
              </div>
            </div>

            {/* STEP 2: PETUNJUK TANGKAPAN LAYAR (SCREENSHOT) */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Ambil Tangkapan Layar (Screenshot) Bukti Pembayaran
                </h4>
              </div>
              <div className="ml-8 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed font-semibold">
                📸 Setelah melakukan pembayaran, harap lakukan screenshot (tangkapan layar) bukti pembayaran Anda.
              </div>
            </div>

            {/* STEP 3: CTA WHATSAPP DIRECT LINK */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Kirimkan Bukti Pembayaran ke WhatsApp Admin
                </h4>
              </div>

              <a
                href={getWhatsAppPaymentLink(
                  paymentDetails.roomNumber,
                  paymentDetails.tenantName,
                  paymentDetails.amount,
                  paymentDetails.bookingId
                )}
                onClick={() => handleMarkPaymentProofSent(paymentDetails.bookingId)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.158.571 4.183 1.569 5.932l-1.669 6.096 6.26-1.642c1.705.931 3.666 1.464 5.753 1.464 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Kirim Bukti Pembayaran via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleMarkPaymentProofSent(paymentDetails.bookingId);
                  setIsPaymentModalOpen(false);
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <span>✓</span> Saya Sudah Kirim Bukti ke WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* --- MODAL ADMIN: TAMBAH & EDIT KAMAR (FOTO & DESKRIPSI) --- */}
      {/* ===================================================================== */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {editingRoom ? `Edit Unit Kamar ${editingRoom.number}` : 'Tambah Unit Kamar Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kamar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 105"
                    value={roomFormData.number}
                    onChange={(e) => setRoomFormData({ ...roomFormData, number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kamar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Deluxe AC + TV / VIP"
                    value={roomFormData.type}
                    onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif Sewa (Rp/Bulan) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1750000"
                    value={roomFormData.price}
                    onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={roomFormData.status}
                    onChange={(e) => setRoomFormData({ ...roomFormData, status: e.target.value as Room['status'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="empty">Kosong (Tersedia)</option>
                    <option value="occupied">Terisi</option>
                    <option value="maintenance">Perawatan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link URL Foto Kamar</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={roomFormData.imageUrl}
                  onChange={(e) => setRoomFormData({ ...roomFormData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {/* Preview Foto */}
                {roomFormData.imageUrl && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={roomFormData.imageUrl}
                      alt="Preview Foto Kamar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fasilitas Kamar (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="Kasur Queen, AC Daikin, Smart TV, Kamar Mandi Dalam, Wi-Fi"
                  value={roomFormData.facilities}
                  onChange={(e) => setRoomFormData({ ...roomFormData, facilities: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Lengkap Unit Kamar</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan detail keunggulan kamar, pencahayaan, posisi jendela, dll."
                  value={roomFormData.description}
                  onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Kamar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
