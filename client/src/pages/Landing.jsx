import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Search, ShieldCheck, CreditCard, MessageCircle, Star, Globe, Users, Briefcase, CheckCircle2 } from 'lucide-react';

const categories = ['Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science', 'Content Writing', 'Digital Marketing', 'Video Editing', 'DevOps'];

const features = [
  { icon: Search, title: 'AI-Powered Matching', desc: 'Smart algorithms connect you with the ideal freelancer based on skills, ratings, and proximity.' },
  { icon: ShieldCheck, title: 'Secure Escrow Payments', desc: 'Funds are held safely until milestones are completed and approved by you.' },
  { icon: MessageCircle, title: 'Real-Time Collaboration', desc: 'Instant messaging with typing indicators, file sharing, and read receipts.' },
  { icon: Star, title: 'Verified Reviews', desc: 'Multi-dimensional ratings with fraud detection ensure genuine feedback.' },
  { icon: CreditCard, title: 'Milestone Payments', desc: 'Break projects into milestones with individual budgets and progress tracking.' },
  { icon: Globe, title: 'Hyperlocal Discovery', desc: 'Find talent in your area with location-based search and geo-filtering.' },
];

const steps = [
  { step: '01', title: 'Post Your Project', desc: 'Describe your needs, set a budget, and define milestones.' },
  { step: '02', title: 'Get Matched', desc: 'Our AI recommends top-rated freelancers near you.' },
  { step: '03', title: 'Collaborate & Pay', desc: 'Work together in real-time. Pay as milestones complete.' },
];

const stats = [
  { value: '12K+', label: 'Active Freelancers' },
  { value: '45K+', label: 'Projects Completed' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '50+', label: 'Categories' },
];

export default function Landing() {
  return (
    <div className="w-full flex flex-col pb-16">
      {/* Hero */}
      <section className="w-full flex justify-center bg-white pt-16 pb-20 md:pt-20 md:pb-24">
        <div className="w-full max-w-[1280px] px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-semibold bg-primary/10 text-primary border-none rounded-full cursor-default">
                <Star className="w-3.5 h-3.5 mr-1.5 fill-primary" /> Trusted by 12,000+ professionals
              </Badge>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] text-foreground mb-6">
                Hire the best <br />
                <span className="text-primary">freelancers</span> <br />
                in tech.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
                Streamline your workflow, reduce overhead, and enhance team satisfaction with instant access to top-tier freelance services.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-12 px-6 text-base rounded-lg font-semibold" asChild>
                  <Link to="/register">Hire now →</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 text-base rounded-lg font-semibold border-border bg-white hover:bg-muted/50" asChild>
                  <Link to="/gigs">Browse gigs</Link>
                </Button>
              </div>
            </div>

            {/* Right side — staggered cards */}
            <div className="relative h-[440px] hidden lg:block">
              <div className="absolute inset-0 bg-primary/5 rounded-[32px]"></div>

              <div className="absolute top-10 right-8 bg-white shadow-md border border-border/40 rounded-2xl flex items-center gap-3 px-5 py-4 w-[220px]">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-bold">VN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Valeria Novikova</p>
                  <p className="text-xs font-semibold text-primary mt-1">UI/UX designer</p>
                </div>
              </div>

              <div className="absolute top-[190px] left-8 bg-white shadow-md border border-border/40 rounded-2xl flex items-center gap-3 px-5 py-4 w-[220px]">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">AP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Alex Podzemsky</p>
                  <p className="text-xs font-semibold text-blue-600 mt-1">Frontend dev</p>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 bg-white shadow-md border border-border/40 rounded-2xl flex items-center gap-3 px-5 py-4">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground leading-none">50<span className="text-primary">+</span></p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Professional niches</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="w-full flex justify-center bg-white border-y border-border/60">
        <div className="w-full max-w-[1280px] px-6 lg:px-8 py-16 md:py-20">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.label} className={`text-center px-4 ${i !== 0 ? 'md:border-l md:border-border/60' : ''}`}>
                  <p className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">{s.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="w-full flex justify-center py-16 md:py-24 bg-muted/30 border-y border-border/50">
          <div className="w-full max-w-[1280px] px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Popular Categories</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Explore talent across our most in-demand professional skills.</p>
          </div>
            <div className="flex flex-wrap justify-center gap-2.5">
            {categories.map((cat) => (
                <Button key={cat} variant="outline" className="rounded-full px-5 h-10 text-sm font-medium hover:shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-all bg-white" asChild>
                  <Link to={`/gigs?category=${cat}`}>{cat}</Link>
                </Button>
            ))}
          </div>
        </div>
      </section>
 
      {/* How It Works */}
      <section className="w-full flex justify-center py-16 md:py-24 bg-white border-y border-border/50" id="how-it-works">
        <div className="w-full max-w-[1280px] px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Get your project done in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-9 left-[20%] right-[20%] h-px bg-border"></div>

            {steps.map((item) => (
              <div key={item.step} className="text-center relative z-10">
                <div className="mx-auto flex items-center justify-center h-[72px] w-[72px] rounded-2xl bg-white border border-primary/15 shadow-sm text-primary text-xl font-black mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full flex justify-center py-16 md:py-24 bg-muted/30">
        <div className="w-full max-w-[1280px] px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Why Choose <span className="text-primary">SkillSphere</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Enterprise-grade tools built for modern remote collaboration.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border border-border/50 shadow-none rounded-2xl bg-white">
                <CardContent className="p-7">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full flex justify-center py-16 md:py-24 bg-white">
        <div className="w-full max-w-[1280px] px-6 lg:px-8">
          <Card className="border-0 bg-primary/5 shadow-none rounded-[2rem]">
            <CardContent className="p-12 sm:p-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Ready to get started?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">Join thousands of freelancers and clients already building amazing things on SkillSphere.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button size="lg" className="h-12 px-8 text-base rounded-lg font-semibold" asChild>
                  <Link to="/register?role=freelancer">Join as Freelancer</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-lg font-semibold bg-white border-border hover:bg-muted/50" asChild>
                  <Link to="/register?role=client">Hire Talent</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
