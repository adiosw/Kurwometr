// Re-export from new client structure for backwards compatibility
export { supabase, createClient } from './supabase/client';

// Types
export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  tier: 0 | 1 | 2 | 3;          // 0=Free,1=Premium,2=Legend,3=VIPDonor
  tier_expires_at: string | null; // null = lifetime
  is_donor: boolean;
  total_donated: number;
  mic_uses_today: number;
  mic_reset_date: string | null;
  created_at: string;
};

export type Donation = {
  id: number;
  user_id: string | null;
  stripe_session_id: string | null;
  amount: number;
  currency: string;
  beer_type: string | null;
  beer_custom_name: string | null;
  message: string | null;
  display_name: string | null;
  is_anonymous: boolean;
  status: 'pending' | 'completed' | 'refunded';
  lucky_shot_won: boolean;
  lucky_tier: 1 | 2 | null;
  created_at: string;
};

export type League = {
  id: number;
  slug: string;
  name: string;
  owner_id: string;
  invite_code: string;
  is_public: boolean;
  created_at: string;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author: string;
  tags: string[] | null;
  read_time: number;
  published: boolean;
  published_at: string | null;
};
