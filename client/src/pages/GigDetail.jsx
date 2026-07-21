import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGigById } from '@/redux/slices/gigSlice';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, IndianRupee, Calendar, Send, CheckCircle2, XCircle, MessageSquare, Star } from 'lucide-react';

export default function GigDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentGig: gig, loading } = useSelector((s) => s.gigs);
  const { user } = useSelector((s) => s.auth);

  // Freelancer proposal form
  const [proposalForm, setProposalForm] = useState({ coverLetter: '', bidAmount: '', estimatedDuration: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Client proposals list
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  useEffect(() => { dispatch(fetchGigById(id)); }, [dispatch, id]);

  // Fetch proposals if user is the client who owns this gig
  useEffect(() => {
    if (user?.role === 'client' && gig && gig.clientId?._id === user._id) {
      setLoadingProposals(true);
      api.get(`/proposals/gig/${id}`)
        .then((r) => setProposals(r.data.proposals || []))
        .catch(() => {})
        .finally(() => setLoadingProposals(false));
    }
  }, [user, gig, id]);

  const handleProposal = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/proposals', { gigId: id, ...proposalForm, bidAmount: Number(proposalForm.bidAmount) });
      toast.success('Proposal submitted!'); setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  const handleProposalAction = async (proposalId, action) => {
    try {
      await api.put(`/proposals/${proposalId}/${action}`);
      setProposals(proposals.map((p) =>
        p._id === proposalId ? { ...p, status: action === 'accept' ? 'accepted' : 'rejected' } : p
      ));
      toast.success(`Proposal ${action}ed!`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} proposal`);
    }
  };

  if (loading || !gig) return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-32 w-full" /></div>
      <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-24 w-full" /></div>
    </div>
  );

  const isOwner = user?.role === 'client' && gig.clientId?._id === user?._id;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gig Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={gig.status === 'open' ? 'success' : 'secondary'}>{gig.status?.toUpperCase()}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(gig.createdAt).toLocaleDateString()}</span>
                </div>
                <h1 className="text-2xl font-bold mb-3">{gig.title}</h1>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{gig.description}</p>

                {gig.skills?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {gig.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {gig.milestones?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-3">Milestones</h3>
                    <div className="space-y-2">
                      {gig.milestones.map((ms, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                          <div>
                            <p className="text-sm font-medium">{ms.title}</p>
                            {ms.description && <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-primary">₹{ms.amount?.toLocaleString()}</span>
                            <Badge variant={ms.status === 'paid' ? 'success' : 'secondary'} className="ml-2 text-[10px]">{ms.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ===== CLIENT: Proposals Section ===== */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Proposals Received ({proposals.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProposals ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                    </div>
                  ) : proposals.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No proposals yet. Share your gig to attract freelancers!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div key={proposal._id} className="border rounded-xl p-5 hover:shadow-sm transition-shadow">
                          {/* Freelancer Info */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={proposal.freelancerId?.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                  {proposal.freelancerId?.firstName?.[0]}{proposal.freelancerId?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{proposal.freelancerId?.firstName} {proposal.freelancerId?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{proposal.freelancerId?.email}</p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                proposal.status === 'accepted' ? 'success'
                                : proposal.status === 'rejected' ? 'destructive'
                                : 'warning'
                              }
                              className="text-[10px]"
                            >
                              {proposal.status?.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Bid Details */}
                          <div className="flex items-center gap-6 mb-3">
                            <div className="flex items-center gap-1.5">
                              <IndianRupee className="h-4 w-4 text-primary" />
                              <span className="text-base font-bold">₹{proposal.bidAmount?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm">{proposal.estimatedDuration || 'Not specified'}</span>
                            </div>
                            {proposal.freelancerId?.reputationScore > 0 && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                <span className="text-sm font-medium">{proposal.freelancerId.reputationScore?.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          {/* Cover Letter */}
                          <div className="bg-muted/40 rounded-lg p-4 mb-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cover Letter</p>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{proposal.coverLetter}</p>
                          </div>

                          {/* Action Buttons — only show if pending */}
                          {proposal.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => handleProposalAction(proposal._id, 'accept')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleProposalAction(proposal._id, 'reject')}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                              <Button variant="ghost" size="sm" asChild className="ml-auto">
                                <Link to={`/chat?userId=${proposal.freelancerId?._id}&name=${encodeURIComponent(proposal.freelancerId?.firstName + ' ' + proposal.freelancerId?.lastName)}&gigId=${gig._id}`}>
                                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message
                                </Link>
                              </Button>
                            </div>
                          )}

                          {proposal.status === 'accepted' && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <p className="text-sm text-green-700 font-medium">Proposal accepted — you can now start working with this freelancer!</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ===== FREELANCER: Proposal Form ===== */}
            {user?.role === 'freelancer' && gig.status === 'open' && (
              <Card>
                <CardContent className="p-6">
                  {!showForm ? (
                    <Button className="w-full" size="lg" onClick={() => setShowForm(true)}>
                      <Send className="mr-2 h-4 w-4" /> Submit Proposal
                    </Button>
                  ) : (
                    <form onSubmit={handleProposal} className="space-y-4">
                      <h3 className="text-lg font-semibold">Submit Your Proposal</h3>
                      <div className="space-y-2">
                        <Label>Cover Letter</Label>
                        <Textarea rows={5} required placeholder="Why are you the best fit?" value={proposalForm.coverLetter} onChange={(e) => setProposalForm({ ...proposalForm, coverLetter: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Bid Amount (₹)</Label>
                          <Input type="number" required placeholder="50000" value={proposalForm.bidAmount} onChange={(e) => setProposalForm({ ...proposalForm, bidAmount: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Est. Duration</Label>
                          <Input required placeholder="e.g. 2 weeks" value={proposalForm.estimatedDuration} onChange={(e) => setProposalForm({ ...proposalForm, estimatedDuration: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Submitting...' : 'Submit Proposal'}</Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                {[
                  { icon: IndianRupee, label: 'Budget', value: `₹${gig.budgetRange?.min?.toLocaleString()} - ₹${gig.budgetRange?.max?.toLocaleString()}` },
                  { icon: Clock, label: 'Duration', value: gig.estimatedDuration || 'Not specified' },
                  { icon: Calendar, label: 'Deadline', value: gig.deadline ? new Date(gig.deadline).toLocaleDateString() : 'Flexible' },
                  { icon: MapPin, label: 'Location', value: gig.isRemote ? '🌐 Remote' : gig.location?.city || 'Not specified' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
                <Separator />
                <p className="text-xs text-muted-foreground">{gig.proposalCount || 0} proposals submitted</p>
              </CardContent>
            </Card>

            {gig.clientId && (
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">About the Client</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={gig.clientId.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{gig.clientId.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{gig.clientId.firstName} {gig.clientId.lastName}</p>
                      <p className="text-xs text-muted-foreground">{gig.clientId.location?.city || ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
