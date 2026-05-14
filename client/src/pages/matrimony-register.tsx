import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Heart, User, GraduationCap, Briefcase, MapPin, Users, Star, Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const CASTES = ["Brahmin", "Kshatriya", "Vaishya", "Kayastha", "Rajput", "Marwari", "Agarwal", "Gupta", "Jat", "Sharma", "Baniya", "Bhumihar", "Tyagi", "Khatri", "Other"];
const MOTHER_TONGUES = ["Hindi", "Bengali", "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Malayalam", "Punjabi", "Odia", "Assamese", "Maithili", "Sanskrit", "Bhojpuri", "Rajasthani", "Other"];
const HEIGHTS = ["4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\""];
const COMPLEXIONS = ["Very Fair", "Fair", "Wheatish", "Wheatish Medium", "Dark"];
const EDUCATION_LEVELS = ["10th Pass", "12th Pass", "Diploma", "B.A.", "B.Sc.", "B.Com.", "B.Tech/B.E.", "BBA/BMS", "MBBS", "BDS", "B.Pharma", "BCA", "LLB", "M.A.", "M.Sc.", "M.Com.", "M.Tech/M.E.", "MBA/PGDM", "MD/MS", "MCA", "CA", "CS", "ICWA", "Ph.D.", "Other"];
const OCCUPATIONS = ["Private Job", "Government Job", "Business/Self-Employed", "Doctor", "Engineer", "Teacher/Professor", "Lawyer/Advocate", "CA/CS", "Armed Forces", "Civil Services (IAS/IPS)", "Banking Professional", "IT Professional", "Homemaker", "Student", "Farmer", "Not Working", "Other"];
const INCOMES = ["Below 2 Lakh", "2-5 Lakh", "5-10 Lakh", "10-15 Lakh", "15-25 Lakh", "25-50 Lakh", "50 Lakh - 1 Crore", "Above 1 Crore", "Prefer Not to Say"];
const FAMILY_TYPES = ["Joint Family", "Nuclear Family", "Semi-Joint"];
const FAMILY_STATUS = ["Middle Class", "Upper Middle Class", "Rich", "Affluent"];
const RASHIS = ["Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)", "Kark (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischik (Scorpio)", "Dhanu (Sagittarius)", "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)"];
const NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const INDIAN_STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

type StepKey = "type" | "personal" | "education" | "family" | "horoscope" | "partner" | "contact";
const STEPS: { key: StepKey; label: string; icon: any }[] = [
  { key: "type", label: "Profile For", icon: User },
  { key: "personal", label: "Personal", icon: Heart },
  { key: "education", label: "Education & Career", icon: GraduationCap },
  { key: "family", label: "Family", icon: Users },
  { key: "horoscope", label: "Horoscope", icon: Star },
  { key: "partner", label: "Partner Preference", icon: Heart },
  { key: "contact", label: "Contact", icon: MapPin },
];

function SelectField({ label, name, value, onChange, options, required }: { label: string; name: string; value: string; onChange: (e: any) => void; options: string[]; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-[#5a4a3a]/60 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      <select name={name} value={value} onChange={onChange} required={required} className="w-full px-3 py-2.5 rounded-xl border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 appearance-none" data-testid={`select-${name}`}>
        <option value="">Select</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, name, value, onChange, placeholder, required, type }: { label: string; name: string; value: string; onChange: (e: any) => void; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-[#5a4a3a]/60 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      <input type={type || "text"} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="w-full px-3 py-2.5 rounded-xl border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30" data-testid={`input-${name}`} />
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, placeholder, rows }: { label: string; name: string; value: string; onChange: (e: any) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="col-span-full">
      <label className="block text-xs text-[#5a4a3a]/60 mb-1">{label}</label>
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2.5 rounded-xl border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 resize-none" data-testid={`textarea-${name}`} />
    </div>
  );
}

export default function MatrimonyRegister() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    profileType: "", fullName: "", gender: "", dateOfBirth: "", age: "",
    height: "", weight: "", complexion: "", gotra: "", manglik: "",
    caste: "", subCaste: "", motherTongue: "", education: "", occupation: "",
    annualIncome: "", employedIn: "", city: "", state: "", maritalStatus: "Never Married",
    diet: "", smoking: "No", drinking: "No", aboutMe: "",
    familyType: "", familyStatus: "", fatherOccupation: "", motherOccupation: "", siblings: "",
    birthTime: "", birthPlace: "", rashi: "", nakshatra: "", kundliDetails: "",
    partnerAgeMin: "", partnerAgeMax: "", partnerHeightMin: "", partnerHeightMax: "",
    partnerEducation: "", partnerOccupation: "", partnerCaste: "", partnerCity: "",
    partnerExpectations: "",
    contactName: "", contactEmail: "", contactPhone: "", contactRelation: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.gender || !form.dateOfBirth || !form.education || !form.occupation || !form.city || !form.state || !form.contactName || !form.contactEmail || !form.contactPhone || !form.profileType) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/matrimony/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age) || 0,
          partnerAgeMin: parseInt(form.partnerAgeMin) || null,
          partnerAgeMax: parseInt(form.partnerAgeMax) || null,
          religion: "Hindu",
          country: "India",
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        toast({ title: data.message || "Registration failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not connect to server", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-lg p-8 sm:p-12 max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-serif text-2xl text-[#6D2B35] font-bold mb-3" data-testid="heading-success">Profile Submitted Successfully!</h2>
          <p className="text-sm text-[#5a4a3a]/60 mb-4 leading-relaxed">
            Thank you for registering with Vedic Tatva Matrimony. Your profile has been submitted for verification. 
            Our team will review your details within 2-3 business days.
          </p>
          <div className="bg-[#F5F0E6] rounded-xl p-4 mb-6">
            <p className="text-sm text-[#6D2B35] font-medium mb-1">What happens next?</p>
            <ul className="text-xs text-[#5a4a3a]/60 space-y-1 text-left">
              <li>1. Our team verifies your submitted details</li>
              <li>2. You may be contacted for additional documents</li>
              <li>3. Once approved, your profile goes live</li>
              <li>4. You'll receive an email confirmation</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Link href="/matrimony" className="flex-1">
              <button className="w-full py-3 bg-[#6D2B35] text-white rounded-xl text-sm font-medium" data-testid="btn-back-matrimony">Back to Matrimony</button>
            </Link>
            <Link href="/" className="flex-1">
              <button className="w-full py-3 bg-[#F5F0E6] text-[#6D2B35] rounded-xl text-sm font-medium border border-[#6D2B35]/15" data-testid="btn-go-home">Go Home</button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    switch (STEPS[step].key) {
      case "type":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Who is this profile for?</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Myself (Bride)", "Myself (Groom)", "My Daughter", "My Son", "My Sister", "My Brother", "My Friend", "My Relative"].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const isBride = type.includes("Bride") || type.includes("Daughter") || type.includes("Sister");
                    setForm(prev => ({ ...prev, profileType: type, gender: isBride ? "Female" : type.includes("Groom") || type.includes("Son") || type.includes("Brother") ? "Male" : prev.gender }));
                  }}
                  className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.profileType === type
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#6D2B35]"
                      : "border-[#6D2B35]/10 text-[#5a4a3a]/60 hover:border-[#D4AF37]/30"
                  }`}
                  data-testid={`btn-type-${type.replace(/\s/g, "-").toLowerCase()}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        );
      case "personal":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female"]} required />
              <TextField label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" required />
              <TextField label="Age" name="age" value={form.age} onChange={handleChange} type="number" required />
              <SelectField label="Height" name="height" value={form.height} onChange={handleChange} options={HEIGHTS} />
              <TextField label="Weight (kg)" name="weight" value={form.weight} onChange={handleChange} />
              <SelectField label="Complexion" name="complexion" value={form.complexion} onChange={handleChange} options={COMPLEXIONS} />
              <SelectField label="Marital Status" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} options={["Never Married", "Divorced", "Widowed", "Awaiting Divorce"]} required />
              <TextField label="Gotra" name="gotra" value={form.gotra} onChange={handleChange} placeholder="e.g. Bharadwaj, Kashyap" />
              <SelectField label="Manglik" name="manglik" value={form.manglik} onChange={handleChange} options={["Yes", "No", "Partial/Anshik", "Don't Know"]} />
              <SelectField label="Caste" name="caste" value={form.caste} onChange={handleChange} options={CASTES} />
              <TextField label="Sub-caste" name="subCaste" value={form.subCaste} onChange={handleChange} />
              <SelectField label="Mother Tongue" name="motherTongue" value={form.motherTongue} onChange={handleChange} options={MOTHER_TONGUES} />
              <SelectField label="Diet" name="diet" value={form.diet} onChange={handleChange} options={["Vegetarian", "Non-Vegetarian", "Eggetarian", "Jain Vegetarian", "Vegan"]} />
              <TextAreaField label="About Me" name="aboutMe" value={form.aboutMe} onChange={handleChange} placeholder="Describe yourself, your interests, values, and what you're looking for in a life partner..." />
            </div>
          </div>
        );
      case "education":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Education & Career</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Highest Education" name="education" value={form.education} onChange={handleChange} options={EDUCATION_LEVELS} required />
              <SelectField label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} options={OCCUPATIONS} required />
              <SelectField label="Annual Income" name="annualIncome" value={form.annualIncome} onChange={handleChange} options={INCOMES} />
              <SelectField label="Employed In" name="employedIn" value={form.employedIn} onChange={handleChange} options={["Private Sector", "Government/PSU", "Defence", "Self-Employed", "Business", "Not Working"]} />
              <TextField label="City" name="city" value={form.city} onChange={handleChange} required placeholder="e.g. Delhi, Mumbai" />
              <SelectField label="State" name="state" value={form.state} onChange={handleChange} options={INDIAN_STATES} required />
            </div>
          </div>
        );
      case "family":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Family Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Family Type" name="familyType" value={form.familyType} onChange={handleChange} options={FAMILY_TYPES} />
              <SelectField label="Family Status" name="familyStatus" value={form.familyStatus} onChange={handleChange} options={FAMILY_STATUS} />
              <TextField label="Father's Occupation" name="fatherOccupation" value={form.fatherOccupation} onChange={handleChange} />
              <TextField label="Mother's Occupation" name="motherOccupation" value={form.motherOccupation} onChange={handleChange} />
              <TextField label="Siblings (e.g. 1 Brother, 2 Sisters)" name="siblings" value={form.siblings} onChange={handleChange} placeholder="e.g. 1 Elder Brother (Married), 1 Younger Sister" />
            </div>
          </div>
        );
      case "horoscope":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Horoscope / Kundli Details</h3>
            <p className="text-xs text-[#5a4a3a]/50">These details help in astrological compatibility matching (Ashtakoot Guna Milan).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Birth Time" name="birthTime" value={form.birthTime} onChange={handleChange} type="time" />
              <TextField label="Birth Place" name="birthPlace" value={form.birthPlace} onChange={handleChange} placeholder="e.g. Varanasi, Uttar Pradesh" />
              <SelectField label="Rashi (Moon Sign)" name="rashi" value={form.rashi} onChange={handleChange} options={RASHIS} />
              <SelectField label="Nakshatra (Birth Star)" name="nakshatra" value={form.nakshatra} onChange={handleChange} options={NAKSHATRAS} />
              <TextAreaField label="Additional Kundli Details" name="kundliDetails" value={form.kundliDetails} onChange={handleChange} placeholder="Any additional horoscope details you'd like to share..." />
            </div>
          </div>
        );
      case "partner":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Partner Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Preferred Age (Min)" name="partnerAgeMin" value={form.partnerAgeMin} onChange={handleChange} type="number" placeholder="e.g. 25" />
              <TextField label="Preferred Age (Max)" name="partnerAgeMax" value={form.partnerAgeMax} onChange={handleChange} type="number" placeholder="e.g. 32" />
              <SelectField label="Preferred Height (Min)" name="partnerHeightMin" value={form.partnerHeightMin} onChange={handleChange} options={HEIGHTS} />
              <SelectField label="Preferred Height (Max)" name="partnerHeightMax" value={form.partnerHeightMax} onChange={handleChange} options={HEIGHTS} />
              <SelectField label="Preferred Education" name="partnerEducation" value={form.partnerEducation} onChange={handleChange} options={["Any", ...EDUCATION_LEVELS]} />
              <SelectField label="Preferred Occupation" name="partnerOccupation" value={form.partnerOccupation} onChange={handleChange} options={["Any", ...OCCUPATIONS]} />
              <SelectField label="Preferred Caste" name="partnerCaste" value={form.partnerCaste} onChange={handleChange} options={["Any", ...CASTES]} />
              <TextField label="Preferred City" name="partnerCity" value={form.partnerCity} onChange={handleChange} placeholder="Any or specific city" />
              <TextAreaField label="Partner Expectations" name="partnerExpectations" value={form.partnerExpectations} onChange={handleChange} placeholder="Describe your ideal life partner — values, personality, lifestyle preferences..." />
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-[#6D2B35] font-semibold">Contact Information</h3>
            <p className="text-xs text-[#5a4a3a]/50">This information is kept confidential and only shared after mutual consent.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Contact Person Name" name="contactName" value={form.contactName} onChange={handleChange} required placeholder="Name of person to contact" />
              <SelectField label="Relation to Candidate" name="contactRelation" value={form.contactRelation} onChange={handleChange} options={["Self", "Father", "Mother", "Brother", "Sister", "Uncle", "Aunt", "Friend", "Other"]} />
              <TextField label="Email Address" name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" required />
              <TextField label="Phone Number" name="contactPhone" value={form.contactPhone} onChange={handleChange} type="tel" required placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <Link href="/matrimony">
            <button className="absolute left-4 top-4 text-white/60 hover:text-white transition-colors flex items-center gap-1 text-xs" data-testid="btn-back">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </Link>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-[#D4AF37] mb-3">
            <Heart className="w-3.5 h-3.5" /> Bride & Groom Registration
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="heading-register">Register for Matrimony</h1>
          <p className="text-white/50 text-sm mt-1">Fill your details for premium verified listing</p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex overflow-x-auto gap-1 mb-6 pb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                i === step
                  ? "bg-[#6D2B35] text-white shadow-lg"
                  : i < step
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white text-[#5a4a3a]/40 border border-[#6D2B35]/10"
              }`}
              data-testid={`step-btn-${s.key}`}
            >
              {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
              {s.label}
            </button>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6"
        >
          {renderStep()}

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#6D2B35]/5">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-2.5 border border-[#6D2B35]/15 text-[#6D2B35] rounded-xl text-sm font-medium hover:bg-[#F5F0E6] transition-colors flex items-center justify-center gap-1" data-testid="btn-prev">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 py-2.5 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1" data-testid="btn-next">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#c4a030] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1 disabled:opacity-50" data-testid="btn-submit">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Heart className="w-4 h-4" /> Submit Profile</>}
              </button>
            )}
          </div>
        </motion.div>

        <div className="mt-4 p-4 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/15">
          <p className="text-xs text-[#5a4a3a]/60 text-center">
            By submitting this form, you agree that the information provided is true and accurate.
            Vedic Tatva Matrimony reserves the right to reject or remove profiles that fail verification.
            All profiles are subject to manual review before approval.
          </p>
        </div>
      </div>
    </div>
  );
}
