// Supabase Database Types
// This file should be regenerated from Supabase when schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PriceRange = 'low' | 'medium' | 'high' | 'luxury';
export type Priority = 'low' | 'medium' | 'high';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friends_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      gift_ideas: {
        Row: {
          id: string;
          friend_id: string;
          user_id: string;
          title: string;
          description: string | null;
          price_range: PriceRange | null;
          url: string | null;
          image_url: string | null;
          priority: Priority;
          is_purchased: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          friend_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          price_range?: PriceRange | null;
          url?: string | null;
          image_url?: string | null;
          priority?: Priority;
          is_purchased?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          friend_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          price_range?: PriceRange | null;
          url?: string | null;
          image_url?: string | null;
          priority?: Priority;
          is_purchased?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gift_ideas_friend_id_fkey';
            columns: ['friend_id'];
            referencedRelation: 'friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gift_ideas_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          budget_min: number | null;
          budget_max: number | null;
          draw_date: string | null;
          exchange_date: string | null;
          is_drawn: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          budget_min?: number | null;
          budget_max?: number | null;
          draw_date?: string | null;
          exchange_date?: string | null;
          is_drawn?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          draw_date?: string | null;
          exchange_date?: string | null;
          is_drawn?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_owner_id_fkey';
            columns: ['owner_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          friend_id: string | null;
          user_id: string | null;
          name: string;
          email: string | null;
          is_confirmed: boolean;
          assigned_to_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          friend_id?: string | null;
          user_id?: string | null;
          name: string;
          email?: string | null;
          is_confirmed?: boolean;
          assigned_to_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          friend_id?: string | null;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          is_confirmed?: boolean;
          assigned_to_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_friend_id_fkey';
            columns: ['friend_id'];
            referencedRelation: 'friends';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_assigned_to_id_fkey';
            columns: ['assigned_to_id'];
            referencedRelation: 'group_members';
            referencedColumns: ['id'];
          }
        ];
      };
      draw_results: {
        Row: {
          id: string;
          group_id: string;
          giver_id: string;
          receiver_id: string;
          is_revealed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          giver_id: string;
          receiver_id: string;
          is_revealed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          giver_id?: string;
          receiver_id?: string;
          is_revealed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'draw_results_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'draw_results_giver_id_fkey';
            columns: ['giver_id'];
            referencedRelation: 'group_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'draw_results_receiver_id_fkey';
            columns: ['receiver_id'];
            referencedRelation: 'group_members';
            referencedColumns: ['id'];
          }
        ];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          title: string;
          description: string | null;
          url: string | null;
          price: number | null;
          priority: Priority;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          title: string;
          description?: string | null;
          url?: string | null;
          price?: number | null;
          priority?: Priority;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string | null;
          title?: string;
          description?: string | null;
          url?: string | null;
          price?: number | null;
          priority?: Priority;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wishlists_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wishlists_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      perform_draw: {
        Args: {
          p_group_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      price_range: PriceRange;
      priority: Priority;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type User = Tables<'users'>;
export type Friend = Tables<'friends'>;
export type GiftIdea = Tables<'gift_ideas'>;
export type Group = Tables<'groups'>;
export type GroupMember = Tables<'group_members'>;
export type DrawResult = Tables<'draw_results'>;
export type Wishlist = Tables<'wishlists'>;
