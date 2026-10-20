import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://udwjictieifqiemlgwol.supabase.co';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Xl6rf4nIy2pWVLF5LBOxTw_VDjzgzOe';

// Sanitize URL to ensure standard origin without trailing slashes or /rest/v1
const cleanUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const cleanKey = rawKey.trim();

export const supabase = createClient(cleanUrl, cleanKey);

