import type { Pandit } from "@shared/schema";

type VerificationPandit = Pick<Pandit,
  "verified" | "registrationNo" | "name" | "image" | "specialization" |
  "languages" | "experience" | "city" | "state" | "registrationAssignedAt" | "slug"
>;

export function panditVerificationDto(pandit: VerificationPandit) {
  if (!pandit.verified) {
    return {
      status: "inactive" as const,
      registrationNo: pandit.registrationNo!,
    };
  }
  return {
    status: "verified" as const,
    registrationNo: pandit.registrationNo!,
    name: pandit.name,
    image: pandit.image,
    specialization: pandit.specialization,
    languages: pandit.languages,
    experience: pandit.experience,
    city: pandit.city,
    state: pandit.state,
    registrationAssignedAt: pandit.registrationAssignedAt,
    lifetimeMembership: true as const,
    profilePath: pandit.slug ? `/pandit/${encodeURIComponent(pandit.slug)}` : null,
  };
}