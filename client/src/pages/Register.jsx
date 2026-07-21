import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '@/redux/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: searchParams.get('role') || 'client',
    adminSecretKey: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const payload = { ...form };
    if (form.role !== 'admin') delete payload.adminSecretKey;
    const res = await dispatch(registerUser(payload));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Account created!');
      if (form.role === 'admin') navigate('/admin');
      else if (form.role === 'freelancer') navigate('/dashboard/freelancer');
      else navigate('/dashboard/client');
    } else toast.error(res.payload || 'Registration failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-bold">S</span></div>
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Join SkillSphere and start your journey</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role Toggle */}
          <div className="flex p-1 rounded-lg bg-muted mb-6">
            {[
              { key: 'client', label: '💼 Client' },
              { key: 'freelancer', label: '🚀 Freelancer' },
              { key: 'admin', label: '🛡️ Admin' },
            ].map((r) => (
              <button key={r.key} onClick={() => setForm({ ...form, role: r.key })}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  form.role === r.key
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
            </div>

            {/* Admin Secret Key — only visible when admin role is selected */}
            {form.role === 'admin' && (
              <div className="space-y-2 p-4 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <Label htmlFor="adminKey" className="text-amber-800 font-semibold">Admin Secret Key</Label>
                </div>
                <Input
                  id="adminKey"
                  type="password"
                  required
                  value={form.adminSecretKey}
                  onChange={(e) => setForm({ ...form, adminSecretKey: e.target.value })}
                  placeholder="Enter admin secret key"
                  className="border-amber-300 focus:ring-amber-500"
                />
                <p className="text-xs text-amber-600 mt-1">Contact the platform owner to get the admin key.</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
