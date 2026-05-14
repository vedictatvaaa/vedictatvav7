import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, MapPin, GraduationCap, Briefcase, Users, Star, Shield, Crown, Eye, Loader2, Search, Filter } from "lucide-react";
import { useState } from "react";

type MatrimonyProfile = {
  id: number;
  profileType: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  height: string | null;
  complexion: string | null;
  gotra: string | null;
  manglik: string | null;
  caste: string | null;
  motherTongue: string | null;
  education: string;
  occupation: string;
  annualIncome: string | null;
  city: string;
  state: string;
  maritalStatus: string;
  diet: string | null;
  aboutMe: string | null;
  rashi: string | null;
  nakshatra: string | null;
  verified: boolean;
  approved: boolean;
  featured: boolean;
  createdAt: string;
};

export default function MatrimonyProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [casteFilter, setCasteFilter] = useState("all");

  const { data: profiles, isLoading } = useQuery<MatrimonyProfile[]>({
    queryKey: ["/api/matrimony/profiles"],
    queryFn: () => fetch("/api/matrimony/profiles").then(r => r.json()),
  });

  const filtered = (profiles || []).filter(p => {
    if (genderFilter !== "all" && p.gender !== genderFilter) return false;
    if (casteFilter !== "all" && p.caste !== casteFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        p.education.toLowerCase().includes(term) ||
        p.occupation.toLowerCase().includes(term) ||
        (p.caste || "").toLowerCase().includes(term)
      );
    }
    return true;
  });

  const castes = Array.from(new Set((profiles || []).map(p => p.caste).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white py-10 sm:py-14 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8 text-8xl font-serif">ॐ</div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-[#D4AF37] mb-4">
            <Shield className="w-3.5 h-3.5" /> Verified Profiles Only
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold mb-2" data-testid="heading-profiles">
            Verified Matrimony Profiles
          </h1>
          <p className="text-white/60 max-w-lg mx-auto text-sm">
            Every profile listed here has been manually verified and approved by our team for authenticity
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/30" />
              <input
                type="text"
                placeholder="Search by name, city, education..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                data-testid="input-search"
              />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none appearance-none"
              data-testid="select-gender-filter"
            >
              <option value="all">All Profiles</option>
              <option value="Female">Brides</option>
              <option value="Male">Grooms</option>
            </select>
            {castes.length > 0 && (
              <select
                value={casteFilter}
                onChange={(e) => setCasteFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none appearance-none"
                data-testid="select-caste-filter"
              >
                <option value="all">All Castes</option>
                {castes.map(c => <option key={c} value={c!}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-[#6D2B35]/10 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-[#6D2B35] mb-2">No Profiles Found</h3>
            <p className="text-sm text-[#5a4a3a]/50 mb-6">
              {profiles && profiles.length === 0
                ? "Verified profiles will appear here once approved by our team. Register now to be among the first!"
                : "Try adjusting your search or filters."}
            </p>
            <Link href="/matrimony/register">
              <button className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-full text-sm font-medium hover:bg-[#c4a030] transition-colors" data-testid="btn-register-empty">
                Register Your Profile
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                data-testid={`profile-card-${profile.id}`}
              >
                <Link href={`/matrimony/profile/${profile.id}`}>
                  <div className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative h-14 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47]">
                      {profile.featured && (
                        <div className="absolute top-2 right-2 bg-[#D4AF37] text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Featured
                        </div>
                      )}
                      {profile.verified && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Verified
                        </div>
                      )}
                    </div>

                    <div className="p-5 -mt-5 relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#c4a030] flex items-center justify-center text-white font-bold text-lg shadow-lg border-3 border-white mb-3">
                        {profile.fullName.charAt(0)}
                      </div>

                      <h3 className="font-serif text-lg text-[#6D2B35] font-semibold group-hover:text-[#D4AF37] transition-colors">
                        {profile.fullName}
                      </h3>
                      <p className="text-xs text-[#5a4a3a]/50 mt-0.5">
                        {profile.age} yrs {profile.height ? `| ${profile.height}` : ""} | {profile.gender === "Female" ? "Bride" : "Groom"}
                      </p>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[#5a4a3a]/60">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {profile.city}, {profile.state}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#5a4a3a]/60">
                          <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {profile.education}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#5a4a3a]/60">
                          <Briefcase className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {profile.occupation}
                        </div>
                        {profile.caste && (
                          <div className="flex items-center gap-2 text-xs text-[#5a4a3a]/60">
                            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {profile.caste} {profile.gotra ? `(${profile.gotra})` : ""}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {profile.maritalStatus && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#F5F0E6] rounded-full text-[#5a4a3a]/60">{profile.maritalStatus}</span>
                        )}
                        {profile.diet && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#F5F0E6] rounded-full text-[#5a4a3a]/60">{profile.diet}</span>
                        )}
                        {profile.manglik && profile.manglik !== "Don't Know" && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#F5F0E6] rounded-full text-[#5a4a3a]/60">Manglik: {profile.manglik}</span>
                        )}
                        {profile.rashi && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]">{profile.rashi}</span>
                        )}
                      </div>

                      <button className="mt-4 w-full py-2 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 group-hover:from-[#D4AF37] group-hover:to-[#c4a030] transition-all">
                        <Eye className="w-3.5 h-3.5" /> View Full Profile
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
