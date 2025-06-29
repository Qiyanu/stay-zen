-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create simple user role type
CREATE TYPE user_role_enum AS ENUM ('customer', 'admin');
CREATE TYPE package_tier_enum AS ENUM ('basic', 'premium', 'luxury');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    user_role user_role_enum DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create villas table (company owned)
CREATE TABLE villas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create villa_packages table
CREATE TABLE villa_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    villa_id UUID REFERENCES villas(id) ON DELETE CASCADE NOT NULL,
    package_name TEXT NOT NULL,
    package_tier package_tier_enum NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
    description TEXT NOT NULL,
    amenities TEXT[] DEFAULT '{}',
    included_services TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    villa_id UUID REFERENCES villas(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES villa_packages(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    guests INTEGER NOT NULL CHECK (guests > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    status booking_status_enum DEFAULT 'pending' NOT NULL,
    stripe_payment_intent_id TEXT,
    special_requests TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (end_date > start_date)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_role ON profiles(user_role);
CREATE INDEX idx_villas_location ON villas(location);
CREATE INDEX idx_villas_is_active ON villas(is_active);
CREATE INDEX idx_villa_packages_villa_id ON villa_packages(villa_id);
CREATE INDEX idx_villa_packages_is_active ON villa_packages(is_active);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_villa_id ON bookings(villa_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_villas_updated_at
    BEFORE UPDATE ON villas
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_villa_packages_updated_at
    BEFORE UPDATE ON villa_packages
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;
ALTER TABLE villa_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies

-- Profiles: Users can only see/edit their own profile, admins see all
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Villas: Everyone can view active villas, only admins can manage
CREATE POLICY "Anyone can view active villas" ON villas
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all villas" ON villas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Villa Packages: Everyone can view active packages, only admins can manage
CREATE POLICY "Anyone can view active packages" ON villa_packages
    FOR SELECT USING (
        is_active = true AND
        EXISTS (SELECT 1 FROM villas WHERE id = villa_id AND is_active = true)
    );

CREATE POLICY "Admins can manage all packages" ON villa_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Bookings: Users see their own bookings, admins see all
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending bookings" ON bookings
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        status = 'pending'
    );

CREATE POLICY "Admins can view and manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Simple function to check if dates are available (no double bookings)
CREATE OR REPLACE FUNCTION check_booking_availability(
    p_villa_id UUID,
    p_package_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for conflicting confirmed/pending bookings
    SELECT COUNT(*)
    INTO conflict_count
    FROM bookings
    WHERE villa_id = p_villa_id
    AND package_id = p_package_id
    AND status IN ('confirmed', 'pending')
    AND (id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
    AND (
        (start_date <= p_start_date AND end_date > p_start_date) OR
        (start_date < p_end_date AND end_date >= p_end_date) OR
        (start_date >= p_start_date AND end_date <= p_end_date)
    );
    
    -- Return true if no conflicts
    RETURN (conflict_count = 0);
END;
$$ LANGUAGE plpgsql;