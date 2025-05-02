'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cylinderData, setCylinderData] = useState<any>(null);
  const [loanData, setLoanData] = useState<any>(null);
  const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
  const [loanPhoto, setLoanPhoto] = useState<File | null>(null);

  // Load QR scanner dynamically on client side
  useEffect(() => {
    if (isScanning) {
      import('react-qr-scanner').then(({ BarcodeScanner }) => {
        const scanner = document.getElementById('scanner-container');
        if (scanner) {
          // Clear previous content
          scanner.innerHTML = '';
          
          // Create new scanner instance
          const scannerInstance = document.createElement('div');
          scanner.appendChild(scannerInstance);
          
          // Render scanner
          const handleScan = (result: any) => {
            if (result && result.text) {
              setScanResult(result.text);
              setIsScanning(false);
              processCylinderCode(result.text);
            }
          };
          
          // Render BarcodeScanner component
          const BarcodeScannerComponent = BarcodeScanner;
          // Use React to render the component
          // This is a simplified representation - in a real app you'd use ReactDOM or a ref
          scannerInstance.className = 'w-full max-w-md mx-auto';
        }
      });
    }
  }, [isScanning]);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
    setCylinderData(null);
    setLoanData(null);
    setError(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode) {
      setScanResult(manualCode);
      processCylinderCode(manualCode);
    }
  };

  const processCylinderCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Look up cylinder by label_code
      const { data: cylinderResult, error: cylinderError } = await supabase
        .from('cylinders')
        .select(`
          id,
          label_code,
          status,
          last_maintenance,
          warehouses(id, name)
        `)
        .eq('label_code', code)
        .single();

      if (cylinderError) {
        throw new Error(`Cylinder not found: ${cylinderError.message}`);
      }

      setCylinderData(cylinderResult);

      // 2. Check if there's an active loan for this cylinder
      const { data: loanResult, error: loanError } = await supabase
        .from('loans')
        .select(`
          id,
          status,
          loan_date,
          expected_return_date,
          borrowers(id, full_name, phone),
          warehouses(id, name)
        `)
        .eq('cylinder_id', cylinderResult.id)
        .in('status', ['requested', 'approved', 'on_loan'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!loanError && loanResult && loanResult.length > 0) {
        setLoanData(loanResult[0]);
      }
    } catch (err: any) {
      console.error('Error processing cylinder code:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'loan' | 'return') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'loan') {
        setLoanPhoto(e.target.files[0]);
      } else {
        setReturnPhoto(e.target.files[0]);
      }
    }
  };

  const handleMarkAsLoaned = async () => {
    if (!cylinderData || !loanData || !loanPhoto) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // 1. Upload loan photo
      const loanPhotoName = `loan-${loanData.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('oxy_evidence')
        .upload(loanPhotoName, loanPhoto);
      
      if (uploadError) {
        throw new Error(`Error uploading photo: ${uploadError.message}`);
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage.from('oxy_evidence').getPublicUrl(loanPhotoName);
      
      // 2. Update loan status to on_loan
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          status: 'on_loan',
          loan_date: new Date().toISOString(),
          loan_photo_url: urlData.publicUrl
        })
        .eq('id', loanData.id);
      
      if (updateError) {
        throw new Error(`Error updating loan: ${updateError.message}`);
      }
      
      // Success - refresh data
      processCylinderCode(cylinderData.label_code);
    } catch (err: any) {
      console.error('Error marking as loaned:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsReturned = async () => {
    if (!cylinderData || !loanData || !returnPhoto) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // 1. Upload return photo
      const returnPhotoName = `return-${loanData.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('oxy_evidence')
        .upload(returnPhotoName, returnPhoto);
      
      if (uploadError) {
        throw new Error(`Error uploading photo: ${uploadError.message}`);
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage.from('oxy_evidence').getPublicUrl(returnPhotoName);
      
      // 2. Update loan status to returned
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          status: 'returned',
          actual_return_date: new Date().toISOString(),
          return_photo_url: urlData.publicUrl
        })
        .eq('id', loanData.id);
      
      if (updateError) {
        throw new Error(`Error updating loan: ${updateError.message}`);
      }
      
      // Success - refresh data
      processCylinderCode(cylinderData.label_code);
    } catch (err: any) {
      console.error('Error marking as returned:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Cylinder QR Scanner</h1>

      {!scanResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Scan Cylinder QR Code</CardTitle>
            <CardDescription>
              Position the QR code within the scanner frame or enter the code manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isScanning ? (
              <div className="space-y-4">
                <div id="scanner-container" className="w-full aspect-square bg-muted rounded-xl overflow-hidden">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading scanner...</p>
                  </div>
                </div>
                <Button onClick={stopScanning} variant="outline" className="w-full">
                  Cancel Scanning
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-muted-foreground mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="text-muted-foreground mb-4">
                    Tap the button below to start scanning a cylinder QR code
                  </p>
                  <Button onClick={startScanning} className="rounded-xl">
                    Start Scanning
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Or enter code manually</p>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter cylinder code"
                      className="flex-1"
                    />
                    <Button type="submit" variant="outline">
                      Submit
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {isLoading ? 'Loading...' : cylinderData ? `Cylinder: ${cylinderData.label_code}` : 'Cylinder Details'}
            </CardTitle>
            <CardDescription>
              {cylinderData
                ? `Status: ${cylinderData.status} | Warehouse: ${cylinderData.warehouses?.name || 'N/A'}`
                : 'Looking up cylinder information...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-4">
                <p>{error}</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">Loading cylinder information...</div>
            ) : cylinderData ? (
              <div className="space-y-6">
                {/* Cylinder Info */}
                <div className="bg-muted rounded-xl p-4">
                  <h3 className="font-medium mb-2">Cylinder Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Status:</div>
                    <div className="font-medium">{cylinderData.status}</div>
                    <div>Warehouse:</div>
                    <div className="font-medium">{cylinderData.warehouses?.name || 'N/A'}</div>
                    <div>Last Maintenance:</div>
                    <div className="font-medium">
                      {cylinderData.last_maintenance
                        ? new Date(cylinderData.last_maintenance).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </div>
                </div>

                {/* Loan Info (if exists) */}
                {loanData && (
                  <div className="bg-primary/10 rounded-xl p-4">
                    <h3 className="font-medium mb-2">Loan Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Borrower:</div>
                      <div className="font-medium">{loanData.borrowers?.full_name || 'N/A'}</div>
                      <div>Status:</div>
                      <div className="font-medium">{loanData.status}</div>
                      <div>Expected Return:</div>
                      <div className="font-medium">
                        {loanData.expected_return_date
                          ? new Date(loanData.expected_return_date).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Section */}
                <div className="border rounded-xl p-4">
                  <h3 className="font-medium mb-4">Actions</h3>

                  {/* For cylinders with pending loan requests */}
                  {loanData && loanData.status === 'requested' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This cylinder has a pending loan request. Please approve or reject the request from the dashboard.
                      </p>
                      <Button onClick={() => router.push('/dashboard')} className="w-full">
                        Go to Dashboard
                      </Button>
                    </div>
                  )}

                  {/* For approved loans ready to be picked up */}
                  {loanData && loanData.status === 'approved' && (
                    <div className="space-y-4">
                      <p className="text-sm">Mark this cylinder as loaned out to the borrower:</p>
                      <div>
                        <Label htmlFor="loanPhoto">Upload Handover Photo</Label>
                        <Input
                          id="loanPhoto"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'loan')}
                          className="cursor-pointer mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleMarkAsLoaned}
                        disabled={!loanPhoto || isLoading}
                        className="w-full"
                      >
                        {isLoading ? 'Processing...' : 'Mark as Loaned Out'}
                      </Button>
                    </div>
                  )}

                  {/* For active loans being returned */}
                  {loanData && loanData.status === 'on_loan' && (
                    <div className="space-y-4">
                      <p className="text-sm">Mark this cylinder as returned:</p>
                      <div>
                        <Label htmlFor="returnPhoto">Upload Return Photo</Label>
                        <Input
                          id="returnPhoto"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'return')}
                          className="cursor-pointer mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleMarkAsReturned}
                        disabled={!returnPhoto || isLoading}
                        className="w-full"
                      >
                        {isLoading ? 'Processing...' : 'Mark as Returned'}
                      </Button>
                    </div>
                  )}

                  {/* For available cylinders */}
                  {(!loanData && cylinderData.status === 'available') && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This cylinder is available. Borrowers can request it through the borrow form.
                      </p>
                      <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                        Return to Home
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No cylinder found with code: {scanResult}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setScanResult(null);
              setCylinderData(null);
              setLoanData(null);
              setError(null);
            }}>
              Scan Another
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}