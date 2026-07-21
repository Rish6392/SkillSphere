import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Mail, Briefcase, Star, Clock, CheckCircle2, X, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '@/redux/slices/authSlice'; // Re-using to update user state if needed

export default function ProfilePage() {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ headline: '', bio: '', skills: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'freelancer') {
      api.get('/freelancers/me/profile')
        .then((r) => {
          setProfile(r.data.profile);
          setForm({
            headline: r.data.profile?.headline || '',
            bio: r.data.profile?.bio || '',
            skills: r.data.profile?.skills?.map(s => s.name || s).join(', ') || '',
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // Clients don't have a separate extended profile yet
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Optionally update local user state here if redux handles it, or just show success
      toast.success('Avatar updated successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to update avatar');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const skillsArray = form.skills.split(',').map(s => ({ name: s.trim() })).filter(s => s.name);
      const { data } = await api.put('/freelancers/me/profile', {
        headline: form.headline,
        bio: form.bio,
        skills: skillsArray,
      });
      setProfile(data.profile);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-primary/10"></div>
          <CardContent className="relative px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                  <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 bg-white border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="h-4 w-4" /> {user?.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{user?.role}</Badge>
                </div>
              </div>
            </div>

            {user?.role === 'freelancer' && profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Earnings</span>
                  <span className="font-bold flex items-center"><IndianRupee className="h-4 w-4 mr-1"/>{(profile.totalEarnings || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Jobs</span>
                  <span className="font-bold flex items-center"><Briefcase className="h-4 w-4 mr-1"/>{profile.completedJobs || 0}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Rating</span>
                  <span className="font-bold flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-500 fill-current"/>{(profile.reputationScore || 0).toFixed(1)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Verification</span>
                  <span className="font-bold flex items-center">
                    {profile.isVerified ? <><CheckCircle2 className="h-4 w-4 mr-1 text-green-500"/> Verified</> : <><Clock className="h-4 w-4 mr-1 text-orange-500"/> Pending</>}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Card (Freelancer Only) */}
        {user?.role === 'freelancer' && (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>Professional Profile</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Senior Full Stack Developer" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell clients about your experience..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Skills (comma separated)</Label>
                    <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, UI/UX" />
                  </div>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Headline</h3>
                    <p className="text-foreground">{profile?.headline || 'No headline provided.'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">About</h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{profile?.bio || 'No bio provided.'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills?.length > 0 ? profile.skills.map((s, index) => (
                        <Badge key={s._id || s.name || s || index} variant="secondary">{s.name || s}</Badge>
                      )) : <p className="text-sm text-muted-foreground">No skills added yet.</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
