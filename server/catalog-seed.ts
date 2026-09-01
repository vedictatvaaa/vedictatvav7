import { storage } from "./storage";

const DEFAULT_MASTER_SERVICES = [
  { name: "Griha Pravesh Puja", slug: "griha-pravesh-puja", category: "Home ceremonies", description: "Traditional house-warming puja for a new home.", serviceType: "puja", supportedModes: ["in_person"], onlineAvailable: false, physicalAvailable: true },
  { name: "Satyanarayan Katha", slug: "satyanarayan-katha", category: "Family ceremonies", description: "Vishnu puja and katha for family wellbeing and gratitude.", serviceType: "katha", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
  { name: "Ganesh Puja", slug: "ganesh-puja", category: "Daily and festival pujas", description: "Ganapati worship for auspicious beginnings and obstacle removal.", serviceType: "puja", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
  { name: "Rudrabhishek", slug: "rudrabhishek", category: "Shiva pujas", description: "Traditional abhishek and mantra recitation dedicated to Lord Shiva.", serviceType: "puja", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
  { name: "Lakshmi Puja", slug: "lakshmi-puja", category: "Prosperity pujas", description: "Traditional Lakshmi worship for prosperity and wellbeing.", serviceType: "puja", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
  { name: "Navgraha Shanti Puja", slug: "navgraha-shanti-puja", category: "Graha shanti", description: "Puja and mantra recitation for the nine planetary deities.", serviceType: "puja", supportedModes: ["in_person"], onlineAvailable: false, physicalAvailable: true },
  { name: "Mahamrityunjaya Jaap", slug: "mahamrityunjaya-jaap", category: "Jaap and anushthan", description: "Guided or performed Mahamrityunjaya mantra jaap.", serviceType: "ritual", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
  { name: "Vedic Consultation", slug: "vedic-consultation", category: "Consultations", description: "A private consultation about the appropriate puja or ritual.", serviceType: "consultation", supportedModes: ["in_person", "online"], onlineAvailable: true, physicalAvailable: true },
] as const;

export async function seedMasterServices() {
  for (const service of DEFAULT_MASTER_SERVICES) {
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