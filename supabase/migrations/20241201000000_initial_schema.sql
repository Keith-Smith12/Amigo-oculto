-- =====================================================
-- AMIGO OCULTO - Supabase Database Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create
-- all the necessary tables for the Amigo Oculto app.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Price range enum for gift ideas
CREATE TYPE price_range AS ENUM ('low', 'medium', 'high', 'luxury');

-- Priority enum for gifts and wishlist
CREATE TYPE priority AS ENUM ('low', 'medium', 'high');

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Gift Ideas table
CREATE TABLE IF NOT EXISTS public.gift_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    friend_id UUID NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_range price_range,
    url TEXT,
    image_url TEXT,
    priority priority DEFAULT 'medium' NOT NULL,
    is_purchased BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Groups table (for Secret Santa events)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    draw_date DATE,
    exchange_date DATE,
    is_drawn BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Group Members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.friends(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    is_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    assigned_to_id UUID REFERENCES public.group_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Draw Results table
CREATE TABLE IF NOT EXISTS public.draw_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    giver_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
    is_revealed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    price DECIMAL(10,2),
    priority priority DEFAULT 'medium' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Friends indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_name ON public.friends(name);

-- Gift Ideas indexes
CREATE INDEX IF NOT EXISTS idx_gift_ideas_user_id ON public.gift_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_ideas_friend_id ON public.gift_ideas(friend_id);
CREATE INDEX IF NOT EXISTS idx_gift_ideas_is_purchased ON public.gift_ideas(is_purchased);

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_drawn ON public.groups(is_drawn);

-- Group Members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- Draw Results indexes
CREATE INDEX IF NOT EXISTS idx_draw_results_group_id ON public.draw_results(group_id);
CREATE INDEX IF NOT EXISTS idx_draw_results_giver_id ON public.draw_results(giver_id);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_group_id ON public.wishlists(group_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can view their own friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own friends" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friends" ON public.friends
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friends" ON public.friends
    FOR DELETE USING (auth.uid() = user_id);

-- Gift Ideas policies
CREATE POLICY "Users can view their own gift ideas" ON public.gift_ideas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gift ideas" ON public.gift_ideas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gift ideas" ON public.gift_ideas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gift ideas" ON public.gift_ideas
    FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Users can view their own groups" ON public.groups
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own groups" ON public.groups
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own groups" ON public.groups
    FOR DELETE USING (auth.uid() = owner_id);

-- Group Members policies
CREATE POLICY "Group owners can view members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_members.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can insert members" ON public.group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_members.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can update members" ON public.group_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_members.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can delete members" ON public.group_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_members.group_id
            AND groups.owner_id = auth.uid()
        )
    );

-- Draw Results policies
CREATE POLICY "Group owners can view draw results" ON public.draw_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = draw_results.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can insert draw results" ON public.draw_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = draw_results.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can update draw results" ON public.draw_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = draw_results.group_id
            AND groups.owner_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can delete draw results" ON public.draw_results
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = draw_results.group_id
            AND groups.owner_id = auth.uid()
        )
    );

-- Wishlists policies
CREATE POLICY "Users can view their own wishlist" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public wishlists" ON public.wishlists
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wishlist items" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items" ON public.wishlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
    BEFORE UPDATE ON public.friends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_ideas_updated_at
    BEFORE UPDATE ON public.gift_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at
    BEFORE UPDATE ON public.wishlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Handle new user creation
-- =====================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (Optional - Comment out in production)
-- =====================================================

-- You can uncomment this section to add sample data for testing
/*
-- Insert sample user (after signing up via the app)
-- INSERT INTO public.users (id, email, name)
-- VALUES ('your-user-uuid', 'test@example.com', 'Test User');

-- Insert sample friends
-- INSERT INTO public.friends (user_id, name, email, notes)
-- VALUES
--     ('your-user-uuid', 'Maria Silva', 'maria@example.com', 'Gosta de livros e chocolates'),
--     ('your-user-uuid', 'João Santos', 'joao@example.com', 'Fã de tecnologia'),
--     ('your-user-uuid', 'Ana Costa', 'ana@example.com', 'Adora plantas');
*/
