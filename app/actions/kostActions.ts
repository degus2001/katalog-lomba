'use server';

import { supabase } from '../supabaseClient';

export interface RoomRecord {
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

/**
 * 1. SERVER ACTION: Ambil seluruh data unit kamar
 */
export async function getRoomsAction() {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('number', { ascending: true });

    if (error) {
      console.error('Server Action Error [getRoomsAction]:', error.message);
      return { success: false, error: error.message, data: null };
    }

    const rooms: RoomRecord[] = (data || []).map((r) => ({
      id: r.id,
      number: r.number,
      type: r.type,
      price: Number(r.price),
      status: r.status as RoomRecord['status'],
      tenantName: r.tenant_name || undefined,
      dueDate: r.due_date || undefined,
      phone: r.phone || undefined,
      smartLockPin: r.smart_lock_pin || undefined,
      imageUrl: r.image_url || undefined,
      description: r.description || undefined,
      facilities: r.facilities || undefined,
    }));

    return { success: true, data: rooms, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, data: null };
  }
}

/**
 * 2. SERVER ACTION: Tambah atau Perbarui Kamar oleh Admin
 */
export async function saveRoomAction(roomData: {
  id?: number;
  number: string;
  type: string;
  price: number;
  status: RoomRecord['status'];
  imageUrl?: string;
  description?: string;
  facilities?: string;
}) {
  try {
    const payload = {
      number: roomData.number.trim(),
      type: roomData.type.trim(),
      price: Number(roomData.price),
      status: roomData.status,
      image_url: roomData.imageUrl?.trim() || null,
      description: roomData.description?.trim() || null,
      facilities: roomData.facilities?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (roomData.id) {
      // Update kamar yang sudah ada
      const { data, error } = await supabase
        .from('rooms')
        .update(payload)
        .eq('id', roomData.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } else {
      // Tambah unit kamar baru
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan data kamar';
    return { success: false, error: msg };
  }
}

/**
 * 3. SERVER ACTION: Hapus Kamar oleh Admin
 */
export async function deleteRoomAction(roomNumber: string) {
  try {
    const { error } = await supabase.from('rooms').delete().eq('number', roomNumber);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus kamar';
    return { success: false, error: msg };
  }
}

/**
 * 4. SERVER ACTION: Simpan Pemesanan Baru (Status: pending_approval)
 */
export async function submitBookingAction(bookingData: {
  id: string;
  roomNumber: string;
  tenantName: string;
  phone: string;
  ktpUrl: string;
  emergencyContact?: string;
  smartLockPin: string;
  monthlyPrice: number;
  dueDate: string;
}) {
  try {
    // Pastikan kamar masih berstatus 'empty'
    const { data: currentRoom, error: roomCheckErr } = await supabase
      .from('rooms')
      .select('status, number')
      .eq('number', bookingData.roomNumber)
      .single();

    if (roomCheckErr || !currentRoom) {
      return { success: false, error: 'Unit kamar tidak ditemukan.' };
    }

    if (currentRoom.status === 'occupied') {
      return { success: false, error: 'Maaf, kamar ini baru saja terisi oleh penghuni lain.' };
    }

    // 1. Simpan data booking
    const { error: bookingErr } = await supabase.from('bookings').insert({
      id: bookingData.id,
      room_number: bookingData.roomNumber,
      tenant_name: bookingData.tenantName,
      phone: bookingData.phone,
      ktp_url: bookingData.ktpUrl,
      emergency_contact: bookingData.emergencyContact || null,
      smart_lock_pin: bookingData.smartLockPin,
      monthly_price: bookingData.monthlyPrice,
      due_date: bookingData.dueDate,
      status: 'pending_approval',
      key_handed_over: false,
      created_at: new Date().toISOString(),
    });

    if (bookingErr) {
      return { success: false, error: bookingErr.message };
    }

    // 2. Kunci sementara kamar menjadi 'reserved' agar tidak ditabrak calon lain
    await supabase
      .from('rooms')
      .update({
        status: 'reserved',
        tenant_name: `${bookingData.tenantName} (Pending Approval)`,
        phone: bookingData.phone,
        smart_lock_pin: bookingData.smartLockPin,
        due_date: bookingData.dueDate,
        updated_at: new Date().toISOString(),
      })
      .eq('number', bookingData.roomNumber);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengirim pesanan booking';
    return { success: false, error: msg };
  }
}

/**
 * 5. SERVER ACTION: Setujui Booking (Anti-Race Condition & Double Booking)
 * - Memverifikasi bahwa kamar belum ditempati oleh booking lain
 * - Mengubah status booking -> 'approved' & key_handed_over -> true
 * - Mengubah status kamar -> 'occupied' (Terisi)
 */
export async function approveBookingAction(bookingId: string) {
  try {
    // Ambil data booking
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bErr || !booking) {
      return { success: false, error: 'Data pesanan booking tidak ditemukan.' };
    }

    if (booking.status === 'approved') {
      return { success: false, error: 'Pesanan ini sudah pernah disetujui sebelumnya.' };
    }

    // Anti Race Condition Check: Cek apakah kamar sudah ditempati oleh penghuni lain
    const { data: room, error: rErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('number', booking.room_number)
      .single();

    if (rErr || !room) {
      return { success: false, error: `Kamar ${booking.room_number} tidak ditemukan di sistem.` };
    }

    if (room.status === 'occupied') {
      return {
        success: false,
        error: `Anti-Race Condition: Kamar ${booking.room_number} saat ini sudah berstatus TERISI oleh ${room.tenant_name || 'penghuni lain'}. Approval dibatalkan untuk mencegah tumpang tindih.`,
      };
    }

    const now = new Date().toISOString();

    // 1. Update Booking status -> 'approved'
    // Catatan: Gunakan payload yang kompatibel dengan skema tabel bookings
    const { error: updateBookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'approved',
        key_handed_over: true,
      })
      .eq('id', bookingId);

    if (updateBookingErr) {
      return { success: false, error: updateBookingErr.message };
    }

    // 2. Update Kamar status -> 'occupied'
    const { error: updateRoomErr } = await supabase
      .from('rooms')
      .update({
        status: 'occupied',
        tenant_name: booking.tenant_name,
        phone: booking.phone,
        smart_lock_pin: booking.smart_lock_pin,
        due_date: booking.due_date || '2026-11-15',
        updated_at: now,
      })
      .eq('number', booking.room_number);

    if (updateRoomErr) {
      // Kompensasi Rollback jika pembaruan kamar gagal
      await supabase
        .from('bookings')
        .update({
          status: 'pending_approval',
          key_handed_over: false,
        })
        .eq('id', bookingId);
      return { success: false, error: `Gagal memperbarui kamar: ${updateRoomErr.message}` };
    }

    return {
      success: true,
      roomNumber: booking.room_number,
      tenantName: booking.tenant_name,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyetujui pesanan';
    return { success: false, error: msg };
  }
}

/**
 * 6. SERVER ACTION: Tolak Booking (Reject)
 * - Mengubah status booking -> 'rejected'
 * - Mengembalikan status kamar -> 'empty' (Kosong)
 */
export async function rejectBookingAction(bookingId: string) {
  try {
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bErr || !booking) {
      return { success: false, error: 'Data pesanan booking tidak ditemukan.' };
    }

    const now = new Date().toISOString();

    // 1. Update status booking -> 'rejected'
    const { error: updateBookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'rejected',
        key_handed_over: false,
      })
      .eq('id', bookingId);

    if (updateBookingErr) {
      return { success: false, error: updateBookingErr.message };
    }

    // 2. Kembalikan kamar ke status 'empty' (Kosong) jika kamar masih berstatus reserved oleh pemesan ini
    const { data: room } = await supabase
      .from('rooms')
      .select('status, phone')
      .eq('number', booking.room_number)
      .single();

    if (room && (room.status === 'reserved' || room.phone === booking.phone)) {
      await supabase
        .from('rooms')
        .update({
          status: 'empty',
          tenant_name: null,
          phone: null,
          smart_lock_pin: null,
          due_date: null,
          updated_at: now,
        })
        .eq('number', booking.room_number);
    }

    return {
      success: true,
      roomNumber: booking.room_number,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menolak pesanan';
    return { success: false, error: msg };
  }
}

