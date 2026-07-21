import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, IndianRupee, CheckCircle2, Users, Plus } from 'lucide-react';

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [myGigs, setMyGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gigs/client/my-gigs').then(r => setMyGigs(r.data.gigs || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeCount = myGigs.filter(g => g.status === 'open' || g.status === 'in_progress').length;
  const completedCount = myGigs.filter(g => g.status === 'completed').length;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.firstName} 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your projects</p>
          </div>
          <Button asChild><Link to="/gigs/create"><Plus className="h-4 w-4 mr-2" /> Post a Gig</Link></Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Briefcase} label="Active Gigs" value={activeCount} />
          <StatCard icon={CheckCircle2} label="Completed" value={completedCount} />
          <StatCard icon={IndianRupee} label="Total Gigs" value={myGigs.length} />
          <StatCard icon={Users} label="Proposals" value={myGigs.reduce((a, g) => a + (g.proposalCount || 0), 0)} />
        </div>

        <Card>
          <CardHeader><CardTitle>My Gigs</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : myGigs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't posted any gigs yet</p>
                <Button asChild><Link to="/gigs/create">Post Your First Gig</Link></Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myGigs.map((gig) => (
                  <Link key={gig._id} to={`/gigs/${gig._id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{gig.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{gig.category} · {gig.proposalCount || 0} proposals</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">₹{gig.budgetRange?.min?.toLocaleString()}-{gig.budgetRange?.max?.toLocaleString()}</span>
                      <Badge variant={gig.status === 'open' ? 'success' : gig.status === 'in_progress' ? 'warning' : 'secondary'} className="text-[10px]">{gig.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
