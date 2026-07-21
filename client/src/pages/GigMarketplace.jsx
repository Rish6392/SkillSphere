import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGigs } from '@/redux/slices/gigSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Clock, IndianRupee, Filter } from 'lucide-react';

function GigCard({ gig }) {
  return (
    <Link to={`/gigs/${gig._id}`}>
      <Card className="group h-full rounded-2xl border-border/60 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Badge variant={gig.budgetType === 'fixed' ? 'success' : 'secondary'} className="px-2.5 py-0.5">{gig.budgetType}</Badge>
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">{new Date(gig.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{gig.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{gig.description}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {gig.skills?.slice(0, 4).map((s) => (
              <Badge key={s} variant="outline" className="text-[11px] font-medium bg-muted/20">{s}</Badge>
            ))}
            {gig.skills?.length > 4 && <Badge variant="outline" className="text-[11px] font-medium bg-muted/20">+{gig.skills.length - 4}</Badge>}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <span className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <IndianRupee className="h-4 w-4 text-primary" />
              {gig.budgetRange?.min?.toLocaleString()} - {gig.budgetRange?.max?.toLocaleString()}
            </span>
            <div className="flex items-center gap-3.5 text-xs font-medium text-muted-foreground">
              {gig.location?.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{gig.location.city}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{gig.proposalCount || 0} bids</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function GigMarketplace() {
  const dispatch = useDispatch();
  const { gigs, total, totalPages, currentPage, loading } = useSelector((s) => s.gigs);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', budgetType: '', page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { dispatch(fetchGigs({ ...filters, search: search || undefined })); }, [dispatch, filters]);

  const handleSearch = (e) => { e.preventDefault(); dispatch(fetchGigs({ ...filters, search, page: 1 })); };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Gig Marketplace</h1>
          <p className="text-lg text-muted-foreground mt-2">Browse {total || 0} open projects and find your next opportunity</p>
        </div>

        {/* Search */}
        <Card className="mb-10 border-border/60 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-2 sm:p-3">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative flex items-center">
                <Search size={20} className="absolute left-5 text-muted-foreground" />
                <Input className="pl-14 h-14 sm:h-16 text-base rounded-xl bg-transparent border-none focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/70" placeholder="Search for projects, skills, or keywords..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 p-2 sm:p-0">
                <Button type="button" variant={showFilters ? "secondary" : "ghost"} size="icon" className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl shrink-0 transition-colors" onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={22} className={showFilters ? "text-foreground" : "text-muted-foreground"} />
                </Button>
                <Button type="submit" size="lg" className="h-14 sm:h-16 px-8 rounded-xl shadow-md hover:shadow-lg transition-all flex-1 sm:flex-none text-base font-semibold">Search Gigs</Button>
              </div>
            </form>

            {showFilters && (
              <div className="p-5 mt-2 border-t flex flex-wrap gap-5 bg-muted/30 rounded-xl mx-2 mb-2">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                  <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                    className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all">
                    <option value="">All Categories</option>
                    {['Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science', 'Content Writing', 'Digital Marketing'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Budget Type</label>
                  <select value={filters.budgetType} onChange={(e) => setFilters({ ...filters, budgetType: e.target.value, page: 1 })}
                    className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all">
                    <option value="">All Budget Types</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" className="h-12 px-6 rounded-xl font-medium" onClick={() => { setFilters({ category: '', budgetType: '', page: 1 }); setSearch(''); }}>Clear Filters</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}><CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2"><Skeleton className="h-5 w-14" /><Skeleton className="h-5 w-18" /></div>
                <Skeleton className="h-4 w-1/2" />
              </CardContent></Card>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No gigs found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{gigs.map((g) => <GigCard key={g._id} gig={g} />)}</div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-10">
                {[...Array(totalPages)].map((_, i) => (
                  <Button key={i} variant={currentPage === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setFilters({ ...filters, page: i + 1 })}>
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
