import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Users, Briefcase, IndianRupee, AlertTriangle, ShieldCheck, Ban, CheckCircle2, XCircle, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').catch(() => ({ data: {} })),
      api.get('/admin/users?limit=20').catch(() => ({ data: {} })),
      api.get('/gigs?limit=20').catch(() => ({ data: {} })),
      api.get('/admin/disputes?limit=20').catch(() => ({ data: {} })),
    ]).then(([d, u, g, di]) => {
      setDashboard(d.data.dashboard);
      setUsers(u.data.users || []);
      setGigs(g.data.gigs || []);
      setDisputes(di.data.disputes || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSuspend = async (userId, action) => {
    try {
      await api.put(`/admin/users/${userId}/suspend`, {
        action,
        reason: action === 'suspend' ? 'Admin action' : undefined,
      });
      setUsers(users.map((u) => u._id === userId ? { ...u, isSuspended: action === 'suspend' } : u));
      toast.success(`User ${action === 'suspend' ? 'suspended' : 'activated'}`);
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const handleVerify = async (userId) => {
    try {
      await api.put(`/admin/freelancers/${userId}/verify`, { action: 'verify' });
      toast.success('Freelancer verified');
    } catch (e) {
      toast.error('Verification failed');
    }
  };

  const handleGigAction = async (gigId, action) => {
    try {
      await api.put(`/admin/gigs/${gigId}/approve`, { action });
      setGigs(gigs.map((g) =>
        g._id === gigId
          ? { ...g, isApprovedByAdmin: action === 'approve', status: action === 'reject' ? 'closed' : g.status }
          : g
      ));
      toast.success(`Gig ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (e) {
      toast.error(`Failed to ${action} gig`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform management & analytics</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="gigs">Gigs</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* ===== Overview Tab ===== */}
          <TabsContent value="overview">
            {dashboard && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {[
                    { icon: Users, label: 'Total Users', value: dashboard.users?.total || 0, sub: `${dashboard.users?.recentSignups || 0} new (30d)` },
                    { icon: Briefcase, label: 'Active Gigs', value: dashboard.gigs?.active || 0, sub: `${dashboard.gigs?.completed || 0} completed` },
                    { icon: IndianRupee, label: 'Platform Revenue', value: `₹${(dashboard.revenue?.platformFees || 0).toLocaleString()}`, sub: `₹${(dashboard.revenue?.totalVolume || 0).toLocaleString()} volume` },
                    { icon: AlertTriangle, label: 'Open Disputes', value: dashboard.disputes?.open || 0, sub: `${dashboard.successRate || 0}% success` },
                  ].map((stat) => (
                    <Card key={stat.label}>
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <stat.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                          <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle>Top Categories</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboard.topCategories?.map((cat, i) => (
                          <div key={cat._id} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{cat._id}</span>
                                <span className="text-xs text-muted-foreground">{cat.count} gigs</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(cat.count / (dashboard.topCategories[0]?.count || 1)) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {!dashboard.topCategories?.length && <p className="text-sm text-muted-foreground text-center py-4">No data available</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>User Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {[
                          { label: 'Freelancers', value: dashboard.users?.freelancers || 0, color: 'bg-blue-500' },
                          { label: 'Clients', value: dashboard.users?.clients || 0, color: 'bg-green-500' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm flex-1">{item.label}</span>
                            <span className="text-lg font-bold">{item.value}</span>
                            <span className="text-xs text-muted-foreground w-14 text-right">
                              {dashboard.users?.total > 0 ? Math.round((item.value / dashboard.users.total) * 100) : 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===== Users Tab ===== */}
          <TabsContent value="users">
            <Card className="mt-6">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                        <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{u.firstName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><Badge variant="secondary" className="capitalize text-[10px]">{u.role}</Badge></td>
                          <td className="px-6 py-4">
                            <Badge variant={u.isSuspended ? 'destructive' : 'success'} className="text-[10px]">
                              {u.isSuspended ? 'Suspended' : 'Active'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {u.role === 'freelancer' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleVerify(u._id)} title="Verify Freelancer">
                                  <ShieldCheck className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => handleSuspend(u._id, u.isSuspended ? 'activate' : 'suspend')}
                                title={u.isSuspended ? 'Activate' : 'Suspend'}>
                                {u.isSuspended ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Ban className="h-4 w-4 text-destructive" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Gigs Tab (Approve / Reject) ===== */}
          <TabsContent value="gigs">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Gig Moderation</CardTitle>
                <p className="text-sm text-muted-foreground">Review, approve, or reject gigs posted by clients</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Gig</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gigs.map((gig) => (
                        <tr key={gig._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium max-w-xs truncate">{gig.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(gig.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                  {gig.clientId?.firstName?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{gig.clientId?.firstName || 'Unknown'} {gig.clientId?.lastName || ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="text-[10px]">{gig.category || 'N/A'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            ₹{gig.budgetRange?.min?.toLocaleString()} – ₹{gig.budgetRange?.max?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {gig.isApprovedByAdmin === true ? (
                              <Badge variant="success" className="text-[10px]">Approved</Badge>
                            ) : gig.status === 'closed' ? (
                              <Badge variant="destructive" className="text-[10px]">Rejected</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">Pending Review</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Approve */}
                              {!gig.isApprovedByAdmin && gig.status !== 'closed' && (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleGigAction(gig._id, 'approve')}
                                  title="Approve Gig"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                </Button>
                              )}
                              {/* Reject */}
                              {gig.status !== 'closed' && (
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleGigAction(gig._id, 'reject')}
                                  title="Reject Gig"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </Button>
                              )}
                              {gig.isApprovedByAdmin && (
                                <span className="text-xs text-green-600 font-medium px-2">✓ Approved</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {gigs.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">No gigs to moderate</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Disputes Tab ===== */}
          <TabsContent value="disputes">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Dispute Management</CardTitle>
                <p className="text-sm text-muted-foreground">Review disputes raised between clients and freelancers</p>
              </CardHeader>
              <CardContent>
                {disputes.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No disputes found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disputes.map((d) => (
                      <div key={d._id} className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={d.status === 'open' ? 'warning' : d.status === 'resolved' ? 'success' : 'secondary'} className="text-[10px]">
                              {d.status?.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-medium">{d.reason || 'No reason provided'}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Raised by: <strong className="text-foreground">{d.raisedBy?.firstName} {d.raisedBy?.lastName}</strong></span>
                            <span>Against: <strong className="text-foreground">{d.against?.firstName} {d.against?.lastName}</strong></span>
                            {d.gigId && <span>Gig: <strong className="text-foreground">{d.gigId.title}</strong></span>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 ml-4">
                          <Eye className="h-3.5 w-3.5 mr-1" /> Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
