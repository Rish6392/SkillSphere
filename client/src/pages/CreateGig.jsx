import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createGig } from '@/redux/slices/gigSlice';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export default function CreateGig() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', skills: '', budgetType: 'fixed', budgetMin: '', budgetMax: '', estimatedDuration: '', deadline: '', isRemote: true, city: '', state: '' });
  const [milestones, setMilestones] = useState([{ title: '', amount: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const gigData = {
      title: form.title, description: form.description, category: form.category,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      budgetType: form.budgetType,
      budgetRange: { min: Number(form.budgetMin), max: Number(form.budgetMax) },
      estimatedDuration: form.estimatedDuration, deadline: form.deadline || undefined,
      isRemote: form.isRemote,
      location: !form.isRemote ? { city: form.city, state: form.state } : undefined,
      milestones: milestones.filter(m => m.title && m.amount).map(m => ({ ...m, amount: Number(m.amount) })),
    };
    const res = await dispatch(createGig(gigData));
    if (res.meta.requestStatus === 'fulfilled') { toast.success('Gig posted!'); navigate('/dashboard/client'); }
    else toast.error(res.payload || 'Failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Post a New Gig</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input required placeholder="e.g. Build a React Dashboard" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea rows={5} required placeholder="Describe your project in detail..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select</option>
                    {['Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science', 'Content Writing', 'Digital Marketing', 'Video Editing', 'DevOps'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Skills (comma separated)</Label><Input placeholder="React, Node.js, MongoDB" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Budget & Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {['fixed', 'hourly'].map((t) => (
                  <Button key={t} type="button" variant={form.budgetType === t ? 'default' : 'outline'} className="flex-1 capitalize" onClick={() => setForm({ ...form, budgetType: t })}>{t}</Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Min Budget (₹)</Label><Input type="number" required placeholder="10000" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} /></div>
                <div className="space-y-2"><Label>Max Budget (₹)</Label><Input type="number" required placeholder="50000" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Duration</Label><Input placeholder="e.g. 2 weeks" value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} /></div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Milestones</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMilestones([...milestones, { title: '', amount: '' }])}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.map((ms, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1"><Label className="text-xs">Title</Label><Input placeholder="Milestone title" value={ms.title} onChange={(e) => { const u=[...milestones]; u[i].title=e.target.value; setMilestones(u); }} /></div>
                  <div className="w-32 space-y-1"><Label className="text-xs">Amount (₹)</Label><Input type="number" placeholder="5000" value={ms.amount} onChange={(e) => { const u=[...milestones]; u[i].amount=e.target.value; setMilestones(u); }} /></div>
                  {milestones.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setMilestones(milestones.filter((_,idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Posting...' : 'Post Gig'}</Button>
        </form>
      </div>
    </div>
  );
}
