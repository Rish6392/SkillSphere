import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, Briefcase, Star, Eye, BarChart3, CheckCircle2 } from 'lucide-react';

export default function FreelancerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/freelancers/me/profile').catch(() => ({ data: {} })),
      api.get('/proposals/my-proposals?limit=5').catch(() => ({ data: {} })),
    ]).then(([p, pr]) => { setProfile(p.data.profile); setProposals(pr.data.proposals || []); }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: IndianRupee, label: 'Total Earnings', value: `₹${(profile?.totalEarnings || 0).toLocaleString()}` },
    { icon: Briefcase, label: 'Completed Jobs', value: profile?.completedJobs || 0 },
    { icon: Star, label: 'Reputation', value: `${(profile?.reputationScore || 0).toFixed(1)}/5` },
    { icon: Eye, label: 'Profile Views', value: profile?.profileViews || 0 },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName} 🚀</h1>
            <p className="text-muted-foreground text-sm mt-1">Your freelancer dashboard</p>
          </div>
          <Button asChild><Link to="/gigs"><BarChart3 className="h-4 w-4 mr-2" /> Browse Gigs</Link></Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold mt-0.5">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Proposals</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/proposals">View All</Link></Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              : proposals.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">No proposals yet. Start bidding!</p>
              : <div className="space-y-2">{proposals.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.gigId?.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">₹{p.bidAmount?.toLocaleString()} · {p.estimatedDuration}</p>
                  </div>
                  <Badge variant={p.status === 'accepted' ? 'success' : p.status === 'pending' ? 'warning' : 'destructive'} className="text-[10px]">{p.status}</Badge>
                </div>
              ))}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Profile Completeness</CardTitle></CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-3">
                  {[
                    { done: !!profile.headline, label: 'Headline' },
                    { done: profile.skills?.length > 0, label: 'Skills' },
                    { done: profile.portfolio?.length > 0, label: 'Portfolio' },
                    { done: !!profile.resume?.url, label: 'Resume' },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-3 p-3 rounded-lg border ${item.done ? 'border-green-200 bg-green-50' : 'bg-muted/50'}`}>
                      <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-8 text-sm">Complete your profile to get more clients</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
