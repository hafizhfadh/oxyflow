'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';

export default function ReturnPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loanId, setLoanId] = useState('');
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
  const [step, setStep] = useState<'lookup' | 'upload'>('lookup');

  const handleLookupLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!loanId) {
        throw new Error('Please enter a loan ID');
      }

      const supabase = createClient();

      // Look up the loan by ID
      const { data, error: lookupError } = await supabase
        .from('loans')
        .select(`
          id,
          status,
          loan_date,
          expected_return_date,
          borrowers(full_name),
          cylinders(label_code),
          warehouses(name, address)
        `)
        .eq('id', loanId)
        .single();

      if (lookupError) {
        throw new Error(`Error looking up loan: ${lookupError.message}`);
      }

      if (!data) {
        throw new Error('Loan not found. Please check the ID and try again.');
      }

      // Check if the loan is in a valid state for return
      if (data.status !== 'on_loan' && data.status !== 'approved') {
        throw new Error(`This loan cannot be returned because its status is ${data.status}.`);
      }

      setLoanDetails(data);
      setStep('upload');
    } catch (err: any) {
      setError(err.message);
      console.error('Error looking up loan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReturnPhoto(e.target.files[0]);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!returnPhoto) {
        throw new Error('Please upload a return photo');
      }

      const supabase = createClient();

      // 1. Upload return photo to Supabase storage
      const returnPhotoName = `return-${loanId}-${Date.now()}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('oxy_evidence')
        .upload(returnPhotoName, returnPhoto);

      if (uploadError) {
        throw new Error(`Error uploading return photo: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage.from('oxy_evidence').getPublicUrl(returnPhotoName);
      const returnPhotoUrl = urlData.publicUrl;

      // 2. Update loan status to return_requested
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          status: 'return_requested',
          return_photo_url: returnPhotoUrl,
        })
        .eq('id', loanId);

      if (updateError) {
        throw new Error(`Error updating loan status: ${updateError.message}`);
      }

      // Success!
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 5000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting return:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Return an Oxygen Cylinder</h1>

      {success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-2xl text-center">
          <h2 className="text-2xl font-semibold mb-2">Return Request Submitted!</h2>
          <p className="mb-4">
            Your return request has been received. Please return the cylinder to the warehouse as soon as possible.
          </p>
          <Button onClick={() => router.push('/')} className="mt-2">
            Return to Home
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          {step === 'lookup' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Enter Your Loan ID</h2>
                <p className="text-muted-foreground text-sm">
                  Please enter the loan ID that was provided to you when you borrowed the cylinder.
                </p>
              </div>

              <form onSubmit={handleLookupLoan} className="space-y-6">
                <div>
                  <Label htmlFor="loanId">Loan ID</Label>
                  <Input
                    id="loanId"
                    value={loanId}
                    onChange={(e) => setLoanId(e.target.value)}
                    placeholder="Enter your loan ID"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
                    <p>{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Looking up...' : 'Look Up Loan'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Loan Details</h2>
                <div className="bg-muted p-4 rounded-xl space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Borrower:</span> {loanDetails?.borrowers?.full_name}
                  </p>
                  <p>
                    <span className="font-medium">Cylinder:</span> {loanDetails?.cylinders?.label_code}
                  </p>
                  <p>
                    <span className="font-medium">Warehouse:</span> {loanDetails?.warehouses?.name}
                  </p>
                  <p>
                    <span className="font-medium">Expected Return:</span>{' '}
                    {new Date(loanDetails?.expected_return_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-6">
                <div>
                  <Label htmlFor="returnPhoto">Upload Return Photo</Label>
                  <Input
                    id="returnPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Please upload a clear photo of the cylinder being returned for verification purposes.
                  </p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('lookup')}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading || !returnPhoto}>
                    {isLoading ? 'Submitting...' : 'Submit Return'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}