import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Users, Sparkles, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const coreTeam = [
  { name: 'Abhijit Kushwaha', role: 'Backend Coder & Integrator' },
  { name: 'Prince Kumar Verma', role: 'UI Designer & Game Developer' },
  { name: 'Dewashish Kesharwani', role: 'Backend Coder & Game Developer' },
  { name: 'Abhinav Bajpai', role: 'Researcher, Marketing & Data Management' },
];

const About = () => {
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Who We Are Section */}
        <section className="glass-card rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">About Us</h1>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-2">Who We Are</h2>
              <p className="text-muted-foreground leading-relaxed">
                Brain Buddy is an educational platform built with the vision of improving how students learn using structured guidance and technology. What started as curiosity slowly turned into a mission to create smarter, more efficient learning experiences.
              </p>
            </div>
          </div>
        </section>

        {/* Core Team Section */}
        <section className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Our Core Team</h2>
          </div>

          <div className="grid gap-4">
            {coreTeam.map((member, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold text-sm">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Journey Section */}
        <section className="glass-card rounded-2xl p-6 animate-slide-up space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-3">The Journey of Building Brain Buddy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Brain Buddy began as a simple idea at home — a vision to improve how students learn using structured guidance and technology.
            </p>
          </div>

          <div>
            <p className="text-muted-foreground leading-relaxed">
              We shared the idea with our class teacher, <span className="font-semibold text-foreground">Swati Singh</span>, who listened carefully and encouraged us to move forward.
            </p>
          </div>

          <div>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Later, we met the school leadership:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <span className="font-semibold text-foreground">Swati S. Shaligram</span> – Principal</li>
              <li>• <span className="font-semibold text-foreground">Kabir Ahmed</span> – Vice Principal</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              They understood our goals and supported us instead of dismissing us as "just students."
            </p>
          </div>

          <div>
            <p className="text-muted-foreground leading-relaxed">
              With guidance from our IT teachers, <span className="font-semibold text-foreground">Mridul Sir</span> and <span className="font-semibold text-foreground">Meenu Ma'am</span>, and access to school resources, we worked continuously — debugging, redesigning, refining — until BrainBuddy became a real educational platform.
            </p>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-muted-foreground leading-relaxed">
              Brain Buddy is built not just with code, but with belief and determination.
            </p>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <p className="font-bold text-primary text-center">
              SPECIAL THANKS TO VIDYAGYAN SCHOOL FOR SUPPORTING US.
            </p>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Development Roadmap</h2>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-background/50 border border-border/50">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="text-muted-foreground">Loading roadmap...</div>
              </div>
            )}
            <img
              src="/roadmap.png"
              alt="Brain Buddy Development Roadmap"
              onLoad={() => setImageLoading(false)}
              className={`w-full h-auto transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Our vision for the future of Brain Buddy
          </p>
        </section>

        {/* Contact Section */}
        <section className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Contact Us</h2>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground">Have questions or feedback? Reach out to us!</p>
            <a
              href="mailto:qbitworld018@gmail.com"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Mail className="h-4 w-4" />
              qbitworld018@gmail.com
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
