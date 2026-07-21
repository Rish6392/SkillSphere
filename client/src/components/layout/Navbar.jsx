import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/redux/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, User, Settings, LogOut, Bell, MessageSquare, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { dispatch(logoutUser()); navigate('/login'); };
  const dashLink = user?.role === 'admin' ? '/admin' : user?.role === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client';

  const navLinks = [
    { label: 'Find Work', href: '/gigs' },
    { label: 'Find Talent', href: '/freelancers' },
    { label: 'How It Works', href: '/#how-it-works' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white transition-all duration-300 flex justify-center border-b border-border/50">
      <div className="w-full max-w-7xl flex h-20 items-center justify-between px-8 md:px-16 lg:px-24">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Skill <span className="text-primary/80 font-semibold">Sphere</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/gigs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Find work</Link>
          <Link to="/freelancers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Find talent</Link>
          <Link to="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link to="/chat"><MessageSquare className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Bell className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium">{user?.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashLink)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-6">
              <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Log in</Link>
              <Button className="rounded-lg px-6 font-semibold" asChild><Link to="/register">Sign up</Link></Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
