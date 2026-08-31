import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { indianCities, indianStates } from "@shared/schema";

type StateSeed = [string, string, boolean, string[]];

// Canonical names and abbreviations are intentionally kept in one place.  The
// city list includes each capital plus the service locations historically used
// by the pandit catalogue.
const LOCATION_SEED: StateSeed[] = [
  ["Andhra Pradesh","AP",false,["Amaravati","Visakhapatnam","Vijayawada","Tirupati"]],
  ["Arunachal Pradesh","AR",false,["Itanagar","Naharlagun"]],["Assam","AS",false,["Dispur","Guwahati","Silchar"]],
  ["Bihar","BR",false,["Patna","Gaya","Muzaffarpur"]],["Chhattisgarh","CG",false,["Raipur","Bilaspur","Bhilai","Durg"]],
  ["Goa","GA",false,["Panaji","Margao","Vasco da Gama"]],["Gujarat","GJ",false,["Gandhinagar","Ahmedabad","Surat","Vadodara","Rajkot"]],
  ["Haryana","HR",false,["Chandigarh","Gurugram","Faridabad","Hisar"]],["Himachal Pradesh","HP",false,["Shimla","Dharamshala","Manali"]],
  ["Jharkhand","JH",false,["Ranchi","Jamshedpur","Dhanbad"]],["Karnataka","KA",false,["Bengaluru","Mysuru","Hubballi","Mangaluru"]],
  ["Kerala","KL",false,["Thiruvananthapuram","Kochi","Kozhikode","Thrissur"]],["Madhya Pradesh","MP",false,["Bhopal","Indore","Jabalpur","Gwalior","Balaghat","Ujjain"]],
  ["Maharashtra","MH",false,["Mumbai","Pune","Nagpur","Nashik","Chhatrapati Sambhajinagar","Thane","Kolhapur","Solapur"]],
  ["Manipur","MN",false,["Imphal"]],["Meghalaya","ML",false,["Shillong"]],["Mizoram","MZ",false,["Aizawl"]],
  ["Nagaland","NL",false,["Kohima","Dimapur"]],["Odisha","OD",false,["Bhubaneswar","Cuttack","Puri"]],["Punjab","PB",false,["Chandigarh","Amritsar","Ludhiana","Jalandhar"]],
  ["Rajasthan","RJ",false,["Jaipur","Jodhpur","Udaipur","Kota","Ajmer"]],["Sikkim","SK",false,["Gangtok"]],
  ["Tamil Nadu","TN",false,["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem"]],["Telangana","TS",false,["Hyderabad","Warangal","Nizamabad"]],
  ["Tripura","TR",false,["Agartala"]],["Uttar Pradesh","UP",false,["Lucknow","Varanasi","Ayodhya","Gonda","Basti","Siddharthnagar","Gorakhpur","Kanpur","Prayagraj","Agra","Noida"]],
  ["Uttarakhand","UK",false,["Dehradun","Haridwar","Rishikesh","Haldwani"]],["West Bengal","WB",false,["Kolkata","Siliguri","Howrah"]],
  ["Andaman and Nicobar Islands","AN",true,["Port Blair"]],["Chandigarh","CH",true,["Chandigarh"]],
  ["Dadra and Nagar Haveli and Daman and Diu","DH",true,["Daman","Silvassa"]],["Delhi","DL",true,["Delhi","New Delhi"]],
  ["Jammu and Kashmir","JK",true,["Srinagar","Jammu"]],["Ladakh","LA",true,["Leh","Kargil"]],
  ["Lakshadweep","LD",true,["Kavaratti"]],["Puducherry","PY",true,["Puducherry","Karaikal"]],
];
const ALIASES: Record<string, string[]> = {
  Bengaluru: ["Bangalore", "Banglore"], Mysuru: ["Mysore"], "Chhatrapati Sambhajinagar": ["Aurangabad"],
  Delhi: ["Delhi NCR"], Mumbai: ["Bombay"], Kolkata: ["Calcutta"], Prayagraj: ["Allahabad"], Gurugram: ["Gurgaon"],
};
export const locationSlug = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normalized = (value: string) => value.trim().toLocaleLowerCase("en-IN").replace(/\s+/g, " ");

export async function seedLocationMasters() {
  for (const [name, code, isUnionTerritory, cities] of LOCATION_SEED) {
    const [state] = await db.insert(indianStates).values({ name, code, isUnionTerritory })
      .onConflictDoUpdate({ target: indianStates.code, set: { name, isUnionTerritory, updatedAt: new Date() } }).returning();
    for (const city of cities) await db.insert(indianCities).values({ stateId: state.id, name: city, slug: locationSlug(`${code}-${city}`), aliases: ALIASES[city] || [] })
      .onConflictDoUpdate({ target: [indianCities.stateId, indianCities.name], set: { aliases: ALIASES[city] || [], updatedAt: new Date() } });
  }
}

export async function resolveLocation(stateId: number, cityId: number, activeOnly = true) {
  const clauses = [eq(indianCities.id, cityId), eq(indianCities.stateId, stateId)];
  if (activeOnly) clauses.push(eq(indianCities.isActive, true), eq(indianStates.isActive, true));
  const [row] = await db.select({ state: indianStates, city: indianCities }).from(indianCities)
    .innerJoin(indianStates, eq(indianCities.stateId, indianStates.id)).where(and(...clauses));
  return row;
}

export async function resolveLocationName(cityName: string, stateName?: string | null) {
  const wanted = normalized(cityName);
  const rows = await db.select({ state: indianStates, city: indianCities }).from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id));
  const found = rows.filter(r => (!stateName || normalized(r.state.name) === normalized(stateName)) &&
    (normalized(r.city.name) === wanted || r.city.aliases.some(a => normalized(a) === wanted)));
  return found.length === 1 ? found[0] : undefined;
}