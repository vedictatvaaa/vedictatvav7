import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Hand,
  Camera,
  Sparkles,
  Heart,
  Brain,
  Activity,
  Sun,
  Star,
  TrendingUp,
  Gem,
  Palette,
  Hash,
  Shield,
  Lightbulb,
  Eye,
  Loader2,
  CheckCircle,
  Fingerprint,
  Crown,
  Briefcase,
  Stethoscope,
  Coins,
  Flower2,
} from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { RelatedServicesSection } from "@/components/RelatedServices";

interface PalmLine {
  name: string;
  description: string;
  interpretation: string;
  strength: "strong" | "moderate" | "weak" | "absent";
}

interface Mount {
  name: string;
  development: string;
  meaning: string;
}

interface FingerAnalysis {
  finger: string;
  analysis: string;
}

interface Prediction {
  category: string;
  prediction: string;
}

interface PalmReadingReport {
  overallSummary: string;
  personalityProfile: string;
  mainLines: PalmLine[];
  mounts: Mount[];
  fingerAnalysis: FingerAnalysis[];
  specialMarkings: string[];
  predictions: Prediction[];
  luckyElements: {
    gemstone: string;
    color: string;
    number: string;
  };
  recommendations: string[];
}

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] disabled:opacity-50 disabled:cursor-not-allowed rounded-md h-10 px-5 text-[13px] font-semibold transition-colors";

const FIELD_INPUT =
  "w-full h-10 rounded-md border border-[#D4AF37]/30 bg-white px-3 text-[13px] text-[#5a4a3a] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:border-[#6D2B35] focus:ring-1 focus:ring-[#6D2B35]/30 transition-colors";

const FIELD_LABEL =
  "block text-[10px] uppercase tracking-[0.18em] font-semibold text-[#5a4a3a]/70 mb-1.5";

const lineIcons: Record<string, typeof Heart> = {
  Heart,
  Head: Brain,
  Life: Activity,
  Fate: Star,
  Sun,
};

const strengthConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  strong: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Strong" },
  moderate: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Moderate" },
  weak: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", label: "Weak" },
  absent: { bg: "bg-[#FBF7EE]", border: "border-[#D4AF37]/25", text: "text-[#5a4a3a]/60", label: "Absent" },
};

const predictionIcons: Record<string, typeof Heart> = {
  love: Heart,
  career: Briefcase,
  health: Stethoscope,
  wealth: Coins,
  spiritual: Flower2,
};

export default function AIPalmReading() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [hand, setHand] = useState("right");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [report, setReport] = useState<PalmReadingReport | null>(null);

  // Resize a photo to ≤1280px on the long edge as JPEG q=0.85.
  // Keeps payload well under the 1 MB JSON limit and speeds OpenAI vision.
  const resizeImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round(height * (MAX / width)); width = MAX; }
          else { width = Math.round(width * (MAX / height)); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      setImagePreview(dataUrl);
      setImageDataUrl(dataUrl);
    } catch (err: any) {
      toast({
        title: "Could not load image",
        description: err?.message || "Please try a different image.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const palmMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { image: imageDataUrl, hand };
      if (fullName) body.fullName = fullName;
      if (gender) body.gender = gender;
      if (age) body.age = parseInt(age);
      const res = await apiRequest("/api/ai/palm-reading", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res as PalmReadingReport;
    },
    onSuccess: (data) => {
      setReport(data);
      toast({ title: "Palm Reading Complete!", description: "Your detailed analysis is ready." });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze your palm. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="w-full pb-16 bg-[#FBF7EE]" data-testid="palm-reading-page">
      {/* Hero */}
      <section className="relative bg-[#6D2B35] border-b border-[#D4AF37]/30 py-12 md:py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-8 bg-[#D4AF37]/60" />
              <Hand className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              <span className="h-px w-8 bg-[#D4AF37]/60" />
            </div>
            <span
              className="inline-block text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold mb-3"
              data-testid="badge-free"
            >
              Free · Hast Rekha Shastra
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-white mb-3 leading-tight" data-testid="heading-title">
              AI Palm Reading
            </h1>
            <p className="text-white/70 text-[13px] md:text-sm leading-relaxed max-w-xl mx-auto" data-testid="text-subtitle">
              The ancient Vedic wisdom of <span className="text-[#D4AF37] font-medium">Hast Rekha Shastra</span> —
              AI-powered analysis of your palm lines, mounts, and markings for deep life insights.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-10">
        {/* Upload Section */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6 md:p-8" data-testid="card-upload">
            <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-1 text-center">Upload Your Palm Image</h2>
            <p className="text-[12px] text-[#5a4a3a]/60 text-center mb-6">JPG · PNG · WebP — processed instantly, never stored</p>

            {/* Drop Zone */}
            <div
              className={`relative border border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
                imagePreview
                  ? "border-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-[#D4AF37]/40 hover:border-[#6D2B35]/60 hover:bg-[#FBF7EE]"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              data-testid="dropzone-upload"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file"
              />
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Palm preview"
                    className="max-h-64 mx-auto rounded-md object-contain border border-[#D4AF37]/20"
                    data-testid="img-preview"
                  />
                  <p className="text-[12px] text-[#5a4a3a]/60">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-3 py-3">
                  <div className="w-12 h-12 mx-auto rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#6D2B35]/70" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[13px] text-[#5a4a3a] font-medium">Click to upload or drag &amp; drop</p>
                    <p className="text-[11px] text-[#5a4a3a]/50 mt-0.5">JPG, PNG or WebP</p>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <label className={FIELD_LABEL}>Hand</label>
                <select
                  value={hand}
                  onChange={(e) => setHand(e.target.value)}
                  className={FIELD_INPUT}
                  data-testid="select-hand"
                >
                  <option value="right">Right Hand</option>
                  <option value="left">Left Hand</option>
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL}>Full Name (optional)</label>
                <input
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={FIELD_INPUT}
                  data-testid="input-fullname"
                />
              </div>
              <div>
                <label className={FIELD_LABEL}>Gender (optional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={FIELD_INPUT}
                  data-testid="select-gender"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL}>Age (optional)</label>
                <input
                  type="number"
                  placeholder="Enter age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={FIELD_INPUT}
                  min={1}
                  max={120}
                  data-testid="input-age"
                />
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-4" data-testid="section-tips">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D2B35] mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.8} /> Tips for Best Results
              </p>
              <ul className="text-[12px] text-[#5a4a3a]/70 space-y-1 leading-relaxed">
                <li>· Ensure good lighting on your palm</li>
                <li>· Spread your fingers slightly apart</li>
                <li>· Take photo of your dominant hand</li>
                <li>· Keep the camera steady and focused</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              className={`${PRIMARY_BTN} w-full mt-6`}
              onClick={() => palmMutation.mutate()}
              disabled={!imageDataUrl || palmMutation.isPending}
              data-testid="btn-analyze"
            >
              {palmMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Reading your palm lines…
                </>
              ) : (
                <>
                  <Hand className="w-4 h-4" strokeWidth={1.8} /> Analyze My Palm
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reading Report */}
        {report && (
          <div className="max-w-5xl mx-auto mt-12 space-y-10" data-testid="section-report">
            {/* Overall Summary */}
            <div className="rounded-md border border-[#D4AF37]/30 bg-white p-6 md:p-8" data-testid="card-summary">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] flex items-center justify-center">
                  <Eye className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
                </div>
                <div>
                  <span className="block text-[#D4AF37] text-[10px] uppercase tracking-[0.28em] font-semibold">Reading</span>
                  <h2 className="text-xl font-serif text-[#6D2B35] leading-tight">Overall Summary</h2>
                </div>
              </div>
              <p className="text-[13px] text-[#5a4a3a] leading-relaxed" data-testid="text-overall-summary">
                {report.overallSummary}
              </p>
              {report.personalityProfile && (
                <div className="mt-4 rounded-md border border-[#D4AF37]/20 bg-[#FBF7EE] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D2B35] mb-1">Personality Profile</p>
                  <p className="text-[12.5px] text-[#5a4a3a]/85 leading-relaxed" data-testid="text-personality">
                    {report.personalityProfile}
                  </p>
                </div>
              )}
            </div>

            {/* Main Lines */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="h-px w-6 bg-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Palm Analysis</span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Main Palm Lines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-main-lines">
                {report.mainLines.map((line, i) => {
                  const strength = strengthConfig[line.strength] || strengthConfig.moderate;
                  const iconKey = line.name.split(" ")[0];
                  const Icon = lineIcons[iconKey] || Activity;
                  return (
                    <div
                      key={i}
                      className="rounded-md border border-[#D4AF37]/25 bg-white p-5 hover:border-[#D4AF37]/50 transition-colors"
                      data-testid={`card-line-${i}`}
                    >
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-[#6D2B35] shrink-0" strokeWidth={1.8} />
                          <h3 className="font-serif text-base text-[#6D2B35] truncate">{line.name}</h3>
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded-md border ${strength.bg} ${strength.border} ${strength.text}`}
                          data-testid={`strength-${i}`}
                        >
                          {strength.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5a4a3a]/70 mb-2 leading-relaxed" data-testid={`desc-line-${i}`}>{line.description}</p>
                      <p className="text-[12.5px] text-[#5a4a3a] leading-relaxed" data-testid={`interp-line-${i}`}>{line.interpretation}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mounts Analysis */}
            {report.mounts && report.mounts.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Mounts Analysis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-mounts">
                  {report.mounts.map((mount, i) => (
                    <div key={i} className="rounded-md border border-[#D4AF37]/25 bg-white p-5" data-testid={`card-mount-${i}`}>
                      <h3 className="font-serif text-base text-[#6D2B35] mb-1">{mount.name}</h3>
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37] border border-[#D4AF37]/30 bg-[#FBF7EE] px-2 py-0.5 rounded-md mb-2">
                        {mount.development}
                      </span>
                      <p className="text-[12.5px] text-[#5a4a3a] leading-relaxed">{mount.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finger Analysis */}
            {report.fingerAnalysis && report.fingerAnalysis.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                  <Hand className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Finger Analysis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-fingers">
                  {report.fingerAnalysis.map((finger, i) => (
                    <div key={i} className="rounded-md border border-[#D4AF37]/25 bg-white p-5" data-testid={`card-finger-${i}`}>
                      <h3 className="font-serif text-base text-[#6D2B35] mb-2">{finger.finger}</h3>
                      <p className="text-[12.5px] text-[#5a4a3a] leading-relaxed">{finger.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Markings */}
            {report.specialMarkings && report.specialMarkings.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Special Markings
                </h2>
                <div className="rounded-md border border-[#D4AF37]/25 bg-white p-5" data-testid="card-special-markings">
                  <ul className="space-y-3">
                    {report.specialMarkings.map((marking, i) => (
                      <li key={i} className="flex items-start gap-3" data-testid={`marking-${i}`}>
                        <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" strokeWidth={1.8} />
                        <span className="text-[12.5px] text-[#5a4a3a] leading-relaxed">{marking}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Predictions */}
            {report.predictions && report.predictions.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Life Predictions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-predictions">
                  {report.predictions.map((pred, i) => {
                    const key = pred.category.toLowerCase();
                    const Icon = predictionIcons[key] || Star;
                    return (
                      <div key={i} className="rounded-md border border-[#D4AF37]/25 bg-white p-5" data-testid={`card-prediction-${i}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
                          </div>
                          <h3 className="font-serif text-base text-[#6D2B35] capitalize">{pred.category}</h3>
                        </div>
                        <p className="text-[12.5px] text-[#5a4a3a] leading-relaxed">{pred.prediction}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lucky Elements */}
            {report.luckyElements && (
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Lucky Elements
                </h2>
                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-md overflow-hidden border border-[#D4AF37]/25 bg-[#D4AF37]/25"
                  data-testid="grid-lucky"
                >
                  <div className="bg-white p-6 text-center" data-testid="card-lucky-gemstone">
                    <Gem className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.8} />
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#5a4a3a]/60 mb-1">Gemstone</p>
                    <p className="text-base font-serif text-[#6D2B35]">{report.luckyElements.gemstone}</p>
                  </div>
                  <div className="bg-white p-6 text-center" data-testid="card-lucky-color">
                    <Palette className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.8} />
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#5a4a3a]/60 mb-1">Lucky Color</p>
                    <p className="text-base font-serif text-[#6D2B35]">{report.luckyElements.color}</p>
                  </div>
                  <div className="bg-white p-6 text-center" data-testid="card-lucky-number">
                    <Hash className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.8} />
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#5a4a3a]/60 mb-1">Lucky Number</p>
                    <p className="text-base font-serif text-[#6D2B35]">{report.luckyElements.number}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#6D2B35] mb-5 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} /> Personalized Recommendations
                </h2>
                <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6" data-testid="card-recommendations">
                  <ul className="space-y-3">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3" data-testid={`recommendation-${i}`}>
                        <span className="w-6 h-6 rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[11px] font-bold text-[#6D2B35]">{i + 1}</span>
                        </span>
                        <span className="text-[12.5px] text-[#5a4a3a] leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <PageAPlusContent
          eyebrow="Why Try AI Palm Reading"
          title="Free AI Palm Reading — Hastrekha Shastra Online"
          intro="Hastrekha Shastra (palmistry) is the ancient Vedic science of reading destiny through the lines, mounts and shapes of your palm. Our AI palm reader analyses your uploaded palm image — identifying the heart line, head line, life line, fate line, sun line, marriage line and the seven mounts — to reveal personality, career, relationships, health and life journey."
          trustBadges={[
            { value: "100%", label: "Free Reading" },
            { value: "AI", label: "Vision Powered" },
            { value: "7", label: "Mounts Analysed" },
            { value: "Private", label: "Image Secure" },
          ]}
          benefits={[
            { icon: Heart, title: "Heart Line — Love & Emotion", body: "Reveals your emotional nature, capacity for love, marriage prospects and relationship patterns through the curve, length and depth of your heart line." },
            { icon: Brain, title: "Head Line — Intellect", body: "Indicates your thinking style, decision-making, intellectual strength, creativity and logical approach to life's challenges." },
            { icon: Activity, title: "Life Line — Vitality", body: "Reveals overall life energy, health constitution, major life events and your inner resilience — contrary to myth, life line does NOT predict lifespan." },
            { icon: Briefcase, title: "Fate & Sun Line — Career", body: "Shows career direction, success potential, fame, recognition and the planetary forces shaping your professional life." },
            { icon: Star, title: "Marriage Line", body: "Insights on marriage timing, number of significant relationships, marital harmony and quality of partnership." },
            { icon: Crown, title: "Seven Mounts Analysis", body: "Mounts of Jupiter (leadership), Saturn (discipline), Sun (creativity), Mercury (communication), Mars (courage), Venus (love), Moon (imagination) — each reveals planetary influence on your life." },
          ]}
          steps={[
            { title: "Capture Your Palm", body: "Take a clear, well-lit photo of your dominant hand (right for right-handed, left for left-handed) — fingers spread, palm fully visible." },
            { title: "Upload Image", body: "Upload the photo securely. Images are processed instantly and never stored on our servers — fully private." },
            { title: "AI Analyses Your Palm", body: "Our AI vision identifies all major lines, mounts, finger shapes and palm characteristics in seconds." },
            { title: "Read Your Reading", body: "Get detailed insights on personality, love, career, finance, health and life path — with planetary remedies for weak areas." },
          ]}
          faqs={[
            { q: "Is AI palm reading really accurate?", a: "Our AI uses computer vision trained on thousands of palm images analysed by expert hastrekha practitioners. It identifies major lines, mounts and shapes with high accuracy. For nuanced interpretation (especially marriage timing or major life decisions), we recommend pairing AI reading with a 1-on-1 consultation with our verified palmistry expert." },
            { q: "Which hand should I read — left or right?", a: "In Vedic palmistry, the dominant hand (right for right-handed people) shows your present and future — the path you're creating. The non-dominant hand (left) shows your past, inherited tendencies and karmic influences. For best results, our AI recommends scanning your dominant hand." },
            { q: "Is the palm image stored or shared?", a: "No — your palm image is processed instantly by our AI and never stored on our servers. Privacy is fundamental. The reading itself is generated server-side and the image is discarded immediately after analysis." },
            { q: "What are the seven mounts in palmistry?", a: "The seven mounts are: Jupiter (below index finger — leadership), Saturn (below middle finger — discipline), Sun/Apollo (below ring finger — creativity), Mercury (below little finger — communication), Mars (two — courage and endurance), Venus (base of thumb — love and vitality) and Moon (opposite Venus — imagination)." },
            { q: "Can palm reading predict death or lifespan?", a: "No — this is the biggest myth about palmistry. The 'life line' does NOT indicate lifespan. It shows life energy, health constitution and major events. A short life line does not mean a short life. Authentic Vedic hastrekha never claims to predict death." },
            { q: "What is the marriage line in palmistry?", a: "Marriage lines are short horizontal lines on the side of the palm below the little finger. Their depth, clarity and number indicate significant relationships, marriage timing and marital harmony. AI reading interprets these alongside the heart line for full relationship analysis." },
            { q: "How does palmistry relate to Vedic astrology?", a: "Both share a common Vedic foundation. The mounts are named after the same planets (grahas) used in Jyotish — Jupiter, Saturn, Sun, Mercury, Mars, Venus, Moon. A strong mount means a strong corresponding planet in your kundli. Palm reading is essentially Vedic astrology made visible on your hand." },
            { q: "Is the AI palm reading free?", a: "Yes — completely free. Upload your palm, get full reading on lines, mounts and life areas without any payment. Premium 1-on-1 consultations with our hastrekha experts are optional add-ons for deeper personalised analysis." },
          ]}
          keywordsBlurb="Free online AI palm reading and hastrekha shastra. Read heart line, head line, life line, fate line, sun line, marriage line and the seven mounts (Jupiter, Saturn, Sun, Mercury, Mars, Venus, Moon). AI hand reading for personality, love, career, marriage, finance, health and life path predictions. Vedic palmistry online in Hindi and English. Hand analysis for left hand and right hand. Discover your destiny through ancient Hindu palmistry — completely free, fully private."
        />

        <RelatedServicesSection context="palm" currentPath="/ai-palm-reading" />
      </div>
    </div>
  );
}
