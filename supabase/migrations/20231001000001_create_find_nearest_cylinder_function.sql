-- Create function to find nearest available cylinder based on user location
CREATE OR REPLACE FUNCTION find_nearest_available_cylinder(user_lat FLOAT, user_lon FLOAT)
RETURNS TABLE (
  cylinder_id UUID,
  warehouse_id UUID,
  warehouse_name TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS cylinder_id,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    ST_Distance(
      w.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326),
      true
    ) AS distance_meters
  FROM 
    cylinders c
    JOIN warehouses w ON c.warehouse_id = w.id
  WHERE 
    c.status = 'available'
  ORDER BY 
    distance_meters ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;