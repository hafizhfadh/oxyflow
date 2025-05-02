'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';

export default function BorrowPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    ktpNumber: '',
    ktpFile: null as File | null,
  });

  // Get user's geolocation when component mounts
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
        .upload(ktpFileName, formData.ktpFile);

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

      // 3. Find nearest available cylinder
      // This query uses PostGIS to find the nearest warehouse with available cylinders
      const { data: nearestCylinder, error: cylinderError } = await supabase
        .rpc('find_nearest_available_cylinder', {
          user_lat: location.lat,
          user_lon: location.lon,
        });

      if (cylinderError || !nearestCylinder || nearestCylinder.length === 0) {
        throw new Error('No available cylinders found nearby. Please try again later.');
      }

      // 4. Create loan request
      const { error: loanError } = await supabase.from('loans').insert([
        {
          borrower_id: borrowerId,
          cylinder_id: nearestCylinder[0].cylinder_id,
          warehouse_id: nearestCylinder[0].warehouse_id,
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
                <p>Location detected! We'll find the nearest available cylinder for you.</p>
              </div>
            ) : (
              <div className="bg-muted rounded-xl p-4 text-sm">
                <p>Please share your location to help us find the nearest available cylinder.</p>
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

            <Button type="submit" className="w-full" disabled={isLoading || !location}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}