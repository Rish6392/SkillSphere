import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-bold">Skill<span className="text-primary">Sphere</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connecting clients with top freelance talent. Secure payments, real-time collaboration.
            </p>
          </div>
          {[
            { title: 'Platform', links: [['Find Work', '/gigs'], ['Find Talent', '/freelancers'], ['Become a Freelancer', '/register?role=freelancer']] },
            { title: 'Company', links: [['About Us', '#'], ['Contact', '#'], ['Privacy Policy', '#']] },
            { title: 'Support', links: [['Help Center', '#'], ['Disputes', '#'], ['Trust & Safety', '#']] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} SkillSphere. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
