import { Wifi, Heart, TrendingUp, Users, MapPin, Briefcase, Clock, Mail, ArrowRight } from "lucide-react";
import { PageHero, SectionHeader, slimPanel } from "@/components/ui/section-primitives";
import PageSeo from "@/components/PageSeo";

const benefits = [
  { icon: Wifi, title: "Remote-first", description: "Work from anywhere in India. Great work happens when you're comfortable." },
  { icon: Heart, title: "Meaningful work", description: "Help millions connect with their spiritual roots through technology and tradition." },
  { icon: TrendingUp, title: "Growth", description: "Accelerate your career with mentorship, learning budgets and challenging projects." },
  { icon: Users, title: "Community", description: "Join a passionate team that celebrates diversity, curiosity and shared purpose." },
];

const positions = [
  { id: "full-stack-developer", title: "Full Stack Developer", department: "Tech Team", location: "Remote", type: "Full-time" },
  { id: "content-writer", title: "Content Writer — Sanskrit/Hindi", department: "Content Team", location: "Delhi / Remote", type: "Full-time" },
  { id: "pandit-coordinator", title: "Pandit Coordinator", department: "Operations", location: "Delhi", type: "Full-time" },
  { id: "digital-marketing-executive", title: "Digital Marketing Executive", department: "Marketing", location: "Remote", type: "Full-time" },
  { id: "customer-support-specialist", title: "Customer Support Specialist", department: "Support", location: "Delhi", type: "Full-time" },
];

const primaryBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] transition-colors";
const outlineBtn = "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-[12px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/30 hover:bg-[#FBF7EE] transition-colors";

export default function Careers() {
  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Careers at Vedic Tatva | Join Our Mission"
        description="Join Vedic Tatva — work at the intersection of tradition and technology. Open roles in engineering, content, operations, marketing and support across India."
      />
      <PageHero
        eyebrow="Careers"
        title="Join our mission"
        subtitle="Work at the intersection of tradition and technology. Help us bring the timeless wisdom of Vedic culture to the modern world."
        variant="maroon"
        testId="hero-careers"
      />

      <div className="container mx-auto px-4 mt-10">
        <div className="max-w-5xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Why Join Us"
            title="Build something meaningful"
            subtitle="A team that cares about the work, the craft and each other."
          />
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className={`${slimPanel} p-5 text-center`}
                data-testid={`card-benefit-${i}`}
              >
                <div className="w-10 h-10 mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] mb-3">
                  <benefit.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{benefit.title}</h3>
                <p className="text-[12px] text-[#5a4a3a]/70 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Open Positions"
            title="Find your role"
            subtitle="We're hiring across engineering, content, operations, marketing and support."
          />
          <div className="mt-7 flex flex-col gap-2">
            {positions.map((position) => (
              <div
                key={position.id}
                className={`${slimPanel} p-4 sm:p-5`}
                data-testid={`card-position-${position.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5" data-testid={`text-position-title-${position.id}`}>
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5a4a3a]/65 uppercase tracking-wider font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.8} />
                        {position.department}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.8} />
                        {position.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.8} />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:careers@vedictatva.com?subject=Application for ${encodeURIComponent(position.title)}`}
                    className={`${outlineBtn} shrink-0`}
                    data-testid={`btn-apply-${position.id}`}
                  >
                    Apply now <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${slimPanel} p-6 sm:p-8 max-w-4xl mx-auto text-center bg-[#FBF7EE] mb-10`}>
          <SectionHeader
            eyebrow="Our Culture"
            title="Tradition + innovation"
          />
          <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed mt-4 max-w-2xl mx-auto" data-testid="text-culture-description">
            At Vedic Tatva we blend ancient wisdom with modern innovation. Our team is driven by respect for tradition, a passion for technology and a shared commitment to making spiritual practices accessible to everyone. We value open communication, continuous learning and the belief that every team member's contribution matters.
          </p>
        </div>

        <div className="relative bg-[#6D2B35] rounded-lg border border-[#D4AF37]/40 max-w-3xl mx-auto text-white overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="p-6 sm:p-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-md bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
              <Mail className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Open Application</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold mb-2">Don't see your role?</h2>
            <p className="text-white/70 text-[13px] mb-5 max-w-md mx-auto">
              We're always looking for talented people. Send your resume and we'll keep you in mind for future openings.
            </p>
            <a
              href="mailto:careers@vedictatva.com?subject=General Application - Vedic Tatva"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-md bg-[#D4AF37] hover:bg-[#c19c2e] text-[#3a1a20] font-semibold text-[13px] border border-[#D4AF37] transition-colors"
              data-testid="btn-send-resume"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.8} /> careers@vedictatva.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
