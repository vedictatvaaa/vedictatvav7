import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, MapPin, GraduationCap, Briefcase, Users, Star, Shield, ArrowLeft, Crown, Calendar, Utensils, Clock, Sparkles, User } from "lucide-react";

type MatrimonyProfile = {
  id: number;
  profileType: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  height: string | null;
  weight: string | null;
  complexion: string | null;
  gotra: string | null;
  manglik: string | null;
  religion: string;
  caste: string | null;
  subCaste: string | null;
  motherTongue: string | null;
  education: string;
  occupation: string;
  annualIncome: string | null;
  employedIn: string | null;
  city: string;
  state: string;
  country: string;
  maritalStatus: string;
  diet: string | null;
  smoking: string | null;
  drinking: string | null;
  aboutMe: string | null;
  familyType: string | null;
  familyStatus: string | null;
  fatherOccupation: string | null;
  motherOccupation: string | null;
  siblings: string | null;
  partnerAgeMin: number | null;
  partnerAgeMax: number | null;
  partnerHeightMin: string | null;
  partnerHeightMax: string | null;
  partnerEducation: string | null;
  partnerOccupation: string | null;
  partnerCaste: string | null;
  partnerCity: string | null;
  partnerExpectations: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  rashi: string | null;
  nakshatra: string | null;
  kundliDetails: string | null;
  verified: boolean;
  featured: boolean;
  createdAt: string;
};

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-[#6D2B35]/5 last:border-0">
      <span className="text-xs text-[#5a4a3a]/50">{label}</span>
      <span className="text-sm text-[#5a4a3a] font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function MatrimonyProfileDetail() {
  const [, params] = useRoute("/matrimony/profile/:id");
  const profileId = params?.id;

  const { data: profile, isLoading, error } = useQuery<MatrimonyProfile>({
    queryKey: [`/api/matrimony/profiles/${profileId}`],
    queryFn: () => fetch(`/api/matrimony/profiles/${profileId}`).then(r => r.json()),
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#D4AF37] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#5a4a3a]/50">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center px-4">
        <div className="text-center">
          <Heart className="w-16 h-16 text-[#6D2B35]/10 mx-auto mb-4" />
          <h2 className="font-serif text-xl text-[#6D2B35] mb-2">Profile Not Found</h2>
          <Link href="/matrimony/profiles">
            <button className="px-6 py-2.5 bg-[#6D2B35] text-white rounded-xl text-sm font-medium">Browse Profiles</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white py-10 sm:py-14">
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/matrimony/profiles">
            <button className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-xs mb-6" data-testid="btn-back">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Profiles
            </button>
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#c4a030] flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
              {profile.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {profile.verified && (
                  <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
                {profile.featured && (
                  <span className="bg-[#D4AF37] text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-profile-name">{profile.fullName}</h1>
              <p className="text-white/60 text-sm mt-1">
                {profile.age} years | {profile.gender === "Female" ? "Bride" : "Groom"} | {profile.city}, {profile.state}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-5">
        {profile.aboutMe && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6">
            <h2 className="font-serif text-lg text-[#6D2B35] flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-[#D4AF37]" /> About
            </h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed" data-testid="text-about">{profile.aboutMe}</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6">
          <h2 className="font-serif text-lg text-[#6D2B35] flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-[#D4AF37]" /> Personal Details
          </h2>
          <InfoRow label="Full Name" value={profile.fullName} />
          <InfoRow label="Age" value={`${profile.age} years`} />
          <InfoRow label="Height" value={profile.height} />
          <InfoRow label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
          <InfoRow label="Complexion" value={profile.complexion} />
          <InfoRow label="Marital Status" value={profile.maritalStatus} />
          <InfoRow label="Religion" value={profile.religion} />
          <InfoRow label="Caste" value={profile.caste} />
          <InfoRow label="Sub-caste" value={profile.subCaste} />
          <InfoRow label="Gotra" value={profile.gotra} />
          <InfoRow label="Mother Tongue" value={profile.motherTongue} />
          <InfoRow label="Manglik" value={profile.manglik} />
          <InfoRow label="Diet" value={profile.diet} />
          <InfoRow label="Smoking" value={profile.smoking} />
          <InfoRow label="Drinking" value={profile.drinking} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6">
          <h2 className="font-serif text-lg text-[#6D2B35] flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-[#D4AF37]" /> Education & Career
          </h2>
          <InfoRow label="Education" value={profile.education} />
          <InfoRow label="Occupation" value={profile.occupation} />
          <InfoRow label="Annual Income" value={profile.annualIncome} />
          <InfoRow label="Employed In" value={profile.employedIn} />
          <InfoRow label="City" value={profile.city} />
          <InfoRow label="State" value={profile.state} />
          <InfoRow label="Country" value={profile.country} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6">
          <h2 className="font-serif text-lg text-[#6D2B35] flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[#D4AF37]" /> Family Details
          </h2>
          <InfoRow label="Family Type" value={profile.familyType} />
          <InfoRow label="Family Status" value={profile.familyStatus} />
          <InfoRow label="Father's Occupation" value={profile.fatherOccupation} />
          <InfoRow label="Mother's Occupation" value={profile.motherOccupation} />
          <InfoRow label="Siblings" value={profile.siblings} />
        </motion.div>

        {(profile.rashi || profile.nakshatra || profile.birthTime || profile.birthPlace) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-[#D4AF37]/10 to-[#6D2B35]/5 rounded-2xl border border-[#D4AF37]/20 p-6">
            <h2 className="font-serif text-lg text-[#6D2B35] flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" /> Horoscope / Kundli
            </h2>
            <InfoRow label="Rashi (Moon Sign)" value={profile.rashi} />
            <InfoRow label="Nakshatra (Birth Star)" value={profile.nakshatra} />
            <InfoRow label="Birth Time" value={profile.birthTime} />
            <InfoRow label="Birth Place" value={profile.birthPlace} />
            {profile.kundliDetails && (
              <div className="mt-3 pt-3 border-t border-[#D4AF37]/15">
                <p className="text-xs text-[#5a4a3a]/50 mb-1">Additional Kundli Details</p>
                <p className="text-sm text-[#5a4a3a]/70">{profile.kundliDetails}</p>
              </div>
            )}
          </motion.div>
        )}

        {(profile.partnerAgeMin || profile.partnerExpectations || profile.partnerEducation) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6">
            <h2 className="font-serif text-lg text-[#6D2B35] flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-[#D4AF37]" /> Partner Preferences
            </h2>
            {(profile.partnerAgeMin || profile.partnerAgeMax) && (
              <InfoRow label="Preferred Age" value={`${profile.partnerAgeMin || "Any"} - ${profile.partnerAgeMax || "Any"} years`} />
            )}
            {(profile.partnerHeightMin || profile.partnerHeightMax) && (
              <InfoRow label="Preferred Height" value={`${profile.partnerHeightMin || "Any"} - ${profile.partnerHeightMax || "Any"}`} />
            )}
            <InfoRow label="Preferred Education" value={profile.partnerEducation} />
            <InfoRow label="Preferred Occupation" value={profile.partnerOccupation} />
            <InfoRow label="Preferred Caste" value={profile.partnerCaste} />
            <InfoRow label="Preferred City" value={profile.partnerCity} />
            {profile.partnerExpectations && (
              <div className="mt-3 pt-3 border-t border-[#6D2B35]/5">
                <p className="text-xs text-[#5a4a3a]/50 mb-1">Partner Expectations</p>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">{profile.partnerExpectations}</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="bg-[#6D2B35]/5 rounded-2xl border border-[#6D2B35]/10 p-6 text-center">
          <Shield className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
          <h3 className="font-serif text-lg text-[#6D2B35] font-semibold mb-2">Interested in this Profile?</h3>
          <p className="text-sm text-[#5a4a3a]/60 mb-4 max-w-md mx-auto">
            Contact details are shared only after mutual interest and verification. 
            Please reach out to us to express your interest in this profile.
          </p>
          <Link href="/contact">
            <button className="px-8 py-3 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity" data-testid="btn-contact-interest">
              Express Interest
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
