import { storage } from "./storage";

const DEFAULT_MASTER_SERVICES = [
  { name: "Griha Pravesh Puja", slug: "griha-pravesh-puja", category: "Home ceremonies", description: "Traditional house-warming puja for a new home.", serviceType: "puja", supportedModes: ["in_person"], onlineAvailable: false, physicalAvailable: true, minRate: 11000, maxRate: 31000, defaultDurationMinutes: 180 },
  { name: "Satyanarayan Katha", slug: "satyanarayan-katha", category: "Family ceremonies", description: "Vishnu puja and katha for family wellbeing and gratitude.", serviceType: "katha", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true, minRate: 5100, maxRate: 15000, defaultDurationMinutes: 150 },
  { name: "Ganesh Puja", slug: "ganesh-puja", category: "Daily and festival pujas", description: "Ganapati worship for auspicious beginnings and obstacle removal.", serviceType: "puja", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true, minRate: 3100, maxRate: 11000, defaultDurationMinutes: 90 },
  { name: "Rudrabhishek", slug: "rudrabhishek", category: "Shiva pujas", description: "Traditional abhishek and mantra recitation dedicated to Lord Shiva.", serviceType: "puja", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true, minRate: 5100, maxRate: 21000, defaultDurationMinutes: 120 },
  { name: "Lakshmi Puja", slug: "lakshmi-puja", category: "Prosperity pujas", description: "Traditional Lakshmi worship for prosperity and wellbeing.", serviceType: "puja", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true, minRate: 5100, maxRate: 15000, defaultDurationMinutes: 120 },
  { name: "Navgraha Shanti Puja", slug: "navgraha-shanti-puja", category: "Graha shanti", description: "Puja and mantra recitation for the nine planetary deities.", serviceType: "puja", supportedModes: ["in_person"], onlineAvailable: false, physicalAvailable: true, minRate: 11000, maxRate: 31000, defaultDurationMinutes: 240 },
  { name: "Mahamrityunjaya Jaap", slug: "mahamrityunjaya-jaap", category: "Jaap and anushthan", description: "Guided or performed Mahamrityunjaya mantra jaap.", serviceType: "ritual", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true, minRate: 21000, maxRate: 51000, defaultDurationMinutes: 360 },
  { name: "Vedic Consultation", slug: "vedic-consultation", category: "Consultations", description: "A private consultation about the appropriate puja or ritual.", serviceType: "consultation", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
] as const;

const ADDITIONAL_CANONICAL_PUJAS = [
  ["Durga Puja", "durga-puja", "Devi pujas", "puja"],
  ["Saraswati Puja", "saraswati-puja", "Devi pujas", "puja"],
  ["Vishnu Puja", "vishnu-puja", "Vishnu pujas", "puja"],
  ["Shiva Puja", "shiva-puja", "Shiva pujas", "puja"],
  ["Hanuman Puja", "hanuman-puja", "Deity pujas", "puja"],
  ["Krishna Puja", "krishna-puja", "Deity pujas", "puja"],
  ["Ram Puja", "ram-puja", "Deity pujas", "puja"],
  ["Navratri Puja", "navratri-puja", "Festival pujas", "puja"],
  ["Diwali Lakshmi Ganesh Puja", "diwali-lakshmi-ganesh-puja", "Festival pujas", "puja"],
  ["Dhanvantari Puja", "dhanvantari-puja", "Wellness pujas", "puja"],
  ["Annapurna Puja", "annapurna-puja", "Devi pujas", "puja"],
  ["Tulsi Vivah Puja", "tulsi-vivah-puja", "Family ceremonies", "puja"],
  ["Vastu Shanti Puja", "vastu-shanti-puja", "Home ceremonies", "puja"],
  ["Bhoomi Puja", "bhoomi-puja", "Home ceremonies", "puja"],
  ["Lakshmi Narayan Puja", "lakshmi-narayan-puja", "Prosperity pujas", "puja"],
  ["Kubera Puja", "kubera-puja", "Prosperity pujas", "puja"],
  ["Shani Shanti Puja", "shani-shanti-puja", "Graha shanti", "puja"],
  ["Mangal Dosha Puja", "mangal-dosha-puja", "Graha shanti", "puja"],
  ["Kaal Sarp Dosh Nivaran", "kaal-sarp-dosh-nivaran", "Graha shanti", "ritual"],
  ["Pitra Dosh Nivaran", "pitra-dosh-nivaran", "Graha shanti", "ritual"],
  ["Grahan Shanti Puja", "grahan-shanti-puja", "Graha shanti", "puja"],
  ["Sunderkand Path", "sunderkand-path", "Path and katha", "katha"],
  ["Hanuman Chalisa Path", "hanuman-chalisa-path", "Path and katha", "katha"],
  ["Bhagwat Katha", "bhagwat-katha", "Path and katha", "katha"],
  ["Ram Katha", "ram-katha", "Path and katha", "katha"],
  ["Devi Bhagwat Katha", "devi-bhagwat-katha", "Path and katha", "katha"],
  ["Shiv Mahapuran Katha", "shiv-mahapuran-katha", "Path and katha", "katha"],
  ["Durga Saptashati Path", "durga-saptashati-path", "Path and katha", "katha"],
  ["Garuda Purana Path", "garuda-purana-path", "Path and katha", "katha"],
  ["Shanti Path", "shanti-path", "Path and katha", "katha"],
  ["Naamkaran Sanskar", "naamkaran-sanskar", "Life ceremonies", "ritual"],
  ["Annaprashan Sanskar", "annaprashan-sanskar", "Life ceremonies", "ritual"],
  ["Mundan Sanskar", "mundan-sanskar", "Life ceremonies", "ritual"],
  ["Upanayan Sanskar", "upanayan-sanskar", "Life ceremonies", "ritual"],
  ["Vivah Sanskar", "vivah-sanskar", "Life ceremonies", "ritual"],
  ["Griha Shanti Havan", "griha-shanti-havan", "Havan and yagya", "ritual"],
  ["Navchandi Yagya", "navchandi-yagya", "Havan and yagya", "ritual"],
  ["Maha Ganapati Havan", "maha-ganapati-havan", "Havan and yagya", "ritual"],
  ["Rudra Havan", "rudra-havan", "Havan and yagya", "ritual"],
  ["Lakshmi Havan", "lakshmi-havan", "Havan and yagya", "ritual"],
  ["Navgraha Havan", "navgraha-havan", "Havan and yagya", "ritual"],
  ["Agnihotra Havan", "agnihotra-havan", "Havan and yagya", "ritual"],
  ["New Business Puja", "new-business-puja", "Business ceremonies", "puja"],
  ["Shop Opening Puja", "shop-opening-puja", "Business ceremonies", "puja"],
  ["Vehicle Puja", "vehicle-puja", "Milestone pujas", "puja"],
] as const;

const CANONICAL_PUJAS = ADDITIONAL_CANONICAL_PUJAS.map(([name, slug, category, serviceType]) => ({
  name,
  slug,
  category,
  description: `${name} performed according to traditional Vedic practice.`,
  serviceType,
  supportedModes: ["in_person", "online"],
  onlineAvailable: true,
  physicalAvailable: true,
  minRate: 3100,
  maxRate: 21000,
  defaultDurationMinutes: 120,
}));

export async function seedMasterServices() {
  for (const service of [...DEFAULT_MASTER_SERVICES, ...CANONICAL_PUJAS]) {
    if (await storage.getMasterServiceBySlug(service.slug)) continue;
    try {
      await storage.createMasterService({
        ...service,
        supportedModes: Array.from(service.supportedModes),
        isActive: true,
      });
    } catch (error: any) {
      if (error?.code !== "23505") throw error;
    }
  }
}