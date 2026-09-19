import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Info,
  Languages,
  Lock,
  Mail,
  Phone,
  PlayCircle,
  CalendarCheck,
  Globe,
  Monitor,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { panditApi } from "@/lib/panditAuth";
import PanditPwaInstallButton from "@/components/pandit/PanditPwaInstallButton";
import { savePanditAccessHandoff } from "@/lib/panditAccessHandoff";
import { RegistrationSection, type FormState } from "@/pages/become-pandit";

type AuthMode = "login" | "signup";
type Language = "en" | "hi";

type LocationCity = {
  id: number;
  name: string;
  isActive: boolean;
};

type LocationState = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  cities: LocationCity[];
};

type SignupState = {
  fullName: string;
  phone: string;
  email: string;
  stateId: string;
  cityId: string;
  languages: string[];
  experience: string;
};

const SUPPORTED_PANDIT_LANGUAGES = [
  "Hindi",
  "Sanskrit",
  "English",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Assamese",
] as const;

const signupInitialState: SignupState = {
  fullName: "",
  phone: "",
  email: "",
  stateId: "",
  cityId: "",
  languages: [],
  experience: "",
};

const registrationInitialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  experience: "",
  stateId: "",
  cityId: "",
  proposedCityName: "",
  registeredAddress: "",
  latitude: null,
  longitude: null,
  locationPermissionGranted: false,
  specializations: "",
  education: "",
  languages: "",
  bio: "",
  serviceArea: "",
  regionalOrigin: "",
  membership: "free",
  agreeTerms: false,
  servicesConfirmed: false,
  masterServiceIds: [],
};

export default function PanditLoginPage({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [language, setLanguage] = useState<Language>("en");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [signup, setSignup] = useState(signupInitialState);
  const [locations, setLocations] = useState<LocationState[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [registrationForm, setRegistrationForm] = useState<FormState>(registrationInitialState);
  const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState<string | null>(null);
  const [registrationPhotoFile, setRegistrationPhotoFile] = useState<File | null>(null);
  const [registrationPhotoError, setRegistrationPhotoError] = useState("");
  const [registrationLocationError, setRegistrationLocationError] = useState("");
  const [registrationServicesError, setRegistrationServicesError] = useState("");
  const [registrationApplicationError, setRegistrationApplicationError] = useState("");
  const [registrationMissingCityMode, setRegistrationMissingCityMode] = useState(false);

  const DEMO_PHONE = "9000012345";
  const DEMO_PASS = "demo1234";
  const hindi = language === "hi";

  useEffect(() => {
    let cancelled = false;
    setLocationsLoading(true);
    fetch("/api/locations")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load the location catalogue");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid location catalogue");
        return data as LocationState[];
      })
      .then((data) => {
        if (cancelled) return;
        setLocations(data.filter((state) => state.isActive));
        setLocationsError("");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setLocationsError(error.message || "Unable to load locations");
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeStates = locations.filter((state) => state.isActive);
  const selectedState = activeStates.find((state) => String(state.id) === signup.stateId);
  const activeCities = selectedState?.cities.filter((city) => city.isActive) || [];

  const copy = {
    workspace: hindi ? "पंडितजी पोर्टल" : "Panditji portal",
    loginDescription: hindi
      ? "बुकिंग, कैलेंडर, कमाई, AI टूल्स, संदेशों और कई प्रीमियम सुविधाओं में साइन इन करें।"
      : "Sign in to bookings, calendar, earnings, AI tools, messages, and many premium features.",
    signIn: hindi ? "साइन इन" : "Sign in",
    apply: hindi ? "जुड़ने के लिए आवेदन" : "Apply to join",
    signupTitle: hindi ? "पंडितजी के रूप में जुड़ें" : "Join as a Panditji",
    signupDescription: hindi
      ? "अपना परिचय दें। अगला चरण आपकी पूरी प्रोफ़ाइल और सत्यापन के लिए होगा।"
      : "Tell us about yourself. The next step completes your profile and verification.",
    backToLogin: hindi ? "साइन इन पर वापस जाएँ" : "Back to sign in",
    continue: hindi ? "आवेदन शुरू करें" : "Start my application",
    name: hindi ? "पूरा नाम" : "Full name",
    registeredPhone: hindi ? "मोबाइल नंबर" : "Mobile number",
    email: hindi ? "ईमेल पता" : "Email address",
    state: hindi ? "राज्य" : "State",
    city: hindi ? "शहर" : "City",
    chooseState: hindi ? "राज्य चुनें" : "Choose a state",
    chooseCity: hindi ? "शहर चुनें" : "Choose a city",
    locationsLoading: hindi ? "स्थान लोड हो रहे हैं..." : "Loading locations...",
    locationsError: hindi ? "स्थान सूची उपलब्ध नहीं है। कृपया बाद में प्रयास करें।" : "The location list is unavailable. Please try again later.",
    languages: hindi ? "आप किन भाषाओं में सेवा देते हैं?" : "Languages you serve in",
    languageHint: hindi ? "एक या अधिक भाषाएँ चुनें" : "Choose one or more languages",
    experience: hindi ? "अनुभव (वर्ष)" : "Years of experience",
    profileStep: hindi
      ? "अगले चरण में सटीक स्थान, पाँच पूजाएँ और प्रोफ़ाइल फ़ोटो जोड़कर सत्यापन पूरा होगा।"
      : "Next, add exact location, five Pujas, and a profile photo to complete verification.",
    keepClose: hindi ? "अपना कार्यक्षेत्र पास रखें" : "Keep your practice close",
    installDescription: hindi ? "एक टैप में पहुँचने के लिए होम स्क्रीन पर जोड़ें।" : "Add Panditji to your home screen for one-tap access.",
    registered: hindi ? "पंजीकृत मोबाइल" : "Registered phone",
    password: hindi ? "पासवर्ड" : "Password",
    forgot: hindi ? "पासवर्ड भूल गए?" : "Forgot password?",
    signInCta: hindi ? "अपने कार्यक्षेत्र में साइन इन करें" : "Sign in to your practice",
    firstLogin: hindi ? "पहली बार साइन इन कर रहे हैं?" : "First-time login?",
    firstLoginDescription: hindi
      ? "अपने अनुमोदन ईमेल में दिए सुरक्षित Create Password लिंक का उपयोग करें।"
      : "Use the secure Create Password link in your approval email, then sign in with the private password you choose.",
    demoTitle: hindi ? "पोर्टल देखें — डेमो पंडितजी" : "Try the portal — demo Panditji",
    demoDescription: hindi ? "नमूना खाते से बुकिंग, कमाई और टूल देखें। साइनअप की ज़रूरत नहीं।" : "Explore bookings, earnings and tools with a sample account. No signup needed.",
    fillDemo: hindi ? "डेमो विवरण भरें" : "Auto-fill demo credentials",
    secure: hindi ? "सत्यापित पंडितजी खातों के लिए सुरक्षित पहुँच" : "Secure access for verified Panditji accounts",
    newTo: hindi ? "Vedic Tatva में नए हैं?" : "New to Vedic Tatva?",
    applyAs: hindi ? "पंडितजी के रूप में आवेदन करें" : "Apply as a Panditji",
    privacy: hindi ? "जारी रखकर आप Vedic Tatva की कार्य-नीतियों और गोपनीयता शर्तों से सहमत हैं।" : "By continuing, you agree to the Vedic Tatva practice guidelines and privacy terms.",
    benefitsEyebrow: hindi ? "पंडितजी का डिजिटल कार्यक्षेत्र" : "PANDITJI DIGITAL WORKSPACE",
    benefitsTitle: hindi ? "अपनी साधना को सम्मान के साथ आगे बढ़ाएं।" : "Grow your practice with dignity.",
    benefitsDescription: hindi
      ? "सत्यापित प्रोफ़ाइल, नियमित बुकिंग और ऐसे टूल जो आपकी सेवा को सरल रखते हैं।"
      : "A verified profile, steady bookings, and tools that keep your practice focused on seva.",
    benefitVerified: hindi ? "सत्यापित पहचान" : "Verified identity",
    benefitBookings: hindi ? "बुकिंग संभालें" : "Manage bookings",
    benefitTools: hindi ? "स्मार्ट टूल्स" : "Smart tools",
    exploreDemo: hindi ? "लाइव डेमो देखें" : "Explore the live demo",
    fullStory: hindi ? "पूरी जानकारी देखें" : "See the full Panditji story",
  };

  const fillDemo = () => {
    setMode("login");
    setPhone(DEMO_PHONE);
    setPassword(DEMO_PASS);
  };

  const openDemo = () => {
    setMode("login");
    window.requestAnimationFrame(() => {
      document.getElementById("pandit-demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const requestRegistrationExactLocation = () => {
    if (!navigator.geolocation) {
      const message = "This browser does not support location access.";
      setRegistrationLocationError(message);
      setRegistrationApplicationError(message);
      return;
    }
    setRegistrationLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => setRegistrationForm((current) => ({
        ...current,
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        locationPermissionGranted: true,
      })),
      () => {
        const message = "Location access is required to submit your application. Please allow it and try again.";
        setRegistrationLocationError(message);
        setRegistrationApplicationError(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleRegistrationChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setRegistrationForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegistrationPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setRegistrationPhotoFile(null);
      setRegistrationPhotoPreview(null);
      setRegistrationPhotoError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      event.target.value = "";
      return;
    }
    setRegistrationPhotoError("");
    setRegistrationPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setRegistrationPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const registrationMutation = useMutation({
    mutationFn: async () => {
      if (!registrationPhotoFile) throw new Error("A profile photo is required.");
      const uploadData = new FormData();
      uploadData.append("photo", registrationPhotoFile);
      const upload = await fetch("/api/pandit-applications/upload-photo", { method: "POST", body: uploadData });
      const uploadBody = await upload.json().catch(() => ({}));
      if (!upload.ok || !uploadBody.url) throw new Error(uploadBody.message || "Photo upload failed");
      const { city: _city, stateId, cityId, proposedCityName, ...rest } = registrationForm;
      const response = await fetch("/api/pandit-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          termsAccepted: registrationForm.agreeTerms,
          stateId: Number(stateId),
          ...(cityId ? { cityId: Number(cityId) } : { proposedCityName: proposedCityName.trim() }),
          photo: uploadBody.url,
        }),
      });
      if (!response.ok) {
        throw new Error((await response.json().catch(() => ({}))).message || "Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Application Submitted", description: "We'll review your details and reach out within 48 hours." });
      setRegistrationForm(registrationInitialState);
      setRegistrationPhotoPreview(null);
      setRegistrationPhotoFile(null);
      setRegistrationPhotoError("");
      setRegistrationLocationError("");
      setRegistrationServicesError("");
      setRegistrationApplicationError("");
      setRegistrationMissingCityMode(false);
    },
    onError: (error: Error) => {
      setRegistrationApplicationError(error.message);
      if (/photo/i.test(error.message)) setRegistrationPhotoError(error.message);
      if (/location|exact|permission/i.test(error.message)) setRegistrationLocationError(error.message);
      if (/Puja|services/i.test(error.message)) setRegistrationServicesError(error.message);
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleRegistrationSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (registrationMutation.isPending) return;
    setRegistrationApplicationError("");
    const form = registrationForm;
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.stateId || (!form.cityId && !form.proposedCityName.trim()) || !form.registeredAddress.trim() || !form.experience || !form.specializations.trim() || !form.education.trim() || !form.languages.trim() || !form.bio.trim() || !form.serviceArea.trim()) {
      const message = "Complete all required personal, location, and practice fields.";
      setRegistrationApplicationError(message);
      toast({ title: "Missing required details", description: message, variant: "destructive" });
      return;
    }
    if (form.masterServiceIds.length !== 5) {
      const message = `Select exactly five specialist Pujas (you selected ${form.masterServiceIds.length}).`;
      setRegistrationServicesError(message);
      setRegistrationApplicationError(message);
      toast({ title: "Choose five specialist Pujas", description: "Select exactly five Pujas you are fully expert in.", variant: "destructive" });
      return;
    }
    if (!form.locationPermissionGranted || form.latitude == null || form.longitude == null) {
      const message = "Share your exact location before submitting.";
      setRegistrationLocationError(message);
      setRegistrationApplicationError(message);
      toast({ title: "Location Required", description: "Location access is required for onboarding.", variant: "destructive" });
      return;
    }
    if (!form.servicesConfirmed) {
      const message = "Confirm that the selected Pujas are services you personally offer.";
      setRegistrationServicesError(message);
      setRegistrationApplicationError(message);
      toast({ title: "Confirm your services", description: message, variant: "destructive" });
      return;
    }
    if (!registrationPhotoFile) {
      const message = "Upload a profile photo before submitting.";
      setRegistrationPhotoError(message);
      setRegistrationApplicationError(message);
      toast({ title: "Photo Required", description: message, variant: "destructive" });
      return;
    }
    if (!form.agreeTerms) {
      const message = "Accept the terms before submitting.";
      setRegistrationApplicationError(message);
      toast({ title: "Terms Required", description: message, variant: "destructive" });
      return;
    }
    registrationMutation.mutate();
  };

  const submit = async () => {
    if (!phone || !password) {
      toast({ title: hindi ? "मोबाइल और पासवर्ड आवश्यक हैं" : "Phone & password required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await panditApi("POST", "/api/pandit/login", { phone, password });
      toast({
        title: `${hindi ? "स्वागत है" : "Welcome"}, ${r.pandit?.name || "Panditji"}`,
        description: r.mustChangePassword
          ? hindi ? "कृपया अपनी प्रोफ़ाइल से नया पासवर्ड सेट करें।" : "Please set a new password from your profile."
          : undefined,
      });
      setLocation("/pandit/portal");
    } catch (e: any) {
      toast({ title: hindi ? "साइन इन विफल" : "Login failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!phone || !resetEmail) {
      toast({ title: hindi ? "मोबाइल और ईमेल आवश्यक हैं" : "Phone and email required", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch("/api/pandit/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email: resetEmail }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not request a password reset link");
      toast({ title: hindi ? "अपना ईमेल देखें" : "Check your email", description: body.message });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({ title: hindi ? "अनुरोध विफल" : "Request failed", description: error?.message || "Try again", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const updateSignup = (field: Exclude<keyof SignupState, "languages">, value: string) => {
    setSignup((current) => ({ ...current, [field]: value }));
  };

  const toggleSignupLanguage = (selectedLanguage: string) => {
    setSignup((current) => ({
      ...current,
      languages: current.languages.includes(selectedLanguage)
        ? current.languages.filter((item) => item !== selectedLanguage)
        : [...current.languages, selectedLanguage],
    }));
  };

  const submitSignup = (event: React.FormEvent) => {
    event.preventDefault();
    const selectedCity = activeCities.find((city) => String(city.id) === signup.cityId);
    const requiredTextMissing = !signup.fullName.trim()
      || !signup.phone.trim()
      || !signup.email.trim()
      || !signup.experience.trim();
    if (
      requiredTextMissing
      || !signup.stateId
      || !signup.cityId
      || signup.languages.length === 0
      || !selectedState
      || !selectedCity
    ) {
      toast({
        title: hindi ? "कृपया सभी विवरण भरें" : "Complete the signup form",
        description: hindi
          ? "नाम, मोबाइल, ईमेल, अनुभव, राज्य, शहर और कम से कम एक भाषा आवश्यक है।"
          : "Name, mobile, email, experience, state, city, and at least one language are required.",
        variant: "destructive",
      });
      return;
    }

    const saved = savePanditAccessHandoff({
      fullName: signup.fullName.trim(),
      phone: signup.phone.trim(),
      email: signup.email.trim(),
      stateId: selectedState.id,
      cityId: selectedCity.id,
      stateName: selectedState.name,
      cityName: selectedCity.name,
      languages: signup.languages.join(", "),
      experience: signup.experience.trim(),
    });
    if (!saved) {
      toast({
        title: hindi ? "आवेदन शुरू नहीं हो सका" : "Could not start application",
        description: hindi ? "कृपया ब्राउज़र स्टोरेज की अनुमति देकर फिर प्रयास करें।" : "Please allow browser storage and try again.",
        variant: "destructive",
      });
      return;
    }
    setLocation("/become-pandit#apply");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF6ED] text-[#2D1B1E]">
      <div
        className="relative min-h-screen px-4 py-5 sm:px-6 sm:py-8"
        style={{
          backgroundImage: "radial-gradient(circle at 12% 0%, rgba(215,167,55,.18), transparent 28%), radial-gradient(circle at 100% 100%, rgba(109,43,53,.08), transparent 36%)",
        }}
      >
        <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
          <header className="flex items-center justify-end px-1 pb-5 text-[10px] font-extrabold tracking-[.16em] text-[#55252D]">
            <button
              type="button"
              onClick={() => setLanguage((current) => current === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#A67817]/30 bg-white/50 px-2.5 py-1.5 text-[10px] font-extrabold tracking-normal text-[#704D12] transition-colors hover:bg-white"
              aria-label={hindi ? "Switch to English" : "हिंदी में बदलें"}
            >
              <Languages className="h-3.5 w-3.5" />
              {hindi ? "हिंदी" : "EN"} <span className="text-[#B98117]">/</span> {hindi ? "EN" : "हिंदी"}
            </button>
          </header>

          <div className={mode === "signup" ? "grid gap-4" : "grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(25rem,.95fr)] lg:items-start"}>
            {mode !== "signup" && <section
              className={`relative overflow-hidden rounded-[1.5rem] border border-[#6D2B35]/20 bg-[#4A1A22] shadow-[0_22px_65px_rgba(77,40,36,.16)] ${mode === "signup" ? "min-h-[16rem] lg:min-h-[18rem]" : "min-h-[25rem] lg:min-h-[40rem]"}`}
              aria-labelledby="pandit-benefits-heading"
              data-testid="panel-pandit-benefits"
            >
              <img
                src="/attached_assets/heroes/hero-scene-pandit.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#281016] via-[#4A1A22]/75 to-[#4A1A22]/10" />
              <div className={`relative flex flex-col justify-between p-5 text-white sm:p-7 ${mode === "signup" ? "min-h-[16rem] lg:min-h-[18rem]" : "min-h-[25rem] lg:min-h-[40rem]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#F0D276]/50 bg-[#2D1117]/45 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#F0D276]">
                    {copy.benefitsEyebrow}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
                    <ShieldCheck className="h-4 w-4 text-[#F0D276]" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-16">
                  <h2 id="pandit-benefits-heading" className="max-w-[28rem] font-serif text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#FFF8E9]">
                    {copy.benefitsTitle}
                  </h2>
                  <p className="mt-3 max-w-[27rem] text-sm leading-6 text-white/80">
                    {copy.benefitsDescription}
                  </p>

                  <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm" data-testid="card-pandit-benefit-verified">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#F0D276]" aria-hidden="true" />
                      <span className="text-[11px] font-semibold text-white/90">{copy.benefitVerified}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm" data-testid="card-pandit-benefit-bookings">
                      <CalendarCheck className="h-4 w-4 shrink-0 text-[#F0D276]" aria-hidden="true" />
                      <span className="text-[11px] font-semibold text-white/90">{copy.benefitBookings}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm" data-testid="card-pandit-benefit-tools">
                      <Monitor className="h-4 w-4 shrink-0 text-[#F0D276]" aria-hidden="true" />
                      <span className="text-[11px] font-semibold text-white/90">{copy.benefitTools}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="button"
                      onClick={openDemo}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F0D276] px-4 text-[11px] font-extrabold text-[#4A1A22] shadow-[0_10px_24px_rgba(0,0,0,.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      data-testid="btn-pandit-demo"
                    >
                      <PlayCircle className="h-4 w-4" aria-hidden="true" />
                      {copy.exploreDemo}
                    </button>
                    <Link href="/become-pandit" className="inline-flex items-center gap-1 text-[11px] font-bold text-white/75 underline decoration-white/35 underline-offset-4 hover:text-white">
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy.fullStory}
                    </Link>
                  </div>
                </div>
              </div>
            </section>}

          {mode === "signup" ? (
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[#D4AF37]/35 bg-[#FFFAF1] px-4 py-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#A67817]">Complete registration</p>
                  <p className="mt-1 text-xs text-[#806F5E]">Submit your full Panditji application from this page.</p>
                </div>
                <button type="button" onClick={() => setMode("login")} className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#6F2B38] hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> {copy.backToLogin}
                </button>
              </div>
              <RegistrationSection
                form={registrationForm}
                photoPreview={registrationPhotoPreview}
                onChange={handleRegistrationChange}
                onPhotoChange={handleRegistrationPhotoChange}
                onPhotoRemove={() => {
                  setRegistrationPhotoFile(null);
                  setRegistrationPhotoPreview(null);
                  setRegistrationPhotoError("");
                }}
                photoError={registrationPhotoError}
                locationError={registrationLocationError}
                servicesError={registrationServicesError}
                applicationError={registrationApplicationError}
                requestExactLocation={requestRegistrationExactLocation}
                missingCityMode={registrationMissingCityMode}
                setMissingCityMode={setRegistrationMissingCityMode}
                onSubmit={handleRegistrationSubmit}
                setForm={setRegistrationForm}
                isPending={registrationMutation.isPending}
              />
            </div>
          ) : (
          <Card className="overflow-hidden rounded-[1.5rem] border border-[#6D2B35]/15 bg-white/70 shadow-[0_22px_65px_rgba(77,40,36,.12)] backdrop-blur lg:self-start">
            <div className="h-1.5 bg-gradient-to-r from-[#B98117] via-[#F0D276] to-[#B98117]" />
            <CardContent className="p-6 sm:p-9">
              <div className="mb-6 flex items-start gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F1DFB5] text-xl text-[#7F5A15]">
                  {mode === "signup" ? <UserRound className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#A67817]">{copy.workspace}</p>
                  {mode === "signup" && (
                    <h1 className="font-serif text-[2rem] font-semibold leading-[1.04] tracking-[-.04em] text-[#4A1A22]" data-testid="text-pandit-login-title">
                      {copy.signupTitle}
                    </h1>
                  )}
                  <p className="mt-2 text-xs leading-5 text-[#806F5E]">
                    {mode === "signup" ? copy.signupDescription : copy.loginDescription}
                  </p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-[13px] bg-[#F4EADB] p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-[10px] px-2 py-2.5 text-xs font-bold transition-colors ${mode === "login" ? "bg-[#FFFAF1] text-[#55252D] shadow-sm" : "text-[#806F5E] hover:bg-white/60"}`}
                  aria-pressed={mode === "login"}
                >
                  {copy.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-[10px] px-2 py-2.5 text-xs font-bold transition-colors ${mode === "signup" ? "bg-[#FFFAF1] text-[#55252D] shadow-sm" : "text-[#806F5E] hover:bg-white/60"}`}
                  aria-pressed={mode === "signup"}
                >
                  {copy.apply}
                </button>
              </div>

              <div className="mb-5 flex items-center gap-3 rounded-[14px] border border-[#E2C98E] bg-[#F5E8CF] p-3 text-left">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#6F2B38] text-lg text-[#FFF8E9]">↓</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[#704D12]">{copy.keepClose}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#896F43]">{copy.installDescription}</p>
                </div>
                <PanditPwaInstallButton />
              </div>

              {mode === "signup" ? (
                <form className="grid gap-4" onSubmit={submitSignup}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="signup-full-name" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.name}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <UserRound className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="signup-full-name" required autoComplete="name" placeholder={hindi ? "उदा. पंडित रमेश शर्मा" : "e.g. Pandit Ramesh Sharma"} className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={signup.fullName} onChange={(event) => updateSignup("fullName", event.target.value)} data-testid="input-pandit-signup-name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-phone" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.registeredPhone}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Phone className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="signup-phone" required inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={signup.phone} onChange={(event) => updateSignup("phone", event.target.value)} data-testid="input-pandit-signup-phone" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-email" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.email}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Mail className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="signup-email" required type="email" autoComplete="email" placeholder="pandit@example.com" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={signup.email} onChange={(event) => updateSignup("email", event.target.value)} data-testid="input-pandit-signup-email" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-state" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.state}</Label>
                      <select
                        id="signup-state"
                        required
                        value={signup.stateId}
                        onChange={(event) => {
                          setSignup((current) => ({ ...current, stateId: event.target.value, cityId: "" }));
                        }}
                        disabled={locationsLoading || Boolean(locationsError)}
                        className="h-12 w-full rounded-xl border border-[#DDCFBC] bg-white/80 px-3 text-sm text-[#4A1A22] outline-none transition focus:border-[#A67817] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                        data-testid="select-pandit-signup-state"
                      >
                        <option value="">{locationsLoading ? copy.locationsLoading : copy.chooseState}</option>
                        {activeStates.map((state) => (
                          <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="signup-city" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.city}</Label>
                      <select
                        id="signup-city"
                        required
                        value={signup.cityId}
                        onChange={(event) => updateSignup("cityId", event.target.value)}
                        disabled={!signup.stateId || locationsLoading || Boolean(locationsError)}
                        className="h-12 w-full rounded-xl border border-[#DDCFBC] bg-white/80 px-3 text-sm text-[#4A1A22] outline-none transition focus:border-[#A67817] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60"
                        data-testid="select-pandit-signup-city"
                      >
                        <option value="">{signup.stateId ? copy.chooseCity : copy.chooseState}</option>
                        {activeCities.map((city) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="signup-experience" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.experience}</Label>
                      <Input id="signup-experience" required type="number" min="0" inputMode="numeric" placeholder="5" className="h-12 rounded-xl border-[#DDCFBC] bg-white/80 text-sm focus-visible:border-[#A67817] focus-visible:ring-[#D4AF37]/20" value={signup.experience} onChange={(event) => updateSignup("experience", event.target.value)} data-testid="input-pandit-signup-experience" />
                    </div>
                    <fieldset className="sm:col-span-2">
                      <legend className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.languages}</legend>
                      <div className="rounded-xl border border-[#DDCFBC] bg-white/80 p-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          {SUPPORTED_PANDIT_LANGUAGES.map((supportedLanguage) => {
                            const checked = signup.languages.includes(supportedLanguage);
                            return (
                              <label key={supportedLanguage} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors ${checked ? "border-[#A67817] bg-[#FFF4D9] text-[#55252D]" : "border-transparent text-[#806F5E] hover:border-[#DDCFBC] hover:bg-[#FFFAF1]"}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSignupLanguage(supportedLanguage)}
                                  className="h-3.5 w-3.5 accent-[#6F2B38]"
                                  data-testid={`checkbox-pandit-language-${supportedLanguage.toLowerCase()}`}
                                />
                                {supportedLanguage}
                              </label>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[10px] leading-4 text-[#806F5E]">{copy.languageHint}</p>
                      </div>
                    </fieldset>
                    {locationsError && (
                      <div className="sm:col-span-2 rounded-[13px] border border-[#B85C4A]/30 bg-[#FFF1EC] p-3 text-[10px] leading-4 text-[#8F3F31]" role="alert" data-testid="alert-pandit-signup-locations">
                        {copy.locationsError}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-2.5 rounded-[13px] border border-[#D4AF37]/30 bg-[#FFFAF1] p-3 text-[10px] leading-[1.5] text-[#806F5E]">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6F2B38]" />
                    <span>{copy.profileStep}</span>
                  </div>
                  <Button type="submit" className="h-12 rounded-xl bg-[#6F2B38] text-sm font-extrabold text-[#FFF8E9] shadow-[0_9px_20px_rgba(111,43,56,.18)] hover:bg-[#55252D]" data-testid="btn-pandit-signup">
                    {copy.continue}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button type="button" onClick={() => setMode("login")} className="mx-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#6F2B38] hover:underline">
                    <ArrowLeft className="h-3.5 w-3.5" /> {copy.backToLogin}
                  </button>
                </form>
              ) : (
                <>
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submit();
                    }}
                  >
                    <div>
                      <Label htmlFor="p-phone" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.registered}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Phone className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="p-phone" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-pandit-phone" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="p-pass" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.password}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Lock className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="p-pass" type="password" autoComplete="current-password" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-pandit-password" />
                        <span className="text-[10px] font-extrabold text-[#A67817]">PRIVATE</span>
                      </div>
                    </div>
                    <div className="-mt-1 flex justify-end">
                      <Button type="button" variant="link" onClick={() => setShowForgotPassword((value) => !value)} className="h-auto p-0 text-[11px] font-extrabold text-[#8E6418]">{copy.forgot}</Button>
                    </div>
                    {showForgotPassword && (
                      <div className="grid gap-3 rounded-[13px] border border-[#D4AF37]/35 bg-white p-3.5">
                        <p className="text-[10px] leading-4 text-[#806F5E]">{hindi ? "अपने स्वीकृत पंडित खाते में पंजीकृत मोबाइल और ईमेल दर्ज करें।" : "Enter the phone and email registered on your approved Pandit account."}</p>
                        <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#DDCFBC] px-3">
                          <Mail className="h-4 w-4 shrink-0 text-[#806F5E]" />
                          <Input type="email" autoComplete="email" placeholder="Registered email" className="h-auto border-0 p-0 text-sm shadow-none focus-visible:ring-0" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
                        </div>
                        <Button type="button" variant="outline" onClick={requestPasswordReset} disabled={resetLoading} className="h-11 rounded-xl border-[#6F2B38] text-xs font-extrabold text-[#6F2B38]">{resetLoading ? "Sending..." : hindi ? "रीसेट लिंक ईमेल करें" : "Email password reset link"}</Button>
                      </div>
                    )}
                    <Button type="submit" disabled={loading} className="h-12 rounded-xl bg-[#6F2B38] text-sm font-extrabold text-[#FFF8E9] shadow-[0_9px_20px_rgba(111,43,56,.18)] hover:bg-[#55252D]" data-testid="btn-pandit-login">
                      {loading ? hindi ? "साइन इन हो रहा है..." : "Signing in..." : copy.signInCta}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                  <div className="mt-4 flex items-start gap-2.5 rounded-[13px] border border-[#D4AF37]/30 bg-[#FFFAF1] p-3 text-[10px] leading-[1.45] text-[#806F5E]">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6F2B38]" />
                    <span><strong className="text-[#4A1A22]">{copy.firstLogin}</strong> {copy.firstLoginDescription}</span>
                  </div>
                  <div id="pandit-demo" className="mt-5 rounded-[15px] border border-dashed border-[#A67817]/55 bg-gradient-to-br from-[#FFFAF1] to-[#FFF4D9] p-3.5">
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#4A1A22]"><PlayCircle className="h-4 w-4 text-[#6F2B38]" />{copy.demoTitle}</div>
                    <p className="mt-2 text-[10px] leading-[1.45] text-[#806F5E]">{copy.demoDescription}</p>
                    <div className="my-3 grid grid-cols-2 gap-2">
                      <div className="rounded-[10px] border border-[#D4AF37]/30 bg-white p-2.5"><div className="mb-1 text-[9px] uppercase tracking-[.08em] text-[#9B8A7C]">Phone</div><div className="font-mono text-[10px] font-semibold text-[#4A1A22]" data-testid="text-demo-phone">{DEMO_PHONE}</div></div>
                      <div className="rounded-[10px] border border-[#D4AF37]/30 bg-white p-2.5"><div className="mb-1 text-[9px] uppercase tracking-[.08em] text-[#9B8A7C]">Password</div><div className="font-mono text-[10px] font-semibold text-[#4A1A22]" data-testid="text-demo-password">{DEMO_PASS}</div></div>
                    </div>
                    <Button type="button" variant="outline" onClick={fillDemo} className="h-10 w-full rounded-xl border-[#6F2B38] text-[10px] font-extrabold text-[#6F2B38] hover:bg-[#6F2B38]/5" data-testid="btn-fill-demo"><Copy className="mr-1.5 h-3.5 w-3.5" />{copy.fillDemo}</Button>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-[10px] leading-4 text-[#806F5E]"><span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#6F2B38] text-[10px] text-[#FFF8E9]">✓</span><span>{copy.secure}</span></div>
                  <p className="mt-5 text-center text-[11px] text-[#806F5E]">{copy.newTo}{" "}<button type="button" onClick={() => setMode("signup")} className="font-extrabold text-[#6F2B38] hover:underline">{copy.applyAs}</button></p>
                </>
              )}
            </CardContent>
          </Card>
          )}
          </div>
          <p className="px-1 pt-3 text-center text-[9px] leading-4 text-[#9B8A7C]">{copy.privacy}</p>
        </div>
      </div>
    </main>
  );
}