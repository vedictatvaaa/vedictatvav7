export type PartnerProvider = {
  id: "pandit" | "astrologer";
  label: string;
  description: string;
  destination?: string;
  active: boolean;
};

export const partnerProviders: readonly PartnerProvider[] = [
  {
    id: "pandit",
    label: "Pandit",
    description: "Offer Puja and spiritual services to devotees through Vedic Tatva.",
    destination: "/pandit/login",
    active: true,
  },
  {
    id: "astrologer",
    label: "Astrologer",
    description: "Offer astrology consultations and guidance to devotees.",
    active: false,
  },
];

export const activePartnerProviders = partnerProviders.filter((provider) => provider.active);