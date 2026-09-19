import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { consumePanditCorrectionToken } from "@/lib/pandit-correction-token";

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  phone: "Phone number",
  email: "Email address",
  registeredAddress: "Registered address",
  yearsExperience: "Years of experience",
  education: "Vedic education or training",
  languages: "Languages",
  bio: "Profile biography",
  serviceArea: "Service area",
  regionalOrigin: "Regional origin",
  masterServiceIds: "Specialist Pujas",
  photo: "Profile photo",
};

const TEXT_FIELDS = new Set(["fullName", "phone", "email", "registeredAddress", "education", "languages", "bio", "serviceArea", "regionalOrigin"]);

type CorrectionResponse = {
  requestedFields: string[];
  explanation: string;
  expiresAt: string;
  values: Record<string, unknown>;
};

type MasterService = { id: number; name: string; category?: string; serviceType?: string };

function fieldValue(values: Record<string, unknown>, field: string): string {
  const value = values[field];
  return value == null ? "" : String(value);
}

export default function PanditApplicationCorrections() {
  const [token, setToken] = useState("");
  const [request, setRequest] = useState<CorrectionResponse | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const masterServices = useQuery<MasterService[]>({
    queryKey: ["/api/public/master-services"],
    enabled: Boolean(request?.requestedFields.includes("masterServiceIds")),
    queryFn: async () => {
      const response = await fetch("/api/public/master-services");
      if (!response.ok) throw new Error("Specialist Pujas could not be loaded.");
      return response.json();
    },
  });

  const requestedFields = useMemo(
    () => (request?.requestedFields || []).filter((field) => Object.prototype.hasOwnProperty.call(FIELD_LABELS, field)),
    [request],
  );

  useEffect(() => {
    const fragmentToken = consumePanditCorrectionToken();
    setToken(fragmentToken);
    if (!fragmentToken) {
      setLoading(false);
      setError("This correction link is missing or invalid.");
      return;
    }
    fetch("/api/pandit-application-corrections", {
      headers: { "x-pandit-correction-token": fragmentToken },
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || "This correction link is expired or has already been used.");
        return body as CorrectionResponse;
      })
      .then((body) => {
        setRequest(body);
        setValues(body.values || {});
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const updateValue = (field: string, value: unknown) => {
    setValues((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  };

  const toggleService = (serviceId: number) => {
    const current = Array.isArray(values.masterServiceIds) ? values.masterServiceIds as number[] : [];
    updateValue("masterServiceIds", current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    const formData = new FormData();
    formData.append("photo", photoFile);
    const response = await fetch("/api/pandit-applications/upload-photo", { method: "POST", body: formData });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.url) throw new Error(body.message || "Profile photo upload failed.");
    return body.url as string;
  };

  const save = async (finalSubmit: boolean) => {
    if (!token || !request || saving || resubmitting) return;
    setError("");
    setMessage("");
    finalSubmit ? setResubmitting(true) : setSaving(true);
    let uploadedPhoto = "";
    let patchSaved = false;
    try {
      if (request.requestedFields.includes("photo")) {
        uploadedPhoto = (await uploadPhoto()) || "";
        if (!uploadedPhoto && !fieldValue(values, "photo")) throw new Error("Choose a new profile photo.");
      }
      const patchValues: Record<string, unknown> = {};
      for (const field of requestedFields) {
        if (field === "photo" && uploadedPhoto) patchValues.photo = uploadedPhoto;
        else if (field === "yearsExperience") patchValues.yearsExperience = Number(values.yearsExperience);
        else patchValues[field] = values[field];
      }
      const patch = await fetch("/api/pandit-application-corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-pandit-correction-token": token },
        body: JSON.stringify(patchValues),
      });
      const patchBody = await patch.json().catch(() => ({}));
      if (!patch.ok) throw new Error(patchBody.message || "Your corrections could not be saved.");
      patchSaved = true;
      if (finalSubmit) {
        const response = await fetch("/api/pandit-application-corrections/resubmit", {
          method: "POST",
          headers: { "x-pandit-correction-token": token },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || "Your application could not be resubmitted.");
        setRequest(null);
        setMessage("Your corrected application has been resubmitted for review.");
      } else {
        setMessage("Corrections saved. Review them carefully, then choose Resubmit.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
      if (uploadedPhoto && !patchSaved) {
        fetch("/api/pandit-applications/upload-photo", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: uploadedPhoto }),
        }).catch(() => undefined);
      }
    } finally {
      setSaving(false);
      setResubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF7EE] px-4 py-10 text-[#3D2418] sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B8941F]">Vedic Tatva · Panditji network</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-[#6D2B35] sm:text-4xl">Complete your requested corrections</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6B5856]">Our review team has asked for a few updates. You can edit only those requested details; your original application remains attached to this review.</p>
        </div>

        {loading && <Card><CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-[#6B5856]"><Loader2 className="h-5 w-5 animate-spin" /> Loading your secure correction request…</CardContent></Card>}
        {!loading && error && <Card className="border-red-200"><CardContent className="flex items-start gap-3 p-6 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p>{error}</p></CardContent></Card>}
        {!loading && request && (
          <Card className="border-[#D4AF37]/35 shadow-sm">
            <CardHeader className="border-b border-[#D4AF37]/20 bg-[#FEFAF1]">
              <CardTitle className="font-serif text-xl text-[#6D2B35]">Review team message</CardTitle>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#6B5856]">{request.explanation}</p>
              <p className="text-xs text-[#8B6F68]">Please complete this request by {new Date(request.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.</p>
            </CardHeader>
            <CardContent className="space-y-6 p-5 sm:p-8">
              {requestedFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`correction-${field}`}>{FIELD_LABELS[field]}</Label>
                  {field === "bio" ? (
                    <Textarea id={`correction-${field}`} value={fieldValue(values, field)} onChange={(event) => updateValue(field, event.target.value)} className="min-h-32" />
                  ) : field === "yearsExperience" ? (
                    <Input id={`correction-${field}`} type="number" min="0" max="100" value={fieldValue(values, field)} onChange={(event) => updateValue(field, event.target.value)} />
                  ) : field === "masterServiceIds" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {masterServices.isLoading && <p className="text-sm text-[#6B5856]">Loading specialist Pujas…</p>}
                      {masterServices.data?.filter((service) => ["puja", "katha", "ritual"].includes(service.serviceType || "")).map((service) => {
                        const checked = Array.isArray(values.masterServiceIds) && (values.masterServiceIds as number[]).includes(service.id);
                        return <label key={service.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${checked ? "border-[#6D2B35] bg-[#6D2B35]/5" : "border-[#E7DDC7]"}`}><input type="checkbox" checked={checked} onChange={() => toggleService(service.id)} className="mt-1 accent-[#6D2B35]" />{service.name}</label>;
                      })}
                    </div>
                  ) : field === "photo" ? (
                    <div className="space-y-3">
                      <Input id={`correction-${field}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setPhotoFile(file);
                        setPhotoPreview(file ? URL.createObjectURL(file) : "");
                      }} className="file:mr-3 file:rounded file:border-0 file:bg-[#6D2B35] file:px-3 file:py-1 file:text-white" />
                      {photoPreview && <img src={photoPreview} alt="Selected profile preview" className="h-24 w-24 rounded-lg object-cover" />}
                      <p className="text-xs text-[#8B6F68]">JPG, PNG, or WebP up to 5 MB.</p>
                    </div>
                  ) : (
                    <Input id={`correction-${field}`} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} value={fieldValue(values, field)} onChange={(event) => updateValue(field, event.target.value)} />
                  )}
                  {!TEXT_FIELDS.has(field) && field !== "masterServiceIds" && field !== "photo" && <p className="text-xs text-[#8B6F68]">Use the format requested by the review team.</p>}
                </div>
              ))}

              {message && <div role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}
              {error && <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
              <div className="flex flex-col gap-3 border-t border-[#E7DDC7] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => save(false)} disabled={saving || resubmitting} className="min-h-11 border-[#6D2B35]/30 text-[#6D2B35]">{saving ? "Saving…" : "Save corrections"}</Button>
                <Button type="button" onClick={() => save(true)} disabled={saving || resubmitting} className="min-h-11 bg-[#6D2B35] text-white hover:bg-[#4A1D24]">{resubmitting ? "Resubmitting…" : "Save & resubmit for review"}</Button>
              </div>
              <p className="text-center text-xs text-[#8B6F68]">Your secure link is single-use after resubmission. We never ask for your password here.</p>
            </CardContent>
          </Card>
        )}
        {!loading && !request && !error && <Card><CardContent className="p-8 text-center text-sm text-[#6B5856]">Your corrections have been received. Our team will review them shortly.</CardContent></Card>}
      </div>
    </main>
  );
}