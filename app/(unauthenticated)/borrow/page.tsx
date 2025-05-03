'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';

export default function BorrowPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [availableWarehouses, setAvailableWarehouses] = useState<Array<{ id: string; name: string; distance: number; cylinder_id: string; lat: number; lon: number }>>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    ktpNumber: '',
    ktpFile: null as File | null,
  });

  // Get user's geolocation when component mounts
  useEffect(() => {
    if (location) {
      fetchAvailableCylinders();
    }
  }, [location]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setError(null);
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
          console.error('Error getting geolocation:', err);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, ktpFile: e.target.files![0] }));
    }
  };

  // Fetch all available cylinders from all warehouses
  const fetchAvailableCylinders = async () => {
    if (!location) return;
    
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Get all warehouses with available cylinders
      const { data, error } = await supabase
        .from('warehouses')
        .select(`
          id,
          name,
          lat,
          lon,
          cylinders!inner(id, status)
        `)
        .eq('cylinders.status', 'available');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setAvailableWarehouses([]);
        return;
      }
      
      // Calculate distance from user to each warehouse
      const warehousesWithDistance = data.map(warehouse => {
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          location.lat,
          location.lon,
          warehouse.lat,
          warehouse.lon
        );
        
        return {
          id: warehouse.id,
          name: warehouse.name,
          lat: warehouse.lat,
          lon: warehouse.lon,
          distance: distance,
          cylinder_id: warehouse.cylinders[0].id // Take the first available cylinder
        };
      });
      
      // Sort by distance
      warehousesWithDistance.sort((a, b) => a.distance - b.distance);
      
      setAvailableWarehouses(warehousesWithDistance);
      
      // Auto-select the nearest warehouse if available
      if (warehousesWithDistance.length > 0) {
        setSelectedWarehouse(warehousesWithDistance[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching available cylinders:', err);
      setError(`Error finding available cylinders: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Make sure we have location
      if (!location) {
        throw new Error('Location is required. Please enable location services.');
      }

      // Make sure we have all required fields
      if (!formData.fullName || !formData.phone || !formData.address || !formData.ktpNumber || !formData.ktpFile) {
        throw new Error('All fields are required');
      }

      const supabase = createClient();

      // 1. Upload KTP image to Supabase storage
      const ktpFileName = `${formData.ktpNumber}-${Date.now()}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('oxy_docs')
        .upload(ktpFileName, formData.ktpFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error uploading KTP: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage.from('oxy_docs').getPublicUrl(ktpFileName);
      const ktpUrl = urlData.publicUrl;

      // 2. Insert borrower data
      const { data: borrowerData, error: borrowerError } = await supabase
        .from('borrowers')
        .insert([
          {
            full_name: formData.fullName,
            ktp_number: formData.ktpNumber,
            phone: formData.phone,
            address: formData.address,
          },
        ])
        .select();

      if (borrowerError) {
        throw new Error(`Error creating borrower: ${borrowerError.message}`);
      }

      const borrowerId = borrowerData[0].id;

      // 3. Get selected warehouse and cylinder
      if (!selectedWarehouse || availableWarehouses.length === 0) {
        throw new Error('Please select a warehouse with available cylinders');
      }
      
      const selectedWarehouseData = availableWarehouses.find(w => w.id === selectedWarehouse);
      
      if (!selectedWarehouseData) {
        throw new Error('Selected warehouse not found. Please try again.');
      }

      // 4. Create loan request
      const { error: loanError } = await supabase.from('loans').insert([
        {
          borrower_id: borrowerId,
          cylinder_id: selectedWarehouseData.cylinder_id,
          warehouse_id: selectedWarehouseData.id,
          status: 'requested',
          loan_photo_url: ktpUrl,
          expected_return_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        },
      ]);

      if (loanError) {
        throw new Error(`Error creating loan request: ${loanError.message}`);
      }

      // Success!
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 5000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting form:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Borrow an Oxygen Cylinder</h1>

      {success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-2xl text-center">
          <h2 className="text-2xl font-semibold mb-2">Request Submitted Successfully!</h2>
          <p className="mb-4">
            Your oxygen cylinder request has been received. Our staff will review your request and contact you soon.
          </p>
          <Button onClick={() => router.push('/')} className="mt-2">
            Return to Home
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Location</h2>
              <Button onClick={getLocation} variant="outline" size="sm">
                {location ? 'Update Location' : 'Get My Location'}
              </Button>
            </div>

            {location ? (
              <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm">
                <p>Location detected! You can select from any available warehouse.</p>
              </div>
            ) : (
              <div className="bg-muted rounded-xl p-4 text-sm">
                <p>Please share your location to help us find available cylinders.</p>
              </div>
            )}
            
            {location && availableWarehouses.length > 0 && (
              <div className="mt-4">
                <Label htmlFor="warehouse">Select Warehouse</Label>
                <Select
                  value={selectedWarehouse}
                  onValueChange={setSelectedWarehouse}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWarehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.distance.toFixed(1)} km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWarehouse && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        const warehouse = availableWarehouses.find(w => w.id === selectedWarehouse);
                        if (warehouse) {
                          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${warehouse.lat},${warehouse.lon}`;
                          window.open(mapsUrl, '_blank');
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                        <line x1="9" x2="9" y1="3" y2="18"/>
                        <line x1="15" x2="15" y1="6" y2="21"/>
                      </svg>
                      Go to Maps
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {location && availableWarehouses.length === 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl">
                <p>No warehouses with available cylinders found. Please try again later.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ktpNumber">KTP Number</Label>
                <Input
                  id="ktpNumber"
                  name="ktpNumber"
                  placeholder="Enter your KTP number"
                  value={formData.ktpNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ktpFile">Upload KTP Photo</Label>
                <Input
                  id="ktpFile"
                  name="ktpFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Please upload a clear photo of your KTP for verification purposes.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !location || !selectedWarehouse}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}