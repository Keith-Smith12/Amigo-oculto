// Supabase Database Types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GiftIdea {
  id: string;
  friend_id: string;
  user_id: string;
  title: string;
  description?: string;
  price_range?: PriceRange;
  url?: string;
  image_url?: string;
  priority: Priority;
  is_purchased: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  budget_min?: number;
  budget_max?: number;
  draw_date?: string;
  exchange_date?: string;
  is_drawn: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  friend_id?: string;
  user_id?: string;
  name: string;
  email?: string;
  is_confirmed: boolean;
  assigned_to_id?: string;
  created_at: string;
}

export interface DrawResult {
  id: string;
  group_id: string;
  giver_id: string;
  receiver_id: string;
  is_revealed: boolean;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  group_id?: string;
  title: string;
  description?: string;
  url?: string;
  price?: number;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

// Enums
export type PriceRange = 'low' | 'medium' | 'high' | 'luxury';
export type Priority = 'low' | 'medium' | 'high';
export type GroupStatus = 'pending' | 'ready' | 'drawn' | 'completed';

// Form Types
export interface CreateFriendInput {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateGiftIdeaInput {
  friend_id: string;
  title: string;
  description?: string;
  price_range?: PriceRange;
  url?: string;
  image_url?: string;
  priority?: Priority;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  budget_min?: number;
  budget_max?: number;
  draw_date?: string;
  exchange_date?: string;
}

export interface AddGroupMemberInput {
  group_id: string;
  name: string;
  email?: string;
  friend_id?: string;
}

export interface CreateWishlistInput {
  title: string;
  description?: string;
  url?: string;
  price?: number;
  priority?: Priority;
  group_id?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// UI State Types
export interface DrawReveal {
  groupName: string;
  giverName: string;
  receiverName: string;
  receiverWishlist?: Wishlist[];
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  member_count: number;
}

export interface FriendWithGifts extends Friend {
  gift_ideas: GiftIdea[];
}

// Database Schema Types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      friends: {
        Row: Friend;
        Insert: Omit<Friend, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Friend, 'id' | 'created_at'>>;
      };
      gift_ideas: {
        Row: GiftIdea;
        Insert: Omit<GiftIdea, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GiftIdea, 'id' | 'created_at'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Group, 'id' | 'created_at'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'created_at'>;
        Update: Partial<Omit<GroupMember, 'id' | 'created_at'>>;
      };
      draw_results: {
        Row: DrawResult;
        Insert: Omit<DrawResult, 'id' | 'created_at'>;
        Update: Partial<Omit<DrawResult, 'id' | 'created_at'>>;
      };
      wishlists: {
        Row: Wishlist;
        Insert: Omit<Wishlist, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wishlist, 'id' | 'created_at'>>;
      };
    };
  };
}
