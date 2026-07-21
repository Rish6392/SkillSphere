import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message || 'Reset link sent!');
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-bold">S</span></div>
          </Link>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
             <div className="text-center space-y-4">
               <div className="p-4 bg-green-50 text-green-700 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                 We've sent a password reset link to your email. Please check your inbox.
               </div>
               <Link to="/login" className="text-primary font-medium hover:underline block mt-4">Return to login</Link>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </Button>
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-primary font-medium hover:underline">Back to login</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
