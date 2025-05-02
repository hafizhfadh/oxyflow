-- Create extension for PostGIS (for geolocation features)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create warehouses table
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add geography column for spatial queries
SELECT AddGeometryColumn('warehouses', 'location', 4326, 'POINT', 2);

-- Create cylinders table
CREATE TABLE cylinders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_code TEXT NOT NULL UNIQUE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'on_loan')),
  last_maintenance TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create borrowers table
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  ktp_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID REFERENCES borrowers(id) ON DELETE CASCADE,
  cylinder_id UUID REFERENCES cylinders(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  loan_date TIMESTAMP WITH TIME ZONE,
  expected_return_date TIMESTAMP WITH TIME ZONE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'on_loan', 'return_requested', 'returned', 'overdue')),
  loan_photo_url TEXT,
  return_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_logs table
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cylinder_id UUID REFERENCES cylinders(id) ON DELETE CASCADE,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('oxy_docs', 'oxy_docs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('oxy_evidence', 'oxy_evidence', true);

-- Set up Row Level Security (RLS) policies
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cylinders ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (staff)
CREATE POLICY "Staff can view all warehouses" ON warehouses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can manage warehouses" ON warehouses FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view all cylinders" ON cylinders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can manage cylinders" ON cylinders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view all borrowers" ON borrowers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can manage borrowers" ON borrowers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view all loans" ON loans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can manage loans" ON loans FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can view all maintenance logs" ON maintenance_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can manage maintenance logs" ON maintenance_logs FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for anonymous users (public forms)
CREATE POLICY "Public can view available cylinders" ON cylinders FOR SELECT USING (status = 'available');
CREATE POLICY "Public can create borrowers" ON borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create loan requests" ON loans FOR INSERT WITH CHECK (status = 'requested');
CREATE POLICY "Public can update loan status to return_requested" ON loans FOR UPDATE USING (status IN ('on_loan', 'approved')) WITH CHECK (status = 'return_requested');

-- Create function to update cylinder status when loan status changes
CREATE OR REPLACE FUNCTION update_cylinder_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' OR NEW.status = 'on_loan' THEN
    UPDATE cylinders SET status = 'on_loan' WHERE id = NEW.cylinder_id;
  ELSIF NEW.status = 'returned' THEN
    UPDATE cylinders SET status = 'available' WHERE id = NEW.cylinder_id;
  ELSIF NEW.status = 'requested' THEN
    UPDATE cylinders SET status = 'reserved' WHERE id = NEW.cylinder_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update cylinder status
CREATE TRIGGER update_cylinder_status_trigger
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_cylinder_status();

-- Create function to update warehouse location point from lat/lon
CREATE OR REPLACE FUNCTION update_warehouse_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update warehouse location
CREATE TRIGGER update_warehouse_location_trigger
BEFORE INSERT OR UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_warehouse_location();