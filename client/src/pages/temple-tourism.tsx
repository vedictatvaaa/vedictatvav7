import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import PageSeo from "@/components/PageSeo";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Navigation, Star, Clock, Calendar, ChevronDown, ChevronUp, Filter, Search, Compass, Mountain, Waves, Flame, Crown, Heart, Sun, Sparkles, ArrowRight, Building, Train, Plane, Car, Bus, Info, BookOpen, Route, Globe, Map as MapIcon, Users, Eye, Share2, ChevronRight, Footprints, Trophy, Target, CheckCircle2, Instagram, Twitter, Facebook, Link2, Download, Award, Zap, TrendingUp } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import templeHeroImg from "@/assets/images/temple-hero.jpg";
import jyotirlingaImg from "@/assets/images/jyotirlinga.jpg";
import holyRiverImg from "@/assets/images/holy-river.jpg";
import himalayanTrekImg from "@/assets/images/himalayan-trek.jpg";
import yatraPilgrimsImg from "@/assets/images/yatra-pilgrims.jpg";
import southTempleImg from "@/assets/images/south-temple.jpg";
import shaktiPeethaImg from "@/assets/images/shakti-peetha.jpg";

interface PilgrimageSite {
  id: string;
  name: string;
  nameHindi: string;
  location: string;
  state: string;
  description: string;
  deity: string;
  significance: string;
  category: string;
  bestTime: string;
  nearestCity: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  color: string;
  rating: number;
  established: string;
  famousFor: string[];
  howToReach: { air: string; rail: string; road: string };
  knowHow: string;
  annualVisitors?: string;
}

const categories = [
  { id: "all", label: "All Sites", labelHindi: "सभी स्थल", icon: MapPin, color: "bg-[#6D2B35]", count: 0 },
  { id: "jyotirlinga", label: "12 Jyotirlingas", labelHindi: "१२ ज्योतिर्लिंग", icon: Flame, color: "bg-orange-600", count: 0 },
  { id: "shaktiPeetha", label: "Shakti Peethas", labelHindi: "शक्तिपीठ", icon: Crown, color: "bg-purple-600", count: 0 },
  { id: "charDham", label: "Char Dham", labelHindi: "चार धाम", icon: Mountain, color: "bg-blue-600", count: 0 },
  { id: "holyRiver", label: "Holy Rivers", labelHindi: "पवित्र नदियाँ", icon: Waves, color: "bg-cyan-600", count: 0 },
  { id: "holyCity", label: "Holy Cities & Birthplaces", labelHindi: "पवित्र नगर", icon: Sparkles, color: "bg-rose-600", count: 0 },
  { id: "famousYatra", label: "Famous Yatras", labelHindi: "प्रसिद्ध यात्राएं", icon: Footprints, color: "bg-amber-600", count: 0 },
  { id: "famousTemple", label: "Renowned Temples", labelHindi: "प्रसिद्ध मंदिर", icon: Building, color: "bg-emerald-600", count: 0 },
  { id: "trek", label: "Treks & Trails", labelHindi: "ट्रेक और मार्ग", icon: Route, color: "bg-teal-600", count: 0 },
];

const pilgrimageSites: PilgrimageSite[] = [
  // ===== 12 JYOTIRLINGAS =====
  { id: "somnath", name: "Somnath", nameHindi: "सोमनाथ", location: "Prabhas Patan, Gujarat", state: "Gujarat", description: "The first and most revered of the 12 Jyotirlingas. Somnath has been destroyed and rebuilt 17 times throughout history, symbolizing the eternal triumph of creation over destruction. The present temple was reconstructed in 1951 in the Chalukya style of architecture by Sardar Vallabhbhai Patel. The temple stands majestically on the shore of the Arabian Sea, and the sound-and-light show here narrates its extraordinary history.", deity: "Lord Shiva (Somnath)", significance: "Jyotirlinga #1 — First of the Twelve", category: "jyotirlinga", bestTime: "October - March", nearestCity: "Junagadh (79 km)", lat: 20.8880, lng: 70.4013, x: 21, y: 50, color: "#EA580C", rating: 4.8, established: "Ancient (rebuilt 1951)", famousFor: ["First Jyotirlinga", "Sound & Light Show", "Arabian Sea coastline", "Bhalka Tirth nearby"], howToReach: { air: "Diu Airport (63 km) or Rajkot Airport (164 km)", rail: "Veraval Railway Station (7 km)", road: "Well connected via NH-8D from Junagadh, Rajkot" }, knowHow: "Visit during Kartik Purnima for the grand Somnath Mahotsav. The Triveni Sangam (confluence of Hiran, Kapila, and Saraswati rivers) is nearby. Bhalka Tirth, where Lord Krishna was struck by an arrow, is just 5 km away.", annualVisitors: "60 Lakh+" },
  { id: "mallikarjuna", name: "Mallikarjuna", nameHindi: "मल्लिकार्जुन", location: "Srisailam, Andhra Pradesh", state: "Andhra Pradesh", description: "Located atop Srisailam mountain on the banks of River Krishna, Mallikarjuna is both a Jyotirlinga and a Shakti Peetha — the only temple with this dual distinction. The Nallamala Hills surrounding it form one of India's largest tiger reserves. The temple's architecture spans multiple dynasties — Satavahana, Ikshvaku, and Vijayanagara.", deity: "Lord Shiva (Mallikarjuna) & Goddess Bhramaramba", significance: "Jyotirlinga #2 + Shakti Peetha (dual)", category: "jyotirlinga", bestTime: "October - March", nearestCity: "Kurnool (186 km)", lat: 15.8553, lng: 78.8689, x: 48, y: 70, color: "#EA580C", rating: 4.7, established: "2nd Century", famousFor: ["Only dual Jyotirlinga + Shakti Peetha", "Srisailam Dam", "Nallamala Tiger Reserve", "Pathala Ganga"], howToReach: { air: "Hyderabad Airport (232 km)", rail: "Markapur Road Station (90 km)", road: "APSRTC buses from Hyderabad (5 hrs)" }, knowHow: "The Pathala Ganga steps lead down to River Krishna for a holy dip. Srisailam Dam offers stunning views. The Shivaratri Brahmotsavam is the grandest festival here.", annualVisitors: "50 Lakh+" },
  { id: "mahakaleshwar", name: "Mahakaleshwar", nameHindi: "महाकालेश्वर", location: "Ujjain, Madhya Pradesh", state: "Madhya Pradesh", description: "The only south-facing (Dakshinamurti) Jyotirlinga, considered extremely powerful in Tantric traditions. The legendary Bhasma Aarti at dawn — performed with sacred ash from funeral pyres — is a hauntingly beautiful ritual unique to this temple. Ujjain is one of the four Kumbh Mela cities and was the ancient capital of King Vikramaditya, from whom the Vikram Samvat calendar derives.", deity: "Lord Shiva (Mahakal — Lord of Time)", significance: "Jyotirlinga #3 — Only south-facing Jyotirlinga", category: "jyotirlinga", bestTime: "Year-round (Kumbh Mela every 12 years)", nearestCity: "Indore (55 km)", lat: 23.1828, lng: 75.7682, x: 38, y: 47, color: "#EA580C", rating: 4.9, established: "Ancient", famousFor: ["Bhasma Aarti (sacred ash ritual)", "Only Dakshinamurti Jyotirlinga", "Kumbh Mela city", "Vikramaditya's capital"], howToReach: { air: "Devi Ahilya Bai Holkar Airport, Indore (55 km)", rail: "Ujjain Junction (direct trains from Delhi, Mumbai)", road: "NH-47 from Indore, well connected" }, knowHow: "Pre-book Bhasma Aarti tickets online (starts at 4 AM, limited seats). Visit Kal Bhairav Temple and Ram Ghat for Shipra Aarti. The Mahakal Lok corridor (900m) is a newly built grand pathway with murals.", annualVisitors: "1.5 Crore+" },
  { id: "omkareshwar", name: "Omkareshwar", nameHindi: "ॐकारेश्वर", location: "Khandwa, Madhya Pradesh", state: "Madhya Pradesh", description: "Situated on Mandhata island in the Narmada River, which naturally takes the shape of the sacred Om (ॐ) symbol when viewed from above. This is one of the most mystical Jyotirlingas. The island has two temples — Omkareshwar and Amareshwar — considered inseparable.", deity: "Lord Shiva (Omkareshwar)", significance: "Jyotirlinga #4 — Om-shaped island", category: "jyotirlinga", bestTime: "October - March", nearestCity: "Indore (77 km)", lat: 22.2447, lng: 76.1509, x: 37, y: 50, color: "#EA580C", rating: 4.7, established: "Ancient", famousFor: ["Om-shaped island in Narmada", "Narmada Parikrama starting point", "24 avatars carved on temple walls", "Siddhanath Temple"], howToReach: { air: "Indore Airport (77 km)", rail: "Omkareshwar Road Station (12 km)", road: "Regular buses from Indore, Ujjain" }, knowHow: "Take a boat ride around the Om-shaped island. Visit both Omkareshwar and Amareshwar temples. The 24 avatars of Lord Vishnu are carved on the temple walls. Many start their Narmada Parikrama from here.", annualVisitors: "30 Lakh+" },
  { id: "kedarnath", name: "Kedarnath", nameHindi: "केदारनाथ", location: "Rudraprayag, Uttarakhand", state: "Uttarakhand", description: "The highest of the 12 Jyotirlingas at 3,583m altitude, set against the breathtaking backdrop of the Kedarnath range. The ancient temple survived the catastrophic 2013 floods miraculously — a massive boulder lodged behind it diverted the deluge. According to legend, Pandavas came here to seek Lord Shiva's forgiveness after the Kurukshetra war. The temple opens only 6 months a year (April to November).", deity: "Lord Shiva (Kedareshwar)", significance: "Jyotirlinga #5 + Char Dham", category: "jyotirlinga", bestTime: "May - June, Sep - October", nearestCity: "Rishikesh (223 km)", lat: 30.7352, lng: 79.0669, x: 54, y: 14.5, color: "#EA580C", rating: 4.9, established: "8th Century (Adi Shankaracharya)", famousFor: ["Highest Jyotirlinga (3,583m)", "Survived 2013 floods", "Part of Char Dham + Panch Kedar", "Bhairav Temple guardian"], howToReach: { air: "Jolly Grant Airport, Dehradun (239 km)", rail: "Rishikesh Railway Station (223 km)", road: "Drive to Gaurikund (16 km trek) or helicopter from Phata/Sirsi" }, knowHow: "Book helicopter tickets well in advance (₹7,000-12,000). The 16 km trek from Gaurikund takes 6-8 hrs. Ponies, palanquins available. Adi Shankaracharya's Samadhi is behind the temple. Temple closes during winter — the deity is moved to Ukhimath.", annualVisitors: "15 Lakh+" },
  { id: "bhimashankar", name: "Bhimashankar", nameHindi: "भीमाशंकर", location: "Pune, Maharashtra", state: "Maharashtra", description: "Nestled in the lush Western Ghats (Sahyadri Range), Bhimashankar is surrounded by dense forest that is now a wildlife sanctuary famous for the Indian Giant Squirrel (Shekru). The temple is built in Hemadpanthi architectural style. According to legend, Lord Shiva defeated the demon Bhima here, and his sweat formed the Bhima River.", deity: "Lord Shiva (Bhimashankar)", significance: "Jyotirlinga #6", category: "jyotirlinga", bestTime: "August - February (monsoon is spectacular)", nearestCity: "Pune (110 km)", lat: 19.073, lng: 73.5353, x: 33, y: 56, color: "#EA580C", rating: 4.6, established: "13th Century", famousFor: ["Bhimashankar Wildlife Sanctuary", "Indian Giant Squirrel habitat", "Origin of Bhima River", "Sahyadri monsoon beauty"], howToReach: { air: "Pune Airport (110 km)", rail: "Pune Railway Station (110 km)", road: "Drive via Manchar or Rajgurunagar from Pune" }, knowHow: "Best visited during monsoon for lush green surroundings. The trek from Bhorgiri village is popular among trekkers. Spot the rare Indian Giant Squirrel in the wildlife sanctuary. Gupt Bhimashankar is an older shrine nearby.", annualVisitors: "20 Lakh+" },
  { id: "kashivishwanath", name: "Kashi Vishwanath", nameHindi: "काशी विश्वनाथ", location: "Varanasi, Uttar Pradesh", state: "Uttar Pradesh", description: "The most famous Shiva temple in the world, standing in the holiest of the seven sacred cities. The newly built Kashi Vishwanath Corridor (2021) transformed the area into a grand 5-lakh sq ft complex connecting the temple directly to the Ganga ghats. The temple's gold dome (donated by Maharaja Ranjit Singh in 1839) gleams across the Varanasi skyline. Varanasi is believed to be the city where Lord Shiva permanently resides.", deity: "Lord Shiva (Vishwanath — Lord of the Universe)", significance: "Jyotirlinga #7 — Holiest city of Hinduism", category: "jyotirlinga", bestTime: "October - March (Dev Deepawali in November)", nearestCity: "Varanasi", lat: 25.3109, lng: 83.0107, x: 60.5, y: 37, color: "#EA580C", rating: 4.9, established: "Ancient (current structure 1780)", famousFor: ["Kashi Vishwanath Corridor", "Golden Dome", "Ganga Aarti at Dashashwamedh", "Oldest living city in the world"], howToReach: { air: "Lal Bahadur Shastri Airport, Varanasi (26 km)", rail: "Varanasi Junction / Varanasi Cantt", road: "Well connected via NH-2 (Grand Trunk Road)" }, knowHow: "Witness the mesmerizing Ganga Aarti at Dashashwamedh Ghat every evening at 7 PM. Take a dawn boat ride on the Ganges. Visit during Dev Deepawali (November) when a million diyas light up the ghats. The Kashi Vishwanath Corridor offers a seamless darshan experience now.", annualVisitors: "3 Crore+" },
  { id: "trimbakeshwar", name: "Trimbakeshwar", nameHindi: "त्र्यम्बकेश्वर", location: "Nashik, Maharashtra", state: "Maharashtra", description: "Unique among Jyotirlingas for having three faces representing the Trimurti — Brahma, Vishnu, and Shiva — embedded in the lingam. The temple is the origin point of the Godavari River, which starts from nearby Brahmagiri hill. Trimbakeshwar is one of the four Kumbh Mela sites and hosts Simhastha Kumbh every 12 years.", deity: "Lord Shiva (Trimbakeshwar — Three-eyed)", significance: "Jyotirlinga #8 — Source of Godavari", category: "jyotirlinga", bestTime: "August - March", nearestCity: "Nashik (28 km)", lat: 19.9424, lng: 73.531, x: 34.5, y: 53, color: "#EA580C", rating: 4.7, established: "Ancient (rebuilt 18th Century)", famousFor: ["Trimurti Lingam", "Origin of Godavari River", "Kumbh Mela site", "Kushavarta Kund"], howToReach: { air: "Nashik Airport (35 km) or Mumbai (180 km)", rail: "Nashik Road Railway Station (35 km)", road: "Regular buses from Nashik (30 min)" }, knowHow: "Visit Kushavarta Kund for ritual baths. Trek to Brahmagiri Hill (source of Godavari). The Narayan Nagbali and Kalsarpa Shanti puja are performed only here. Hire a priest for detailed temple rituals.", annualVisitors: "35 Lakh+" },
  { id: "vaidyanath", name: "Baidyanath (Vaidyanath)", nameHindi: "बैद्यनाथ", location: "Deoghar, Jharkhand", state: "Jharkhand", description: "Also known as Baba Dham, this Jyotirlinga is considered the divine physician (Vaidya) of the gods. According to legend, Ravana offered his ten heads to Lord Shiva here to gain immortality. The temple complex has 21 other temples within the premises. It is a crucial stop on the Kawad Yatra route and witnesses massive crowds during the month of Shravan.", deity: "Lord Shiva (Baidyanath — Divine Healer)", significance: "Jyotirlinga #9 — Sacred to Kawad Yatra", category: "jyotirlinga", bestTime: "July - August (Shravan), October - March", nearestCity: "Deoghar", lat: 24.4918, lng: 86.6966, x: 67, y: 40, color: "#EA580C", rating: 4.7, established: "Ancient", famousFor: ["Kawad Yatra destination", "21 temples in complex", "Ravana's legend", "Shravan month celebrations"], howToReach: { air: "Deoghar Airport (10 km)", rail: "Baidyanath Dham Railway Station", road: "NH-114A from Patna (280 km), Kolkata (370 km)" }, knowHow: "Visit during Shravan (July-August) to witness millions of Kawadias. Carry water from Sultanganj's Ganges for Jal Abhishek. The 21 temples in the complex require 2-3 hours to visit. Nandan Pahar and Trikuta Hills are nearby viewpoints.", annualVisitors: "1 Crore+ (Shravan)" },
  { id: "nageshwar", name: "Nageshwar", nameHindi: "नागेश्वर", location: "Dwarka, Gujarat", state: "Gujarat", description: "Located between Dwarka and the island of Bet Dwarka, Nageshwar Jyotirlinga is revered as the protector from all poisons. A massive 82-foot statue of Lord Shiva in meditation posture greets visitors outside the temple. According to the Shiva Purana, Lord Shiva defeated the demon Daruka here and established himself as Nageshwar (Lord of Serpents).", deity: "Lord Shiva (Nageshwar — Lord of Serpents)", significance: "Jyotirlinga #10", category: "jyotirlinga", bestTime: "October - March", nearestCity: "Dwarka (17 km)", lat: 22.3394, lng: 68.973, x: 17, y: 44, color: "#EA580C", rating: 4.5, established: "Ancient", famousFor: ["82-foot Shiva statue", "Anti-poison powers", "Near Bet Dwarka island", "Gomti Dwarka nearby"], howToReach: { air: "Jamnagar Airport (137 km)", rail: "Dwarka Railway Station (17 km)", road: "On the Dwarka-Bet Dwarka road" }, knowHow: "Combine with Dwarkadhish and Bet Dwarka visit. The 82-foot Shiva statue is best photographed during sunset. Visit the coral reef island of Bet Dwarka by boat. Best to visit during Maha Shivaratri.", annualVisitors: "20 Lakh+" },
  { id: "rameshwaram", name: "Rameshwaram", nameHindi: "रामेश्वरम्", location: "Ramanathapuram, Tamil Nadu", state: "Tamil Nadu", description: "The southernmost Jyotirlinga, inseparably linked to the Ramayana — Lord Rama is believed to have worshipped Lord Shiva here before crossing to Lanka. The temple boasts the longest corridor of any Hindu temple in India (197m) with 1,212 ornate granite pillars. The 22 sacred theerthams (holy wells) within the temple complex have distinct tastes and healing properties. The Pamban Bridge connecting Rameshwaram island to mainland is an engineering marvel.", deity: "Lord Shiva (Ramanathaswamy)", significance: "Jyotirlinga #11 + Char Dham (South)", category: "jyotirlinga", bestTime: "October - April", nearestCity: "Madurai (174 km)", lat: 9.2881, lng: 79.3174, x: 52, y: 87, color: "#EA580C", rating: 4.8, established: "12th Century (Pandya Dynasty)", famousFor: ["Longest temple corridor (1,212 pillars)", "22 sacred theerthams", "Ram Setu (Adam's Bridge)", "Pamban Bridge"], howToReach: { air: "Madurai Airport (174 km)", rail: "Rameshwaram Railway Station", road: "Via Pamban Bridge from Mandapam" }, knowHow: "Bathe in all 22 theerthams in sequence (takes 1-2 hrs, hire a guide). Visit Dhanushkodi ghost town and the Ram Setu viewpoint. The Pamban Bridge view during sunset is iconic. Agni Theertham (sea bath) is mandatory before temple entry.", annualVisitors: "50 Lakh+" },
  { id: "grishneshwar", name: "Grishneshwar", nameHindi: "घृष्णेश्वर", location: "Ellora, Maharashtra", state: "Maharashtra", description: "The last of the 12 Jyotirlingas, located near the UNESCO World Heritage Ellora Caves. The temple is a magnificent example of South Indian architecture built by Ahilyabai Holkar in the 18th century. According to the Shiva Purana, Goddess Parvati as Kusuma (Ghushmeshwari) performed intense penance here. The proximity to Ellora and Ajanta Caves makes this a culturally rich pilgrimage.", deity: "Lord Shiva (Grishneshwar)", significance: "Jyotirlinga #12 — Near Ellora Caves", category: "jyotirlinga", bestTime: "October - March", nearestCity: "Aurangabad (30 km)", lat: 20.0261, lng: 75.1799, x: 37, y: 55, color: "#EA580C", rating: 4.6, established: "18th Century (Ahilyabai Holkar)", famousFor: ["Near UNESCO Ellora Caves", "Ahilyabai Holkar architecture", "Last of 12 Jyotirlingas", "Daulatabad Fort nearby"], howToReach: { air: "Aurangabad Airport (35 km)", rail: "Aurangabad Railway Station (30 km)", road: "On Aurangabad-Ellora road, buses every 30 min" }, knowHow: "Combine with Ellora Caves (1 km away) and Daulatabad Fort visit. The temple allows only dhoti-clad men and saree-wearing women inside the sanctum. Photography not allowed inside. Visit Ajanta Caves (100 km) if time permits.", annualVisitors: "25 Lakh+" },

  // ===== SHAKTI PEETHAS =====
  { id: "vaishno", name: "Vaishno Devi", nameHindi: "वैष्णो देवी", location: "Katra, Jammu & Kashmir", state: "J&K", description: "Perched at 5,200 ft in the Trikuta Mountains, this cave shrine dedicated to Maa Vaishno Devi is the second most visited religious shrine in the world. The 13 km uphill trek from Katra is itself considered a spiritual journey. Inside the cave, three natural rock formations (Pindies) represent Maa Saraswati, Lakshmi, and Kali. The Shrine Board manages one of the most organized pilgrimages in India.", deity: "Goddess Vaishno Devi (Tridevi)", significance: "Shakti Peetha — 2nd most visited shrine globally", category: "shaktiPeetha", bestTime: "March - October", nearestCity: "Jammu (42 km)", lat: 33.0305, lng: 74.949, x: 42, y: 12, color: "#9333EA", rating: 4.9, established: "Ancient", famousFor: ["13 km sacred trek", "Cave shrine with 3 Pindies", "Bhairon Temple at summit", "Helicopter service available"], howToReach: { air: "Jammu Airport (50 km)", rail: "Shri Mata Vaishno Devi Katra Station", road: "NH-44 from Jammu to Katra (42 km)" }, knowHow: "Register online for Yatra Parchi (mandatory). Track opens at 3 AM. Ponies, palanquins, and helicopter (₹1,800) available. Don't skip Bhairon Temple (1.5 km beyond cave). Battery-operated vehicles available on the old track.", annualVisitors: "1 Crore+" },
  { id: "kamakhya", name: "Kamakhya Temple", nameHindi: "कामाख्या मंदिर", location: "Guwahati, Assam", state: "Assam", description: "One of the most revered Shakti Peethas, where the yoni (womb) of Goddess Sati fell. Atop Nilachal Hill overlooking the Brahmaputra River, Kamakhya is the epicenter of Tantric Hinduism. The annual Ambubachi Mela (June) marks the goddess's menstruation period — the temple closes for 3 days, and the waters of the spring inside turn red naturally. The temple's architecture is a unique fusion of Hindu and indigenous Assamese styles.", deity: "Goddess Kamakhya (Shakti)", significance: "Shakti Peetha — Center of Tantra", category: "shaktiPeetha", bestTime: "October - March", nearestCity: "Guwahati", lat: 26.1664, lng: 91.7024, x: 81, y: 32, color: "#9333EA", rating: 4.7, established: "8th Century (rebuilt 17th Century)", famousFor: ["Tantra Peetha", "Ambubachi Mela", "Yoni shrine", "Brahmaputra views"], howToReach: { air: "Lokpriya Gopinath Bordoloi Airport, Guwahati (20 km)", rail: "Guwahati Railway Station (8 km)", road: "Auto/taxi from Guwahati (30 min)" }, knowHow: "Visit during Ambubachi Mela (June) for the rare festival. Long queues during peak — arrive early morning. The 10 Mahavidya temples on the hill are equally sacred. Umananda Temple on a Brahmaputra island is nearby.", annualVisitors: "25 Lakh+" },
  { id: "kalighat", name: "Kalighat Kali Temple", nameHindi: "कालीघाट काली मंदिर", location: "Kolkata, West Bengal", state: "West Bengal", description: "One of the 51 Shakti Peethas where the toes of Goddess Sati's right foot fell. Kalighat is so historically significant that the city of Calcutta (Kolkata) derives its name from it. The current temple was built in 1809 by Sabarna Roy Choudhury family. The Kalighat Painting tradition, a unique art form depicting mythological scenes, originated from artists around this temple.", deity: "Goddess Kali", significance: "Shakti Peetha — Kolkata's namesake", category: "shaktiPeetha", bestTime: "October (Durga Puja / Kali Puja)", nearestCity: "Kolkata", lat: 22.5204, lng: 88.3426, x: 71, y: 47, color: "#9333EA", rating: 4.6, established: "1809 (current structure)", famousFor: ["Kolkata named after this temple", "Kalighat painting art form", "Kali Puja celebrations", "Nirmal Hriday (Mother Teresa's home nearby)"], howToReach: { air: "Netaji Subhas Chandra Bose Airport (18 km)", rail: "Sealdah/Howrah Railway Station", road: "Kalighat Metro Station (closest)" }, knowHow: "Visit during Kali Puja (October/November) for the most electrifying experience. The flower market outside is vibrant. Nirmal Hriday (Mother Teresa's first shelter) is adjacent. Avoid touts — use the official queue.", annualVisitors: "40 Lakh+" },
  { id: "vindhyavasini", name: "Vindhyavasini Devi", nameHindi: "विंध्यवासिनी देवी", location: "Mirzapur, Uttar Pradesh", state: "Uttar Pradesh", description: "A powerful Shakti Peetha in the Vindhya Mountains, believed to be where Goddess Durga settled after slaying Mahishasura. The temple is part of the Trimurti Shakti triangle with Kali Khoh and Ashtabhuja temples. The Vindhya mountain range is named after this goddess. During Navratri, the temple witnesses extraordinary devotion.", deity: "Goddess Vindhyavasini (Durga)", significance: "Shakti Peetha — Vindhya Mountains", category: "shaktiPeetha", bestTime: "March-April & October (Navratri)", nearestCity: "Varanasi (80 km)", lat: 25.0751, lng: 83.1649, x: 59, y: 40, color: "#9333EA", rating: 4.5, established: "Ancient", famousFor: ["Vindhya Mountains deity", "Navratri celebrations", "Trimurti Shakti triangle", "Ashtabhuja Temple"], howToReach: { air: "Varanasi Airport (80 km)", rail: "Mirzapur Railway Station (8 km)", road: "NH-2 from Varanasi (2 hrs)" }, knowHow: "Visit all three temples of the Trimurti triangle: Vindhyavasini, Kali Khoh, and Ashtabhuja. Navratri celebrations here are among the most intense in India. The river Ganges at Vindhyachal is especially sacred.", annualVisitors: "50 Lakh+" },
  { id: "ambaji", name: "Ambaji Temple", nameHindi: "अंबाजी मंदिर", location: "Banaskantha, Gujarat", state: "Gujarat", description: "One of the original 51 Shakti Peethas where the heart of Goddess Sati fell. Uniquely, this temple has no idol — worship is offered to a Vishva Yantra (sacred geometric diagram). The temple sits atop Gabbar Hill in the Aravalli Range. The Bhadra Purnima Fair in September attracts over 1.5 million pilgrims.", deity: "Goddess Ambaji (Amba Mata)", significance: "Shakti Peetha — Heart of Sati", category: "shaktiPeetha", bestTime: "September (Bhadra Purnima), October (Navratri)", nearestCity: "Ahmedabad (170 km)", lat: 24.3334, lng: 72.8492, x: 28, y: 41, color: "#9333EA", rating: 4.6, established: "Ancient", famousFor: ["No idol — Vishva Yantra worship", "Gabbar Hill", "Bhadra Purnima Mela", "Kumbharia Jain Temples nearby"], howToReach: { air: "Ahmedabad Airport (170 km)", rail: "Abu Road Station (20 km)", road: "Near Mt. Abu, well connected from Ahmedabad" }, knowHow: "The ropeway to Gabbar Hill offers panoramic views. Visit during Bhadra Purnima for the massive fair. Combine with Mt. Abu trip. The Kumbharia Jain Temples (5 km) are architectural gems.", annualVisitors: "60 Lakh+" },

  // ===== CHAR DHAM =====
  { id: "badrinath", name: "Badrinath", nameHindi: "बद्रीनाथ", location: "Chamoli, Uttarakhand", state: "Uttarakhand", description: "One of the four Char Dham sites, dedicated to Lord Vishnu. Nestled at 3,133m in the Garhwal Himalayas between the Nar and Narayana mountain ranges, with the Alaknanda River flowing alongside. Adi Shankaracharya re-established this ancient temple in the 9th century. The Tapt Kund (hot spring) near the temple has medicinal properties and pilgrims bathe here before darshan regardless of the freezing temperatures.", deity: "Lord Vishnu (Badrinarayan)", significance: "Char Dham + Divya Desam", category: "charDham", bestTime: "May - November (opens April/May)", nearestCity: "Rishikesh (295 km)", lat: 30.7433, lng: 79.4938, x: 55.5, y: 13, color: "#3B82F6", rating: 4.9, established: "9th Century", famousFor: ["Char Dham Yatra", "Tapt Kund hot spring", "Neelkanth Peak backdrop", "Mana Village (last Indian village)"], howToReach: { air: "Jolly Grant Airport, Dehradun (317 km)", rail: "Rishikesh / Haridwar Railway Station", road: "NH-7 via Joshimath, helicopter from Sahastradhara" }, knowHow: "Visit Mana Village (3 km) — last inhabited village before Tibet. See Vyas Gufa (cave where Ved Vyas wrote Mahabharata), Bhim Pul, and Vasudhara Falls. Temple opens at 4:15 AM — early darshan has shortest queues. The road closes in winter (Nov-May).", annualVisitors: "15 Lakh+" },
  { id: "gangotri", name: "Gangotri", nameHindi: "गंगोत्री", location: "Uttarkashi, Uttarakhand", state: "Uttarakhand", description: "The origin of the River Ganges and one of the four Char Dham sites. At 3,100m altitude, the temple marks where King Bhagirath meditated to bring Goddess Ganga from heaven to earth to liberate his ancestors. The actual source — Gaumukh glacier (cow's mouth) — is a 19 km trek from Gangotri through breathtaking Himalayan landscapes. The Submerged Shivling rock is visible when water levels drop.", deity: "Goddess Ganga", significance: "Char Dham — Origin of Ganges", category: "charDham", bestTime: "May - June, September - October", nearestCity: "Uttarkashi (100 km)", lat: 30.9944, lng: 78.9381, x: 52.5, y: 13.5, color: "#3B82F6", rating: 4.8, established: "18th Century (Amar Singh Thapa)", famousFor: ["Source of River Ganges", "Gaumukh Glacier trek", "Submerged Shivling", "King Bhagirath's legend"], howToReach: { air: "Jolly Grant Airport, Dehradun (229 km)", rail: "Rishikesh Railway Station (249 km)", road: "NH-108 via Uttarkashi" }, knowHow: "The Gaumukh trek (19 km one-way) requires a permit from Uttarkashi Forest Office. Stay at Bhojbasa base camp. The Submerged Shivling is visible in Sep-Oct when water recedes. Carry warm clothes — temperatures drop below freezing at night.", annualVisitors: "8 Lakh+" },
  { id: "yamunotri", name: "Yamunotri", nameHindi: "यमुनोत्री", location: "Uttarkashi, Uttarakhand", state: "Uttarakhand", description: "The first stop of the Char Dham pilgrimage, dedicated to Goddess Yamuna. At 3,293m, the temple is surrounded by hot springs (Surya Kund) and glaciers. Pilgrims cook rice in cloth bags dipped in the hot spring water and offer it as prasad. The actual source of the Yamuna is at Champasar Glacier, 1 km ahead at Saptrishi Kund, not easily accessible.", deity: "Goddess Yamuna", significance: "Char Dham — Source of Yamuna", category: "charDham", bestTime: "May - June, September - October", nearestCity: "Dehradun (173 km)", lat: 31.0171, lng: 78.4644, x: 51, y: 14, color: "#3B82F6", rating: 4.7, established: "19th Century", famousFor: ["Source of River Yamuna", "Surya Kund hot spring", "Rice cooked in hot spring", "Starting point of Char Dham"], howToReach: { air: "Jolly Grant Airport, Dehradun (196 km)", rail: "Dehradun Railway Station (173 km)", road: "6 km trek from Janki Chatti (road head)" }, knowHow: "The 6 km trek from Janki Chatti is moderate. Ponies and palanquins available. Cook rice/potatoes in Surya Kund's boiling water — a unique tradition. Divya Shila (divine rock) must be worshipped before entering the temple. Open May to November.", annualVisitors: "5 Lakh+" },

  // ===== HOLY RIVERS =====
  { id: "gangaRiver", name: "River Ganga", nameHindi: "गंगा नदी", location: "Gangotri to Bay of Bengal", state: "Multiple States", description: "The holiest river in Hinduism, flowing 2,525 km from the Gangotri Glacier in the Himalayas to the Bay of Bengal. Bathing in the Ganga is believed to wash away all sins. Key sacred points: Gangotri (source), Devprayag (where Alaknanda & Bhagirathi merge to form Ganga), Rishikesh, Haridwar, Prayagraj (Triveni Sangam), Varanasi (most sacred ghats), and Gangasagar (where Ganga meets the sea). The Ganga supports 40% of India's population and is personified as Goddess Ganga.", deity: "Goddess Ganga", significance: "Holiest River — Moksha-giving waters", category: "holyRiver", bestTime: "Year-round (Kumbh Mela years special)", nearestCity: "Various cities along 2,525 km course", lat: 25.4358, lng: 81.8463, x: 58, y: 25, color: "#0891B2", rating: 5.0, established: "Eternal", famousFor: ["Holiest river in the world", "Kumbh Mela held on its banks", "Ganga Aarti at Haridwar & Varanasi", "Self-purifying properties"], howToReach: { air: "Multiple airports along the course", rail: "Haridwar, Varanasi, Prayagraj stations", road: "NH network connects all Ganga cities" }, knowHow: "The best Ganga experiences: Gaumukh trek (source), Rishikesh rafting, Haridwar Ganga Aarti, Prayagraj Triveni Sangam, Varanasi dawn boat ride, Gangasagar Mela (January). Kumbh Mela rotates among Haridwar, Prayagraj, Nashik, and Ujjain.", annualVisitors: "10+ Crore (all sites combined)" },
  { id: "yamunaRiver", name: "River Yamuna", nameHindi: "यमुना नदी", location: "Yamunotri to Prayagraj", state: "Multiple States", description: "The second holiest river after Ganga, born at Yamunotri glacier and flowing 1,376 km to merge with Ganga at Prayagraj's Triveni Sangam. Yamuna is intimately connected with Lord Krishna's leelas — from His birth in Mathura to the Kaliya Naag episode in Vrindavan. The Yamuna Pushkar fair and the Surya worship on its banks are ancient traditions. Yamuna is revered as the daughter of Sun God (Surya) and sister of Yama.", deity: "Goddess Yamuna (daughter of Surya)", significance: "2nd Holiest River — Krishna Leela", category: "holyRiver", bestTime: "October - March", nearestCity: "Mathura, Agra, Delhi, Prayagraj", lat: 27.1767, lng: 78.0081, x: 53, y: 30, color: "#0891B2", rating: 4.7, established: "Eternal", famousFor: ["Krishna's childhood river", "Triveni Sangam at Prayagraj", "Yamuna Aarti at Mathura", "Taj Mahal on its banks"], howToReach: { air: "Delhi, Agra, Prayagraj airports", rail: "Mathura, Agra, Prayagraj stations", road: "NH network throughout" }, knowHow: "Best Yamuna experiences: Yamunotri source trek, Paonta Sahib (Sikh shrine), Mathura-Vrindavan (Krishna temples), Agra (Taj Mahal), Prayagraj Triveni Sangam. The Yamuna Aarti at Vishram Ghat, Mathura is hauntingly beautiful.", annualVisitors: "5+ Crore" },
  { id: "narmadaRiver", name: "River Narmada", nameHindi: "नर्मदा नदी", location: "Amarkantak to Arabian Sea", state: "MP, Maharashtra, Gujarat", description: "The only river in India that is worshipped by circumambulation (Narmada Parikrama). The 2,600 km Parikrama — walking along both banks — takes 3-4 years and is considered equivalent to the Char Dham Yatra. Narmada is the lifeline of Madhya Pradesh, flowing 1,312 km. Unlike Ganga, merely seeing the Narmada is believed to purify sins. The marble rocks at Bhedaghat and the Dhuandhar Falls are geological wonders along its course.", deity: "Goddess Narmada (Rewa)", significance: "Only river for Parikrama pilgrimage", category: "holyRiver", bestTime: "October - March (Parikrama: year-round)", nearestCity: "Jabalpur, Omkareshwar, Bharuch", lat: 22.6742, lng: 81.7511, x: 45, y: 47, color: "#0891B2", rating: 4.8, established: "Eternal", famousFor: ["Narmada Parikrama (2,600 km walk)", "Marble Rocks Bhedaghat", "Omkareshwar Jyotirlinga on its banks", "Self-formed Shivlings (Narmadeshwar)"], howToReach: { air: "Jabalpur, Indore airports", rail: "Jabalpur, Omkareshwar, Bharuch stations", road: "NH network along the course" }, knowHow: "Narmada Parikrama rules: Walk barefoot, sleep under trees, eat only what's offered. Short parikrama options (7-21 days) cover key stretches. Visit Bhedaghat Marble Rocks by moonlight for a magical experience. Narmadeshwar Shivlings (natural stone lingams) from the riverbed are considered the holiest.", annualVisitors: "1 Crore+" },
  { id: "godavariRiver", name: "River Godavari", nameHindi: "गोदावरी नदी", location: "Trimbakeshwar to Bay of Bengal", state: "MH, Telangana, AP", description: "The Dakshin Ganga (Ganges of the South), flowing 1,465 km from Trimbakeshwar near Nashik to the Bay of Bengal. Godavari is the longest river in peninsular India. The Pushkaram festival celebrated every 12 years on its banks draws millions. The river passes through the Dandakaranya forest where Lord Rama spent his exile. Key sacred sites: Nashik (Kumbh Mela), Nanded (Sikh holy city), Rajamahendravaram (Pushkara Ghat).", deity: "Goddess Godavari (Gautami)", significance: "Longest peninsular river — Dakshin Ganga", category: "holyRiver", bestTime: "October - March (Pushkaram years special)", nearestCity: "Nashik, Nanded, Rajahmundry", lat: 20.006, lng: 73.791, x: 46, y: 58, color: "#0891B2", rating: 4.6, established: "Eternal", famousFor: ["Dakshin Ganga (Ganges of South)", "Nashik Kumbh Mela", "Pushkaram festival", "Dandakaranya (Rama's exile)"], howToReach: { air: "Nashik, Rajahmundry airports", rail: "Nashik, Nanded, Rajahmundry stations", road: "NH network across Deccan plateau" }, knowHow: "Visit Nashik during Simhastha Kumbh Mela. Trimbakeshwar temple (Jyotirlinga) is at the river's source. Panchavati in Nashik is where Sita was abducted. The Papanasam ghat at Rajahmundry is especially sacred.", annualVisitors: "2 Crore+" },
  { id: "kaveriRiver", name: "River Kaveri", nameHindi: "कावेरी नदी", location: "Talakaveri to Bay of Bengal", state: "Karnataka, Tamil Nadu", description: "The sacred river of South India, originating from Talakaveri in the Brahmagiri Hills of Coorg (Kodagu). Known as the Ganga of the South, Kaveri flows 765 km through Karnataka and Tamil Nadu. The river delta in Thanjavur district is called the 'Rice Bowl of Tamil Nadu.' The grand Srirangam Temple (largest functioning Hindu temple) sits on an island between Kaveri and Kollidam rivers. The Kaveri Pushkaram is celebrated every 12 years.", deity: "Goddess Kaveri (Lopamudra)", significance: "Ganga of South India", category: "holyRiver", bestTime: "October - March (Kaveri Pushkaram years)", nearestCity: "Mysuru, Trichy, Thanjavur", lat: 12.3873, lng: 75.4897, x: 44, y: 80, color: "#0891B2", rating: 4.6, established: "Eternal", famousFor: ["Talakaveri origin spring", "Srirangam Temple island", "Rice Bowl of Tamil Nadu", "Kaveri Pushkaram"], howToReach: { air: "Mysore, Trichy airports", rail: "Mysuru, Srirangam stations", road: "Well connected via Karnataka and TN highways" }, knowHow: "Visit Talakaveri on Tula Sankramana (mid-October) when the spring miraculously overflows. Srirangam is the world's largest functioning Hindu temple — plan half a day. The Ranganathaswamy Temple has 7 concentric walls and 21 gopurams.", annualVisitors: "1 Crore+" },

  // ===== HOLY CITIES & BIRTHPLACES =====
  { id: "ayodhya", name: "Ayodhya — Birthplace of Lord Ram", nameHindi: "अयोध्या — श्री राम जन्मभूमि", location: "Ayodhya, Uttar Pradesh", state: "Uttar Pradesh", description: "The newly inaugurated Ram Mandir (January 2024) marks Lord Ram's exact birthplace — Ram Janmabhoomi. Built in Nagara style over 70 acres, the temple features 392 pillars, 44 doors, and a 161-ft shikhara. Ayodhya is the first of the seven sacred cities (Sapta Puri) in Hinduism. The Saryu River ghats host spectacular Deepotsav celebrations with 25 lakh+ diyas lit on Diwali.", deity: "Lord Ram", significance: "Ram Janmabhoomi — 1st of Sapta Puri", category: "holyCity", bestTime: "October - March (Deepotsav in October/November)", nearestCity: "Lucknow (130 km)", lat: 26.7998, lng: 82.194, x: 59, y: 34, color: "#E11D48", rating: 4.9, established: "Ram Mandir: 2024", famousFor: ["Ram Mandir (2024)", "Deepotsav (25 lakh+ diyas)", "Saryu Ghat Aarti", "Hanuman Garhi temple"], howToReach: { air: "Maharishi Valmiki Airport, Ayodhya (7 km)", rail: "Ayodhya Junction / Ayodhya Cantt", road: "NH-27 from Lucknow (2.5 hrs)" }, knowHow: "Ram Mandir darshan: book time slot online. Visit Hanuman Garhi first (tradition). Kanak Bhawan, Nageshwarnath Temple, and Dashrath Mahal are must-visits. Attend the Saryu River Aarti at sunset. Deepotsav celebrations (Oct-Nov) are UNESCO-recognized.", annualVisitors: "5 Crore+" },
  { id: "mathuraVrindavan", name: "Mathura-Vrindavan — Birthplace of Lord Krishna", nameHindi: "मथुरा-वृन्दावन — श्री कृष्ण जन्मभूमि", location: "Mathura, Uttar Pradesh", state: "Uttar Pradesh", description: "Mathura is the birthplace of Lord Krishna, and Vrindavan (15 km away) is where He spent His childhood performing divine leelas. Together they host over 5,000 temples. Krishna Janmabhoomi Temple marks the exact birth spot (the prison cell). Vrindavan's Banke Bihari Temple is one of the most visited temples in India. During Holi, Vrindavan transforms into a riot of colors — the Lathmar Holi of nearby Barsana is world-famous.", deity: "Lord Krishna & Radha", significance: "Krishna Janmabhoomi — Krishna Leela Land", category: "holyCity", bestTime: "October - March (Holi: March, Janmashtami: August)", nearestCity: "Agra (58 km)", lat: 27.4924, lng: 77.6737, x: 53, y: 33, color: "#E11D48", rating: 4.8, established: "Ancient", famousFor: ["Krishna Janmabhoomi jail cell", "5,000+ temples", "Lathmar Holi at Barsana", "Banke Bihari darshan"], howToReach: { air: "Agra Airport (58 km) or Delhi (150 km)", rail: "Mathura Junction", road: "NH-44 from Delhi (3 hrs)" }, knowHow: "Visit Banke Bihari Temple in Vrindavan early morning (intense crowds by noon). Krishna Janmabhoomi in Mathura has the original prison cell. ISKCON Temple in Vrindavan is architecturally stunning. Attend Govardhan Parikrama (21 km walk around Govardhan Hill). Holi in Barsana/Nandgaon (1 week before actual Holi) is unmissable.", annualVisitors: "3 Crore+" },
  { id: "haridwar", name: "Haridwar — Gateway to Gods", nameHindi: "हरिद्वार — हरि का द्वार", location: "Haridwar, Uttarakhand", state: "Uttarakhand", description: "The Gateway to the Gods — one of the seven holiest places in Hinduism and the point where the Ganges descends from the Himalayas to the plains. The evening Ganga Aarti at Har Ki Pauri is one of the most powerful spiritual experiences in India — thousands gather nightly as priests perform synchronized fire rituals. Haridwar is a major Kumbh Mela city, hosting the world's largest human gathering.", deity: "Lord Vishnu (Hari)", significance: "Sapta Puri — Gateway to Char Dham", category: "holyCity", bestTime: "September - April (Kumbh Mela years)", nearestCity: "Dehradun (52 km)", lat: 29.9457, lng: 78.1642, x: 53.5, y: 18, color: "#E11D48", rating: 4.8, established: "Ancient", famousFor: ["Ganga Aarti at Har Ki Pauri", "Kumbh Mela host city", "Gateway to Char Dham", "Brahma Kund"], howToReach: { air: "Jolly Grant Airport, Dehradun (35 km)", rail: "Haridwar Junction (major rail hub)", road: "NH-58 from Delhi (4 hrs)" }, knowHow: "Attend the Ganga Aarti at Har Ki Pauri at 6-7 PM (arrive 30 min early for good spots). Brahma Kund is the most sacred bathing ghat. Visit Chandi Devi and Mansa Devi temples by ropeway. Start your Char Dham Yatra from here. Non-vegetarian food and alcohol are banned in the entire city.", annualVisitors: "2 Crore+" },
  { id: "dwarka", name: "Dwarka — Lord Krishna's Kingdom", nameHindi: "द्वारका — श्री कृष्ण की नगरी", location: "Dwarka, Gujarat", state: "Gujarat", description: "One of the four Char Dhams and one of the seven Sapta Puris. Dwarka was Lord Krishna's magnificent kingdom after He left Mathura. The Dwarkadhish Temple (5 stories, 78m tall shikhar) stands at the confluence of Gomti River and Arabian Sea. Marine archaeologists have discovered ancient submerged city ruins offshore, supporting the legend of Krishna's golden Dwarka sinking into the sea.", deity: "Lord Krishna (Dwarkadhish)", significance: "Char Dham + Sapta Puri + Krishna's Kingdom", category: "holyCity", bestTime: "October - March", nearestCity: "Jamnagar (137 km)", lat: 22.2442, lng: 68.9685, x: 17, y: 45, color: "#E11D48", rating: 4.8, established: "Ancient", famousFor: ["Dwarkadhish Temple (5-story)", "Submerged city ruins", "Bet Dwarka island", "Nageshwar Jyotirlinga nearby"], howToReach: { air: "Jamnagar Airport (137 km)", rail: "Dwarka Railway Station", road: "Coastal highway from Jamnagar" }, knowHow: "Visit Bet Dwarka by boat (where Krishna actually lived). The submerged Dwarka visible through glass-bottom boats. Gomti Ghat sunset is spectacular. Combine with Somnath (233 km) and Nageshwar Jyotirlinga (17 km).", annualVisitors: "40 Lakh+" },

  // ===== FAMOUS YATRAS =====
  { id: "kawadYatra", name: "Kawad Yatra", nameHindi: "काँवड़ यात्रा", location: "Haridwar/Gaumukh to Deoghar & temples", state: "Multiple States", description: "One of the largest annual pilgrimages in the world — millions of Shiva devotees (Kawadias) carry sacred Ganga water on decorated Kawads (bamboo sticks with pots) from Haridwar/Gaumukh to pour on Shivlingas at their local temples or Baidyanath Dham. Held during Shravan (July-August), the roads come alive with saffron-clad devotees chanting 'Bol Bam!' The yatra covers 200-800 km and must be completed without setting the Kawad down.", deity: "Lord Shiva", significance: "World's largest annual walking pilgrimage", category: "famousYatra", bestTime: "July - August (Shravan month)", nearestCity: "Haridwar, Deoghar, Sultanpur", lat: 29.9457, lng: 78.1642, x: 55, y: 22, color: "#D97706", rating: 4.7, established: "Ancient (Treta Yuga)", famousFor: ["Millions of saffron-clad Kawadias", "Bol Bam! chanting", "Non-stop walking", "Ganga water for Shiva"], howToReach: { air: "Dehradun/Delhi for Haridwar start", rail: "Haridwar Junction", road: "Major highways closed/restricted for Kawadias" }, knowHow: "The Kawad must never touch the ground once filled with Ganga water. Dak Kawadias complete the journey non-stop running (200 km in 24-36 hrs). Relief camps offering free food and medical aid line the routes. Major routes: Haridwar → Delhi → Deoghar (1,200 km), Haridwar → local temples.", annualVisitors: "3 Crore+ (in Shravan)" },
  { id: "amarnathYatra", name: "Amarnath Yatra", nameHindi: "अमरनाथ यात्रा", location: "Pahalgam/Baltal to Amarnath Cave, J&K", state: "J&K", description: "The sacred pilgrimage to the ice Shivlinga inside Amarnath Cave at 3,888m altitude in the Himalayas. The ice lingam naturally forms and waxes/wanes with the moon phases. Lord Shiva is believed to have revealed the secret of immortality (Amar Katha) to Goddess Parvati here. The yatra operates for only 45 days (July-August) under heavy military protection. Two routes: Pahalgam (traditional, 46 km, 5 days) and Baltal (shorter, 14 km, 1 day).", deity: "Lord Shiva (ice Shivlinga)", significance: "Most challenging Himalayan pilgrimage", category: "famousYatra", bestTime: "July - August (limited season)", nearestCity: "Srinagar (141 km from Pahalgam)", lat: 34.215, lng: 75.5038, x: 44, y: 9, color: "#D97706", rating: 4.9, established: "Ancient (rediscovered 1850)", famousFor: ["Natural ice Shivlinga", "3,888m altitude cave", "45-day annual window", "Two routes: Pahalgam & Baltal"], howToReach: { air: "Srinagar Airport", rail: "Jammu Tawi (then road to Pahalgam/Baltal)", road: "Pahalgam (141 km from Srinagar) or Baltal (93 km)" }, knowHow: "Register compulsorily on the Shrine Board website (opens in April). Get mandatory health certificate. Pahalgam route (5 days, scenic) vs Baltal route (1 day, steep). Helicopter available from Pahalgam (₹6,500). Carry warm clothes, rain gear. Don't attempt if you have heart/respiratory issues.", annualVisitors: "4 Lakh (in 45 days)" },
  { id: "narmadaParikrama", name: "Narmada Parikrama", nameHindi: "नर्मदा परिक्रमा", location: "Along River Narmada, Madhya Pradesh", state: "MP, Maharashtra, Gujarat", description: "The most epic walking pilgrimage in India — circumambulating the entire River Narmada on foot, covering 2,600 km along both banks. Starting and ending at Amarkantak (source), this journey takes 3 years to complete on foot. It is considered equivalent to doing the Char Dham Yatra. Parikrama-vaasis walk barefoot, sleep in the open, eat only what's offered, and maintain strict vows of celibacy and non-violence.", deity: "Goddess Narmada", significance: "Equivalent to Char Dham — 2,600 km walk", category: "famousYatra", bestTime: "October - March (most start on Makar Sankranti)", nearestCity: "Amarkantak (start/end), Omkareshwar (midpoint)", lat: 22.25, lng: 76, x: 46, y: 44, color: "#D97706", rating: 4.8, established: "Ancient (Vedic period)", famousFor: ["2,600 km walking pilgrimage", "3 years to complete", "Barefoot tradition", "Equivalent to Char Dham"], howToReach: { air: "Jabalpur for Amarkantak", rail: "Amarkantak Road Station", road: "State highways along Narmada" }, knowHow: "Short parikrama options: 108-day quick version covering key sites. Rules: walk with the river on your right (clockwise), never cross the river by bridge, never look back. Key stops: Amarkantak, Jabalpur (Bhedaghat), Omkareshwar, Maheshwar, Bharuch. Many ashrams along the way offer free food and shelter.", annualVisitors: "5 Lakh (full + partial)" },
  { id: "mansarovar", name: "Kailash Mansarovar Yatra", nameHindi: "कैलाश मानसरोवर यात्रा", location: "Tibet (via Lipulekh/Nathu La)", state: "Tibet, China", description: "The ultimate pilgrimage for Hindus — to Mount Kailash (6,638m), believed to be the abode of Lord Shiva and Goddess Parvati. Lake Mansarovar at its base is the highest freshwater lake in the world (4,590m). The 52 km Kailash Parikrama around the mountain takes 3 days on foot at extreme altitude. Organized by the Indian Government's Ministry of External Affairs, only 600-900 pilgrims are permitted annually.", deity: "Lord Shiva & Goddess Parvati", significance: "Abode of Lord Shiva — Ultimate pilgrimage", category: "famousYatra", bestTime: "June - September (annual window)", nearestCity: "Dharchula (India) or Kathmandu (Nepal)", lat: 31.0583, lng: 81.3119, x: 56, y: 6, color: "#D97706", rating: 5.0, established: "Eternal", famousFor: ["Mount Kailash (Shiva's abode)", "Lake Mansarovar", "52 km Kailash Parikrama", "Government-organized limited yatra"], howToReach: { air: "Pithoragarh/Lucknow (Lipulekh route), Kathmandu (Nepal route)", rail: "Kathgodam (Lipulekh route)", road: "Lipulekh Pass from India or overland from Nepal/Kathmandu" }, knowHow: "Apply via MEA website (lottery selection, only 600-900 slots/year). Two routes: Lipulekh Pass (India, harder) and Nathu La (Sikkim, easier). Extreme fitness required — undergo mandatory medical tests. The 3-day Kailash Parikrama at 5,500m+ altitude is one of the toughest treks in the world. Some opt for the Nepal/helicopter route.", annualVisitors: "600-900 (India quota)" },

  // ===== RENOWNED TEMPLES =====
  { id: "tirupati", name: "Tirupati Balaji", nameHindi: "तिरुपति बालाजी", location: "Tirumala, Andhra Pradesh", state: "Andhra Pradesh", description: "The richest and most visited Hindu temple in the world, receiving 50,000-100,000 pilgrims daily. Sri Venkateswara Temple atop the seven Tirumala hills has an annual income exceeding ₹3,000 crore. The tradition of tonsuring hair (offering hair to the deity) generates over 100 tons of hair annually. The Laddu prasadam (patented GI tag) is world-famous. The temple's golden vimana tower and diamond-studded deity are awe-inspiring.", deity: "Lord Venkateswara (Vishnu)", significance: "Richest & most visited temple globally", category: "famousTemple", bestTime: "September - February (avoid summer)", nearestCity: "Chennai (135 km)", lat: 13.6833, lng: 79.347, x: 50.5, y: 75, color: "#059669", rating: 4.9, established: "300 AD (Pallava dynasty)", famousFor: ["50,000+ daily pilgrims", "₹3,000 crore annual income", "Famous Laddu prasadam", "Hair offering tradition"], howToReach: { air: "Tirupati Airport (15 km from Tirupati town)", rail: "Tirupati Railway Station", road: "Ghat road to Tirumala (18 km, free bus service)" }, knowHow: "Book ₹300 Special Entry Darshan (SED) or Free Darshan (6-20 hr wait) online. VIP Break Darshan through donation (₹10,000+). Stay at TTD accommodation (very cheap). The Laddu must be bought at the counter only. Shave head at free kalyanakatta. Visit Padmavathi Temple at Tiruchanoor.", annualVisitors: "2.5 Crore+" },
  { id: "jagannath", name: "Jagannath Puri", nameHindi: "जगन्नाथ पुरी", location: "Puri, Odisha", state: "Odisha", description: "One of the four Char Dhams, the Jagannath Temple is famous for the annual Rath Yatra where massive chariots carry the deities through the streets — the English word 'Juggernaut' derives from Jagannath. The Mahaprasad (56 types of food offerings) is cooked for 10,000+ people daily using an ancient method — 7 pots stacked vertically, the topmost cooks first! The temple flag always flies against the wind direction, a phenomenon unexplained by science.", deity: "Lord Jagannath (Krishna), Balabhadra, Subhadra", significance: "Char Dham — World-famous Rath Yatra", category: "famousTemple", bestTime: "October - March (Rath Yatra: June/July)", nearestCity: "Bhubaneswar (60 km)", lat: 19.805, lng: 85.8183, x: 65, y: 55, color: "#059669", rating: 4.9, established: "12th Century (Anantavarman Chodaganga)", famousFor: ["Rath Yatra festival", "Flag flies against wind", "7-pot cooking mystery", "Mahaprasad for 10,000+ daily"], howToReach: { air: "Biju Patnaik Airport, Bhubaneswar (60 km)", rail: "Puri Railway Station", road: "NH-316 from Bhubaneswar (1.5 hrs)" }, knowHow: "Rath Yatra dates change yearly (June/July) — plan well in advance. Non-Hindus are not allowed inside the main temple (view from Raghunandan Library rooftop). Mahaprasad at Ananda Bazaar is a must-try. Visit the Puri Beach and Chilika Lake. The temple has no shadow at noon — another mystery!", annualVisitors: "1.5 Crore+" },
  { id: "meenakshi", name: "Meenakshi Amman Temple", nameHindi: "मीनाक्षी अम्मन मंदिर", location: "Madurai, Tamil Nadu", state: "Tamil Nadu", description: "A historic masterpiece with 14 magnificent gopurams (gateway towers) ranging from 45m to 52m, covered in 33,000+ colorful sculptures of gods, demons, and animals. The temple complex covers 14 acres with the sacred Golden Lotus Tank at its center. The Meenakshi Thirukalyanam (divine wedding) festival in April attracts a million visitors. The musical pillars in the Ayirakkal Mandapam produce different musical notes when tapped.", deity: "Goddess Meenakshi (Parvati) & Lord Sundareswarar (Shiva)", significance: "Dravidian architecture masterpiece", category: "famousTemple", bestTime: "October - March (Chithirai Festival: April)", nearestCity: "Madurai", lat: 9.9195, lng: 78.1193, x: 48, y: 84, color: "#059669", rating: 4.8, established: "6th Century BC (rebuilt 17th Century)", famousFor: ["14 gopurams with 33,000+ sculptures", "Musical pillars", "Golden Lotus Tank", "Chithirai Festival (divine wedding)"], howToReach: { air: "Madurai Airport (12 km)", rail: "Madurai Junction", road: "Well connected via NH-44, NH-85" }, knowHow: "Visit at night for the spectacular Meenakshi-Sundareswarar Uchikala Puja (closing ceremony). The Art Museum inside has archaeological treasures. Tap the musical pillars in Ayirakkal Mandapam. The temple has a parrot sanctuary — hundreds of parrots nest in the gopurams.", annualVisitors: "1.5 Crore+" },
  { id: "goldenTemple", name: "Golden Temple (Harmandir Sahib)", nameHindi: "स्वर्ण मंदिर (हरमंदिर साहिब)", location: "Amritsar, Punjab", state: "Punjab", description: "The holiest Gurdwara and spiritual center of Sikhism. The gold-plated temple sits in the middle of the sacred Amrit Sarovar (Pool of Nectar). The Langar (free community kitchen) feeds 100,000+ people daily regardless of religion, caste, or status — the world's largest free kitchen. The Palki Sahib ceremony at night when the Guru Granth Sahib is carried from Darbar Sahib to Akal Takht is deeply moving.", deity: "Guru Granth Sahib", significance: "Holiest Sikh shrine — World's largest free kitchen", category: "famousTemple", bestTime: "October - March", nearestCity: "Amritsar", lat: 31.62, lng: 74.8765, x: 40.5, y: 15.5, color: "#059669", rating: 4.9, established: "1604 AD (Guru Arjan Dev)", famousFor: ["Gold-plated temple in sacred pool", "Langar (100,000+ free meals daily)", "Palki Sahib ceremony", "Wagah Border nearby"], howToReach: { air: "Sri Guru Ram Dass Jee Airport (11 km)", rail: "Amritsar Junction", road: "NH-1 from Delhi (7 hrs)" }, knowHow: "Visit at 3-4 AM for the Prakash ceremony (most spiritual time). Head covered and shoes removed mandatory. The Langar hall is open 24/7. Visit Jallianwala Bagh (400m away) and Wagah Border ceremony (30 km). The temple is equally beautiful at night when fully illuminated.", annualVisitors: "3 Crore+" },
  { id: "shirdi", name: "Shirdi Sai Baba Temple", nameHindi: "शिरडी साई बाबा मंदिर", location: "Shirdi, Maharashtra", state: "Maharashtra", description: "The holy abode of Sai Baba of Shirdi, revered across all religions. The Samadhi Mandir houses a marble statue of Sai Baba sitting in his characteristic pose. The temple provides free food (prasadalaya) to all visitors, serving over 40,000 meals daily. The Dwarkamai mosque where Sai Baba lived, and the sacred Dhuni (eternal fire) he maintained, are preserved. Sai Baba's teachings of 'Sabka Malik Ek' (One God for all) transcend religious boundaries.", deity: "Sai Baba", significance: "Multi-faith pilgrimage — Unity of religions", category: "famousTemple", bestTime: "Year-round (Guru Purnima: July, Ram Navami: March/April)", nearestCity: "Nashik (83 km)", lat: 19.7667, lng: 74.477, x: 36, y: 54, color: "#059669", rating: 4.8, established: "1922 (Samadhi Mandir)", famousFor: ["Multi-faith worship", "40,000+ free meals daily", "Dwarkamai mosque", "Dhuni (eternal sacred fire)"], howToReach: { air: "Shirdi Airport (14 km)", rail: "Sainagar Shirdi Railway Station (9 km)", road: "NH-160 from Nashik (83 km), Mumbai (250 km)" }, knowHow: "Online darshan booking recommended (free or ₹200 priority). Aarti timings: 5:15 AM, 12 PM, 6 PM, 10:30 PM — evening Aarti is most enchanting. Visit Dwarkamai, Chavadi, Lendi Baug in sequence. The Prasadalaya lunch is a must-experience (massive, well-organized).", annualVisitors: "2.5 Crore+" },
  { id: "konark", name: "Konark Sun Temple", nameHindi: "कोणार्क सूर्य मंदिर", location: "Konark, Odisha", state: "Odisha", description: "A UNESCO World Heritage Site designed as a gigantic chariot of the Sun God with 24 intricately carved stone wheels (each 3m diameter) and 7 horses. Built by King Narasimhadeva I in the 13th century, the temple's main tower (now collapsed) was originally 70m tall. The wheels function as sundials — shadows cast by the spokes accurately tell the time. The erotic sculptures represent the cycle of life and cosmic energy.", deity: "Surya (Sun God)", significance: "UNESCO Heritage — Architectural wonder", category: "famousTemple", bestTime: "October - March (Dance Festival: December)", nearestCity: "Bhubaneswar (65 km)", lat: 19.8876, lng: 86.0945, x: 66, y: 55, color: "#059669", rating: 4.8, established: "1250 AD", famousFor: ["Chariot-shaped temple", "24 sundial wheels", "UNESCO World Heritage", "Konark Dance Festival"], howToReach: { air: "Biju Patnaik Airport, Bhubaneswar (65 km)", rail: "Puri Railway Station (35 km)", road: "Puri-Konark Marine Drive (scenic)" }, knowHow: "The wheels work as sundials — ask a guide to demonstrate time-telling. Visit at sunrise when the first rays illuminate the temple. The Konark Dance Festival (December) features India's best classical dancers performing against the temple backdrop. The ASI museum nearby has fallen sculptures. Combine with Puri (35 km).", annualVisitors: "20 Lakh+" },
  { id: "sabarimala", name: "Sabarimala", nameHindi: "सबरीमाला", location: "Pathanamthitta, Kerala", state: "Kerala", description: "The hilltop temple of Lord Ayyappa, accessible only through a dense forest trek. Devotees observe a strict 41-day Vratham (fasting & celibacy) before the pilgrimage. The annual Makaravilakku festival (January) when a mysterious light appears on Ponnambalamedu hill draws millions. The 18 holy steps (Pathinettampadi) leading to the sanctum are climbed only by devotees carrying the traditional Irumudi (offering bundle) on their heads.", deity: "Lord Ayyappa", significance: "Largest annual pilgrimage in the world", category: "famousTemple", bestTime: "November - January (Mandala-Makara season)", nearestCity: "Kottayam (95 km)", lat: 9.4353, lng: 77.0813, x: 43, y: 86, color: "#059669", rating: 4.8, established: "12th Century", famousFor: ["41-day Vratham observance", "Makaravilakku light", "18 holy steps", "4 km jungle trek"], howToReach: { air: "Kochi Airport (155 km)", rail: "Chengannur Railway Station (66 km)", road: "Bus to Pamba, then 4 km trek" }, knowHow: "Start 41-day fasting and wear black clothes well before the trip. Carry Irumudi (coconut with ghee + offerings) on your head. The trek from Pamba (4 km) takes 1.5-2 hrs. Makaravilakku (Jan 14) is the most auspicious day but also most crowded. Book accommodation at Sannidhanam well in advance.", annualVisitors: "5 Crore (in 2-month season)" },

  // ===== TREKS & TRAILS =====
  { id: "hemkundSahib", name: "Hemkund Sahib Trek", nameHindi: "हेमकुंड साहिब ट्रेक", location: "Chamoli, Uttarakhand", state: "Uttarakhand", description: "The highest Gurdwara in the world at 4,632m altitude, situated beside a crystal-clear glacial lake surrounded by seven snow-capped peaks. Both Sikhs and Hindus revere this site — Guru Gobind Singh meditated here in a previous life, and the nearby Valley of Flowers (UNESCO) is a botanical paradise with 600+ species of wildflowers. The trek from Govindghat (19 km) is challenging but spectacularly scenic.", deity: "Guru Gobind Singh", significance: "Highest Gurdwara + Valley of Flowers", category: "trek", bestTime: "July - September (open only 3 months)", nearestCity: "Joshimath (25 km from Govindghat)", lat: 30.6927, lng: 79.6048, x: 55, y: 15, color: "#0D9488", rating: 4.8, established: "1930s (rediscovered)", famousFor: ["Highest Gurdwara (4,632m)", "Glacial lake", "Valley of Flowers", "19 km challenging trek"], howToReach: { air: "Jolly Grant Airport, Dehradun (280 km)", rail: "Rishikesh (273 km)", road: "NH-7 to Govindghat, then 13 km trek to Ghangaria + 6 km to Hemkund" }, knowHow: "Stay at Ghangaria (base camp, 13 km from Govindghat). Split the trip: Day 1 to Ghangaria, Day 2 to Hemkund (6 km steep), Day 3 to Valley of Flowers. Pony/helicopter available to Ghangaria. Carry rain gear and warm clothes. Altitude sickness precautions needed above 4,000m.", annualVisitors: "3 Lakh" },
  { id: "govardhanParikrama", name: "Govardhan Parikrama", nameHindi: "गोवर्धन परिक्रमा", location: "Govardhan, Uttar Pradesh", state: "Uttar Pradesh", description: "A sacred 21 km circumambulation of Govardhan Hill, which Lord Krishna lifted on His little finger for 7 days to protect the villagers of Vrindavan from Indra's wrath. The parikrama passes through ancient temples, sacred kunds (ponds), and villages frozen in time. Many devotees do the parikrama rolling on the ground (Dandvat Parikrama), which takes weeks. The hill is worshipped as a living deity — Govardhan Puja on the day after Diwali is a major festival.", deity: "Lord Krishna / Govardhan Maharaj", significance: "Krishna Leela — Hill worshipped as deity", category: "trek", bestTime: "October - March (Govardhan Puja: October/November)", nearestCity: "Mathura (26 km)", lat: 27.4977, lng: 77.4632, x: 52, y: 34, color: "#0D9488", rating: 4.6, established: "Ancient (Dvapara Yuga)", famousFor: ["21 km parikrama", "Krishna lifted hill on finger", "Dandvat Parikrama tradition", "Sacred kunds"], howToReach: { air: "Agra Airport (68 km) or Delhi (160 km)", rail: "Mathura Junction (26 km)", road: "Local buses from Mathura/Vrindavan" }, knowHow: "Start early morning (4-5 AM) to complete comfortably. Walk barefoot (tradition). Key stops: Mansi Ganga, Kusum Sarovar, Radha Kund, Shyam Kund. Many pilgrims do it barefoot as a vow. Don't pick up any stone — every stone of Govardhan is worshipped as Krishna.", annualVisitors: "1 Crore+" },
];

const categoryImages: Record<string, string> = {
  jyotirlinga: jyotirlingaImg,
  shaktiPeetha: shaktiPeethaImg,
  charDham: himalayanTrekImg,
  holyRiver: holyRiverImg,
  holyCity: yatraPilgrimsImg,
  famousYatra: yatraPilgrimsImg,
  famousTemple: southTempleImg,
  trek: himalayanTrekImg,
};

categories.forEach(cat => {
  cat.count = cat.id === "all" ? pilgrimageSites.length : pilgrimageSites.filter(s => s.category === cat.id).length;
});

interface StateInfo {
  name: string;
  nameHindi: string;
  sites: PilgrimageSite[];
  color: string;
}

function getStateMap(): StateInfo[] {
  const stateMap: Record<string, { nameHindi: string; color: string }> = {
    "Gujarat": { nameHindi: "गुजरात", color: "#EA580C" },
    "Andhra Pradesh": { nameHindi: "आंध्र प्रदेश", color: "#9333EA" },
    "Madhya Pradesh": { nameHindi: "मध्य प्रदेश", color: "#3B82F6" },
    "Uttarakhand": { nameHindi: "उत्तराखंड", color: "#059669" },
    "Maharashtra": { nameHindi: "महाराष्ट्र", color: "#D97706" },
    "Uttar Pradesh": { nameHindi: "उत्तर प्रदेश", color: "#E11D48" },
    "Tamil Nadu": { nameHindi: "तमिल नाडु", color: "#7C3AED" },
    "Jharkhand": { nameHindi: "झारखंड", color: "#0891B2" },
    "J&K": { nameHindi: "जम्मू-कश्मीर", color: "#6366F1" },
    "Assam": { nameHindi: "असम", color: "#10B981" },
    "West Bengal": { nameHindi: "पश्चिम बंगाल", color: "#F59E0B" },
    "Punjab": { nameHindi: "पंजाब", color: "#EF4444" },
    "Odisha": { nameHindi: "ओडिशा", color: "#8B5CF6" },
    "Kerala": { nameHindi: "केरल", color: "#14B8A6" },
    "Multiple States": { nameHindi: "बहु-राज्य", color: "#6D2B35" },
    "MP, Maharashtra, Gujarat": { nameHindi: "म.प्र., महाराष्ट्र, गुजरात", color: "#0891B2" },
    "MH, Telangana, AP": { nameHindi: "म.रा., तेलंगाना, आं.प्र.", color: "#D97706" },
    "Karnataka, Tamil Nadu": { nameHindi: "कर्नाटक, तमिल नाडु", color: "#7C3AED" },
    "Tibet, China": { nameHindi: "तिब्बत, चीन", color: "#6366F1" },
  };
  const grouped: Record<string, PilgrimageSite[]> = {};
  pilgrimageSites.forEach(site => {
    if (!grouped[site.state]) grouped[site.state] = [];
    grouped[site.state].push(site);
  });
  return Object.entries(grouped)
    .map(([name, sites]) => ({ name, nameHindi: stateMap[name]?.nameHindi || name, sites, color: stateMap[name]?.color || "#6D2B35" }))
    .sort((a, b) => b.sites.length - a.sites.length);
}

const pilgrimageGoals = [
  { id: "all12jyotirlinga", title: "Complete 12 Jyotirlingas", titleHindi: "सम्पूर्ण १२ ज्योतिर्लिंग", icon: Flame, color: "#EA580C", siteIds: pilgrimageSites.filter(s => s.category === "jyotirlinga").map(s => s.id), badge: "Jyotirlinga Champion" },
  { id: "shaktipeethas", title: "Shakti Peetha Darshan", titleHindi: "शक्तिपीठ दर्शन", icon: Crown, color: "#9333EA", siteIds: pilgrimageSites.filter(s => s.category === "shaktiPeetha").map(s => s.id), badge: "Shakti Sadhak" },
  { id: "charDham", title: "Char Dham Yatra", titleHindi: "चार धाम यात्रा", icon: Mountain, color: "#3B82F6", siteIds: ["badrinath", "kedarnath", "gangotri", "yamunotri"], badge: "Char Dham Yatri" },
  { id: "holyRivers", title: "Holy Rivers Pilgrimage", titleHindi: "पवित्र नदी तीर्थ", icon: Waves, color: "#0891B2", siteIds: pilgrimageSites.filter(s => s.category === "holyRiver").map(s => s.id), badge: "Nadi Sevak" },
  { id: "famousYatras", title: "Great Yatras of India", titleHindi: "भारत की महान यात्राएं", icon: Footprints, color: "#D97706", siteIds: pilgrimageSites.filter(s => s.category === "famousYatra").map(s => s.id), badge: "Maha Yatri" },
  { id: "templeExplorer", title: "Renowned Temples Tour", titleHindi: "प्रसिद्ध मंदिर दर्शन", icon: Building, color: "#059669", siteIds: pilgrimageSites.filter(s => s.category === "famousTemple").map(s => s.id), badge: "Temple Explorer" },
];

function createMarkerIcon(color: string, isSelected: boolean) {
  const s = isSelected ? 40 : 30;
  const glow = isSelected ? 14 : 8;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
    <defs>
      <filter id="glow-${color.replace('#','')}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${glow}" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="bg-${color.replace('#','')}" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="42" fill="url(#bg-${color.replace('#','')})" stroke="${color}" stroke-width="3" filter="url(#glow-${color.replace('#','')})" opacity="0.85"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>
    <!-- Temple shikhara -->
    <path d="M50 12 L44 30 L56 30 Z" fill="white" opacity="0.95"/>
    <!-- Temple flag -->
    <line x1="50" y1="8" x2="50" y2="14" stroke="white" stroke-width="2" opacity="0.9"/>
    <path d="M50 8 L57 11 L50 13" fill="#FFD700" opacity="0.9"/>
    <!-- Temple body -->
    <rect x="38" y="30" width="24" height="22" rx="2" fill="white" opacity="0.95"/>
    <!-- Temple pillars -->
    <rect x="41" y="34" width="3" height="18" rx="1" fill="${color}" opacity="0.7"/>
    <rect x="48.5" y="34" width="3" height="18" rx="1" fill="${color}" opacity="0.7"/>
    <rect x="56" y="34" width="3" height="18" rx="1" fill="${color}" opacity="0.7"/>
    <!-- Temple door -->
    <path d="M47 52 L47 42 Q50 38 53 42 L53 52 Z" fill="${color}" opacity="0.8"/>
    <!-- Temple base/steps -->
    <rect x="34" y="52" width="32" height="4" rx="1" fill="white" opacity="0.9"/>
    <rect x="30" y="56" width="40" height="4" rx="1" fill="white" opacity="0.8"/>
    <!-- Side domes -->
    <ellipse cx="36" cy="32" rx="5" ry="4" fill="white" opacity="0.85"/>
    <ellipse cx="64" cy="32" rx="5" ry="4" fill="white" opacity="0.85"/>
    <!-- Om symbol at base -->
    <text x="50" y="72" text-anchor="middle" font-size="14" fill="white" font-weight="bold" opacity="0.9">Om</text>
  </svg>`;
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 ${isSelected ? '8' : '4'}px ${color});">${svg}</div>`,
    className: '',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -s / 2],
  });
}

function MapUpdater({ selectedSite }: { selectedSite: PilgrimageSite | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedSite) {
      map.flyTo([selectedSite.lat, selectedSite.lng], 8, { duration: 0.8 });
    }
  }, [selectedSite, map]);
  return null;
}

function LeafletMap({ sites, selectedSite, onSelectSite }: {
  sites: PilgrimageSite[];
  selectedSite: PilgrimageSite | null;
  onSelectSite: (site: PilgrimageSite) => void;
}) {
  return (
    <MapContainer
      center={[22.5, 79.0]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      className="rounded-b-none z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater selectedSite={selectedSite} />
      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={createMarkerIcon(site.color, selectedSite?.id === site.id)}
          eventHandlers={{ click: () => onSelectSite(site) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-bold text-sm" style={{ color: site.color }}>{site.name}</h3>
              <p className="text-xs text-gray-500">{site.nameHindi}</p>
              <p className="text-xs mt-1">{site.significance}</p>
              <p className="text-xs text-gray-400 mt-1">{site.location}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-yellow-600">★ {site.rating}</span>
                <span className="text-[10px] text-gray-400">| {site.bestTime}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function TempleTourism() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSite, setSelectedSite] = useState<PilgrimageSite | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCircuit, setExpandedCircuit] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [visitedSites, setVisitedSites] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem("vedictatva_visited_sites"); return saved ? new Set(JSON.parse(saved)) : new Set<string>(); } catch { return new Set<string>(); }
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareGoal, setShareGoal] = useState<typeof pilgrimageGoals[0] | null>(null);

  const stateData = useMemo(() => getStateMap(), []);

  const toggleVisited = useCallback((siteId: string) => {
    setVisitedSites(prev => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId); else next.add(siteId);
      localStorage.setItem("vedictatva_visited_sites", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleShare = useCallback((platform: string, goal: typeof pilgrimageGoals[0]) => {
    const completed = goal.siteIds.filter(id => visitedSites.has(id)).length;
    const total = goal.siteIds.length;
    const pct = Math.round((completed / total) * 100);
    const text = `I've completed ${completed}/${total} (${pct}%) of the ${goal.title} on my spiritual journey with Vedic Tatva! #VedicTatva #SpiritualJourney #${goal.id.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    const url = "https://vedictatva.com/temple-tourism";
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    let shareUrl = "";
    if (platform === "twitter") shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    else if (platform === "facebook") shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    else if (platform === "whatsapp") shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    else if (platform === "copy") { navigator.clipboard.writeText(`${text}\n${url}`); return; }
    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
  }, [visitedSites]);

  const filteredSites = useMemo(() => {
    return pilgrimageSites.filter(site => {
      const matchesCategory = selectedCategory === "all" || site.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.nameHindi.includes(searchQuery) ||
        site.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.deity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.famousFor.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <>
      <PageSeo
        title="Sacred Pilgrimage Map of India — Temple Tourism | Vedic Tatva"
        description="Explore 50+ sacred pilgrimage sites across India including 12 Jyotirlingas, Shakti Peethas, Char Dham, Holy Rivers, Famous Yatras, and renowned temples. Plan your spiritual journey with how-to-reach guides, best visiting times, and insider tips."
        canonical="/temple-tourism"
        twitterCard="summary_large_image"
        schemas={[{
          id: "tourist-attraction",
          payload: {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: "Sacred Pilgrimage Sites of India — Interactive Temple Tourism Map",
            description: "Explore 50+ sacred pilgrimage sites across India including 12 Jyotirlingas, Shakti Peethas, Char Dham, Holy Rivers, Famous Yatras, and renowned temples. Plan your spiritual journey with how-to-reach guides, best visiting times, and insider tips.",
            url: "https://vedictatva.com/temple-tourism",
            touristType: ["Pilgrimage", "Religious Tourism", "Spiritual Tourism"],
            geo: { "@type": "GeoCoordinates", latitude: "20.5937", longitude: "78.9629" },
            isAccessibleForFree: true,
          },
        }]}
      />
      <div className="min-h-screen bg-[#F5F0E6]" data-testid="temple-tourism-page">
        <header className="relative overflow-hidden border-b border-[#D4AF37]/30">
          <div className="absolute inset-0">
            <img src={templeHeroImg} alt="Sacred temples of India" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#1a1118]/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#6D2B35]/70 via-[#3a1a20]/85 to-[#1a1118]/95" />
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <span className="h-px w-6 bg-[#D4AF37]" />
                <span className="text-[#D4AF37] font-semibold tracking-[0.3em] text-[10px] uppercase">Temple Tourism Encyclopedia</span>
                <span className="h-px w-6 bg-[#D4AF37]" />
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-3 leading-tight" data-testid="temple-tourism-title">
                Sacred Pilgrimage Map of India
                <span className="block text-[#D4AF37] text-base md:text-xl mt-2 font-normal tracking-wide">भारत का पवित्र तीर्थ यात्रा मानचित्र</span>
              </h1>
              <p className="text-white/70 mx-auto text-[13px] md:text-sm leading-relaxed max-w-2xl">
                Your complete spiritual travel encyclopedia — 12 Jyotirlingas, Shakti Peethas, Char Dham, sacred rivers, famous yatras, holy cities, renowned temples and ancient trek trails.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-white/65 text-[12px]">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> {pilgrimageSites.length}+ Sacred Sites</span>
                <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> All 12 Jyotirlingas</span>
                <span className="inline-flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Major Shakti Peethas</span>
                <span className="inline-flex items-center gap-1.5"><Waves className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Holy Rivers & Yatras</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-0 z-40 bg-[#FBF7EE]/95 backdrop-blur-md border-b border-[#D4AF37]/25" aria-label="Pilgrimage categories">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors border ${
                      active
                        ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]"
                        : "bg-white text-[#6D2B35] border-[#D4AF37]/25 hover:bg-[#FBF7EE]"
                    }`}
                    data-testid={`category-filter-${cat.id}`}
                  >
                    <cat.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {cat.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${active ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-[#FBF7EE] text-[#6D2B35]/70 border border-[#D4AF37]/20"}`}>{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-2.5 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/45" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Search temples, cities, deities, rivers, yatras…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-md border border-[#D4AF37]/30 bg-white text-[13px] text-[#3a1a20] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                data-testid="temple-search-input"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("map")}
                className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider border transition-colors ${viewMode === "map" ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30 hover:bg-[#FBF7EE]"}`}
                data-testid="view-map-btn"
              >
                <MapIcon className="h-4 w-4" strokeWidth={1.8} /> Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider border transition-colors ${viewMode === "list" ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30 hover:bg-[#FBF7EE]"}`}
                data-testid="view-list-btn"
              >
                <BookOpen className="h-4 w-4" strokeWidth={1.8} /> Encyclopedia
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {viewMode === "map" && (
              <div className="lg:col-span-2">
                <div className="relative overflow-hidden bg-white border border-[#D4AF37]/25 rounded-lg" data-testid="india-map-container">
                  <div className="p-3.5 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#FBF7EE]">
                    <h2 className="font-serif font-semibold text-[15px] text-[#6D2B35]">Sacred Pilgrimage Map <span className="text-[11px] font-normal text-[#5a4a3a]/55 ml-1">भारत का तीर्थ मानचित्र</span></h2>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">{filteredSites.length} sites</span>
                  </div>
                  <div className="relative" style={{ height: '600px' }}>
                    <LeafletMap sites={filteredSites} selectedSite={selectedSite} onSelectSite={setSelectedSite} />
                  </div>
                  <div className="px-4 py-2.5 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-[#D4AF37]/20 bg-[#FBF7EE]/70">
                    {categories.filter(c => c.id !== "all").map(cat => (
                      <div key={cat.id} className="flex items-center gap-1.5 text-[10px] text-[#5a4a3a]/65"><div className={`w-2 h-2 rounded-full ${cat.color}`} /><span>{cat.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={viewMode === "list" ? "lg:col-span-3" : "lg:col-span-1"}>
              <AnimatePresence mode="wait">
                {selectedSite ? (
                  <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <div className="overflow-hidden border border-[#D4AF37]/30 bg-white rounded-lg" data-testid="site-detail-card">
                      <div className="relative p-5 text-white overflow-hidden border-b border-[#D4AF37]/30" style={{ backgroundColor: selectedSite.color }}>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                        <button onClick={() => setSelectedSite(null)} className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors z-10" data-testid="close-site-detail" aria-label="Close"><X className="h-3.5 w-3.5" strokeWidth={1.8} /></button>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold opacity-85">{categories.find(c => c.id === selectedSite.category)?.label}</span>
                        <h2 className="font-serif font-semibold text-xl mt-1.5" data-testid="site-detail-name">{selectedSite.name}</h2>
                        <p className="text-[13px] opacity-80">{selectedSite.nameHindi}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[12px] opacity-80"><MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />{selectedSite.location}</div>
                        {selectedSite.annualVisitors && <div className="flex items-center gap-1.5 mt-1 text-[11px] opacity-70"><Users className="h-3 w-3" strokeWidth={1.8} />{selectedSite.annualVisitors} annual visitors</div>}
                      </div>
                      <div className="p-5 space-y-4">
                        <p className="text-[13px] text-[#5a4a3a]/80 leading-relaxed" data-testid="site-detail-description">{selectedSite.description}</p>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">Famous For</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSite.famousFor.map((f, i) => (
                              <span key={i} className="text-[11px] px-2 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${selectedSite.color}10`, color: selectedSite.color, borderColor: `${selectedSite.color}40` }}>{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Deity</span><p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedSite.deity}</p></div>
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Rating</span><div className="flex items-center gap-1 mt-0.5"><Star className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" /><span className="text-[13px] font-semibold text-[#6D2B35]">{selectedSite.rating}</span></div></div>
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Best Time</span><p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedSite.bestTime}</p></div>
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Established</span><p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedSite.established}</p></div>
                        </div>
                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-4">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-3 flex items-center gap-1.5"><Navigation className="h-3 w-3" strokeWidth={1.8} /> How to Reach</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-[12px]"><Plane className="h-3.5 w-3.5 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /><div><span className="font-semibold text-[#6D2B35]">By Air: </span><span className="text-[#5a4a3a]/75">{selectedSite.howToReach.air}</span></div></div>
                            <div className="flex items-start gap-2 text-[12px]"><Train className="h-3.5 w-3.5 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /><div><span className="font-semibold text-[#6D2B35]">By Rail: </span><span className="text-[#5a4a3a]/75">{selectedSite.howToReach.rail}</span></div></div>
                            <div className="flex items-start gap-2 text-[12px]"><Car className="h-3.5 w-3.5 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /><div><span className="font-semibold text-[#6D2B35]">By Road: </span><span className="text-[#5a4a3a]/75">{selectedSite.howToReach.road}</span></div></div>
                          </div>
                        </div>
                        <div className="bg-[#6D2B35]/5 rounded-md p-4 border border-[#D4AF37]/30">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2 flex items-center gap-1.5"><Info className="h-3 w-3" strokeWidth={1.8} /> Insider Tips & Know-How</h4>
                          <p className="text-[12px] text-[#5a4a3a]/80 leading-relaxed">{selectedSite.knowHow}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => toggleVisited(selectedSite.id)} className={`flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider border transition-colors ${visitedSites.has(selectedSite.id) ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] border-[#6D2B35]"}`} data-testid="mark-visited-btn">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {visitedSites.has(selectedSite.id) ? "Visited" : "Mark Visited"}
                          </button>
                          <button onClick={() => { const text = `I visited ${selectedSite.name} (${selectedSite.nameHindi}) — ${selectedSite.significance}! #VedicTatva #SpiritualJourney`; const url = "https://vedictatva.com/temple-tourism"; window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank"); }} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/40 hover:bg-[#6D2B35]/5 transition-colors" data-testid="share-site-btn">
                            <Share2 className="h-3.5 w-3.5" strokeWidth={1.8} /> Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="yatras" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="border border-[#D4AF37]/25 rounded-lg overflow-hidden bg-white" data-testid="yatra-circuits-card">
                      <div className="p-4 border-b border-[#D4AF37]/20 bg-[#FBF7EE]">
                        <h3 className="font-serif font-semibold text-[15px] text-[#6D2B35] flex items-center gap-2"><Route className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} /> Major Yatras & Darshan Circuits</h3>
                        <p className="text-[11px] text-[#5a4a3a]/55 mt-0.5">Clubbed pilgrimages & famous yatra routes</p>
                      </div>
                      <div className="divide-y divide-[#D4AF37]/15">
                        {[
                          { name: "Char Dham Yatra", nameHindi: "चार धाम यात्रा", description: "The supreme Hindu pilgrimage — Badrinath, Kedarnath, Gangotri & Yamunotri in the Himalayas.", sites: ["Yamunotri → Gangotri → Kedarnath → Badrinath"], duration: "10-12 Days", difficulty: "Moderate to Difficult", color: "#3B82F6", season: "May - October", icon: Mountain, howToReach: "Start from Haridwar/Rishikesh. Book GMVN packages or private tours. Helicopter options available.", tips: "Open only 6 months. Start from Yamunotri. Carry warm clothes, rain gear. Altitude sickness above 3,000m possible." },
                          { name: "12 Jyotirlinga Darshan", nameHindi: "१२ ज्योतिर्लिंग दर्शन", description: "Visit all 12 divine Jyotirlingas where Lord Shiva manifested as infinite pillars of light across 10+ states.", sites: ["Somnath → Nageshwar → Mahakaleshwar → Omkareshwar → Bhimashankar → Trimbakeshwar → Grishneshwar → Vaidyanath → Kashi Vishwanath → Kedarnath → Rameshwaram → Mallikarjuna"], duration: "20-30 Days", difficulty: "Moderate", color: "#EA580C", season: "October - March", icon: Flame, howToReach: "Plan region-wise: Western (Gujarat-Maharashtra), Central (MP), Northern (UP-Uttarakhand), Eastern (Jharkhand), Southern (TN-AP)", tips: "Somnath → clockwise is traditional. Can be done in segments over multiple trips." },
                          { name: "Shakti Peetha Yatra", nameHindi: "शक्तिपीठ यात्रा", description: "Visit the sacred shrines of the Divine Mother — where parts of Goddess Sati's body fell across the subcontinent.", sites: ["Vaishno Devi → Vindhyavasini → Kalighat → Kamakhya → Ambaji → Srisailam"], duration: "12-15 Days", difficulty: "Moderate", color: "#9333EA", season: "Navratri (March/October)", icon: Crown, howToReach: "Multiple routes possible — plan region-wise. All major Shakti Peethas well connected by road/rail.", tips: "Visit during Navratri for the most powerful experience. Kamakhya during Ambubachi Mela (June) is extraordinary." },
                          { name: "Kawad Yatra", nameHindi: "काँवड़ यात्रा", description: "The massive Shravan month pilgrimage carrying sacred Ganga water from Haridwar. Millions walk barefoot chanting 'Bol Bam!'", sites: ["Haridwar → Meerut → Delhi → Deoghar"], duration: "3-15 Days", difficulty: "Moderate", color: "#D97706", season: "July - August (Shravan)", icon: Footprints, howToReach: "Start from Haridwar. Ganga water collected at Har Ki Pauri. Return to local temples or Baidyanath Dham.", tips: "Kawad must not touch ground once filled. Free food camps line the route." },
                          { name: "Narmada Parikrama", nameHindi: "नर्मदा परिक्रमा", description: "The epic 2,600 km circumambulation of River Narmada on foot — takes 3+ years for the full journey.", sites: ["Amarkantak → Omkareshwar → Maheshwar → Bharuch → Back along south bank"], duration: "3 Years (full) / 108 Days (short)", difficulty: "Extreme / Moderate", color: "#0891B2", season: "Year-round", icon: Waves, howToReach: "Start at Amarkantak in Madhya Pradesh. Most walk. Some ashrams provide basic amenities along the route.", tips: "Walk with river on right (clockwise). Never cross the river by bridge. Short versions covering key sites exist." },
                          { name: "South India Temple Circuit", nameHindi: "दक्षिण भारत मंदिर परिक्रमा", description: "Explore magnificent Dravidian temples — towering gopurams, ancient rituals, and 2,000+ years of architectural wonders.", sites: ["Tirupati → Srirangam → Thanjavur → Madurai → Rameshwaram → Guruvayur"], duration: "10-15 Days", difficulty: "Easy", color: "#059669", season: "October - March", icon: Building, howToReach: "Fly into Chennai or Madurai. Well-connected rail network. KSRTC/TNSTC buses available.", tips: "South Indian temples have strict dress codes. Most close 12-4 PM. Eat at temple Annadanam for authentic experience." },
                          { name: "Om Parvat Yatra", nameHindi: "ॐ पर्वत यात्रा", description: "Trek to witness the sacred Om symbol naturally formed by snow on Om Parvat (6,191m) in the Kumaon Himalayas near Adi Kailash.", sites: ["Dharchula → Gala → Budhi → Gunji → Nabhidhang → Om Parvat viewpoint"], duration: "12-14 Days", difficulty: "Difficult", color: "#7C3AED", season: "June - September", icon: Mountain, howToReach: "Reach Dharchula from Delhi via Kathgodam/Pithoragarh. Inner Line Permit required. KMVN organizes group treks.", tips: "Altitude reaches 5,000m+. Carry all essentials. Limited mobile connectivity. Inner Line Permit mandatory from SDM Dharchula." },
                          { name: "Panch Kedar Yatra", nameHindi: "पंच केदार यात्रा", description: "Visit all five Kedars in Uttarakhand where different body parts of Lord Shiva appeared — an advanced Himalayan pilgrimage.", sites: ["Kedarnath → Tungnath → Rudranath → Madhyamaheshwar → Kalpeshwar"], duration: "14-18 Days", difficulty: "Difficult", color: "#B45309", season: "May - October", icon: Mountain, howToReach: "Start from Rishikesh/Haridwar. Each Kedar requires separate treks. Kalpeshwar is the only one accessible year-round.", tips: "Tungnath is the highest Shiva temple in the world (3,680m). Do Kalpeshwar last as it's easiest. Rudranath trek is the most challenging." },
                        ].map((circuit, i) => {
                          const isOpen = expandedCircuit === i;
                          const CircuitIcon = circuit.icon;
                          return (
                            <div key={i} data-testid={`yatra-dropdown-${i}`}>
                              <button onClick={() => setExpandedCircuit(isOpen ? null : i)} className="w-full text-left px-4 py-3 hover:bg-[#FBF7EE] transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: `${circuit.color}10`, color: circuit.color, borderColor: `${circuit.color}30` }}>
                                    <CircuitIcon className="h-4 w-4" strokeWidth={1.8} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[13px] font-semibold text-[#6D2B35]">{circuit.name}</p>
                                      <span className="text-[10px] text-[#5a4a3a]/40">{circuit.nameHindi}</span>
                                    </div>
                                    <p className="text-[11px] text-[#5a4a3a]/55 truncate mt-0.5">{circuit.duration} · {circuit.season}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${circuit.color}10`, color: circuit.color, borderColor: `${circuit.color}30` }}>{circuit.difficulty}</span>
                                    {isOpen ? <ChevronUp className="h-4 w-4 text-[#6D2B35]/40" /> : <ChevronDown className="h-4 w-4 text-[#6D2B35]/40" />}
                                  </div>
                                </div>
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-4 pb-4 space-y-2.5">
                                      <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{circuit.description}</p>
                                      {circuit.sites.map((s, j) => (
                                        <div key={j} className="text-[11px] px-3 py-2 rounded-md font-semibold" style={{ backgroundColor: `${circuit.color}08`, color: circuit.color, borderLeft: `2px solid ${circuit.color}` }}>
                                          <Route className="h-3 w-3 inline mr-1.5" strokeWidth={1.8} />{s}
                                        </div>
                                      ))}
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-2"><span className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Duration</span><p className="text-[11px] font-semibold text-[#6D2B35] mt-0.5">{circuit.duration}</p></div>
                                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-2"><span className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Level</span><p className="text-[11px] font-semibold text-[#6D2B35] mt-0.5">{circuit.difficulty}</p></div>
                                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-2"><span className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Season</span><p className="text-[11px] font-semibold text-[#6D2B35] mt-0.5">{circuit.season}</p></div>
                                      </div>
                                      <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3">
                                        <span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold flex items-center gap-1"><Navigation className="h-2.5 w-2.5" strokeWidth={1.8} /> How to Reach</span>
                                        <p className="text-[11px] text-[#5a4a3a]/70 mt-1 leading-relaxed">{circuit.howToReach}</p>
                                      </div>
                                      <div className="bg-[#6D2B35]/5 rounded-md p-3 border border-[#D4AF37]/30">
                                        <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold flex items-center gap-1"><Info className="h-2.5 w-2.5" strokeWidth={1.8} /> Insider Tips</span>
                                        <p className="text-[11px] text-[#5a4a3a]/70 mt-1 leading-relaxed">{circuit.tips}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ===== EXPLORE BY STATE ===== */}
          <section className="mt-12 mb-8" aria-labelledby="explore-by-state">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-[#D4AF37]/30" />
              <h2 id="explore-by-state" className="font-serif text-lg font-semibold text-[#6D2B35]">Explore by State</h2>
              <div className="h-px flex-1 bg-[#D4AF37]/30" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stateData.map((st) => {
                const isExpanded = expandedState === st.name;
                const groupedByCat: Record<string, PilgrimageSite[]> = {};
                st.sites.forEach(s => { const cat = categories.find(c => c.id === s.category); const label = cat?.label || s.category; if (!groupedByCat[label]) groupedByCat[label] = []; groupedByCat[label].push(s); });
                return (
                  <motion.div key={st.name} layout className={isExpanded ? "col-span-2 md:col-span-3 lg:col-span-4" : ""}>
                    <div className={`bg-white border border-[#D4AF37]/25 rounded-lg overflow-hidden transition-colors cursor-pointer ${isExpanded ? '' : 'hover:border-[#D4AF37]/45'}`} data-testid={`state-card-${st.name}`}>
                      <button onClick={() => setExpandedState(isExpanded ? null : st.name)} className="w-full text-left p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-[12px] border" style={{ backgroundColor: st.color, borderColor: st.color }}>{st.sites.length}</div>
                            <div>
                              <h3 className="text-[13px] font-semibold text-[#6D2B35]">{st.name}</h3>
                              <p className="text-[10px] text-[#5a4a3a]/45 mt-0.5">{st.nameHindi}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {st.sites.slice(0, 3).map((s, i) => {
                                const CatIcon = categories.find(c => c.id === s.category)?.icon || MapPin;
                                return <div key={i} className="w-4 h-4 rounded-sm flex items-center justify-center text-white border border-white" style={{ backgroundColor: s.color }}><CatIcon className="h-2 w-2" strokeWidth={2} /></div>;
                              })}
                              {st.sites.length > 3 && <div className="w-4 h-4 rounded-sm flex items-center justify-center bg-[#FBF7EE] text-[#6D2B35] text-[8px] font-bold border border-white">+{st.sites.length - 3}</div>}
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-[#6D2B35]/40" /> : <ChevronDown className="h-4 w-4 text-[#6D2B35]/40" />}
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-[#D4AF37]/15">
                            <div className="px-4 py-4 space-y-4">
                              {Object.entries(groupedByCat).map(([catLabel, sites]) => {
                                const catObj = categories.find(c => c.label === catLabel);
                                const CatIcon = catObj?.icon || MapPin;
                                return (
                                  <div key={catLabel}>
                                    <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-[#D4AF37]/15">
                                      <div className={`w-5 h-5 rounded-sm ${catObj?.color || 'bg-[#6D2B35]'} flex items-center justify-center`}>
                                        <CatIcon className="h-2.5 w-2.5 text-white" strokeWidth={2} />
                                      </div>
                                      <span className="text-[11px] font-semibold text-[#6D2B35] uppercase tracking-wider">{catLabel}</span>
                                      <span className="text-[10px] text-[#5a4a3a]/40">({sites.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                      {sites.map(site => (
                                        <div
                                          key={site.id}
                                          onClick={(e) => { e.stopPropagation(); setSelectedSite(site); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                          className="p-3 rounded-md bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37]/55 transition-colors cursor-pointer group"
                                          data-testid={`state-site-${site.id}`}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: `${site.color}10`, color: site.color, borderColor: `${site.color}30` }}>
                                              <CatIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <p className="text-[12px] font-semibold text-[#6D2B35] truncate group-hover:text-[#D4AF37] transition-colors">{site.name}</p>
                                                <span className="text-[10px] text-[#5a4a3a]/40">{site.nameHindi}</span>
                                              </div>
                                              <p className="text-[10px] text-[#5a4a3a]/55 truncate mt-0.5">{site.location}</p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              {visitedSites.has(site.id) && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />}
                                              <Star className="h-3 w-3 text-[#D4AF37] fill-[#D4AF37]" />
                                              <span className="text-[10px] font-semibold text-[#6D2B35]">{site.rating}</span>
                                            </div>
                                          </div>
                                          <p className="text-[10px] text-[#5a4a3a]/60 mt-2 line-clamp-2 leading-relaxed">{site.description.slice(0, 120)}…</p>
                                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${site.color}10`, color: site.color, borderColor: `${site.color}30` }}>{site.significance.split("—")[0].trim()}</span>
                                            <span className="text-[10px] text-[#5a4a3a]/40 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" strokeWidth={1.8} /> {site.bestTime}</span>
                                            {site.annualVisitors && <span className="text-[10px] text-[#5a4a3a]/40 flex items-center gap-0.5"><Users className="h-2.5 w-2.5" strokeWidth={1.8} /> {site.annualVisitors}</span>}
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#D4AF37]/15">
                                            <span className="text-[10px] text-[#5a4a3a]/45 flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" strokeWidth={1.8} /> {site.deity}</span>
                                            <span className="ml-auto text-[10px] text-[#6D2B35]/45 group-hover:text-[#D4AF37] transition-colors flex items-center gap-0.5 font-semibold">View <ChevronRight className="h-3 w-3" /></span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ===== PILGRIMAGE GOALS & SOCIAL SHOWOFF ===== */}
          <section className="mt-12 mb-8" aria-labelledby="pilgrimage-goals">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-[#6D2B35]/10" />
              <h2 id="pilgrimage-goals" className="font-['Playfair_Display'] text-xl text-[#6D2B35] flex items-center gap-2"><Trophy className="h-5 w-5 text-[#D4AF37]" /> Pilgrimage Goals & Achievements</h2>
              <div className="h-px flex-1 bg-[#6D2B35]/10" />
            </div>
            <p className="text-center text-sm text-[#5a4a3a]/50 mb-6 max-w-2xl mx-auto">Track your spiritual journey by marking temples you've visited. Complete goals to earn badges and share your progress with friends and family!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pilgrimageGoals.map((goal) => {
                const completed = goal.siteIds.filter(id => visitedSites.has(id)).length;
                const total = goal.siteIds.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isComplete = completed === total;
                const GoalIcon = goal.icon;
                return (
                  <div key={goal.id} className={`overflow-hidden bg-white rounded-lg border ${isComplete ? 'border-[#D4AF37]/55' : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/45'} transition-colors`} data-testid={`goal-card-${goal.id}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center border" style={{ backgroundColor: `${goal.color}10`, color: goal.color, borderColor: `${goal.color}30` }}>
                            <GoalIcon className="h-4 w-4" strokeWidth={1.8} />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-semibold text-[#6D2B35]">{goal.title}</h3>
                            <p className="text-[10px] text-[#5a4a3a]/45 mt-0.5">{goal.titleHindi}</p>
                          </div>
                        </div>
                        {isComplete && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-md">
                            <Award className="h-3 w-3 text-[#D4AF37]" strokeWidth={1.8} />
                            <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">{goal.badge}</span>
                          </div>
                        )}
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-[#5a4a3a]/55 font-medium">{completed}/{total} completed</span>
                          <span className="text-[11px] font-bold" style={{ color: goal.color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#FBF7EE] rounded-sm overflow-hidden border border-[#D4AF37]/15">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full" style={{ backgroundColor: goal.color }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {goal.siteIds.map(siteId => {
                          const site = pilgrimageSites.find(s => s.id === siteId);
                          if (!site) return null;
                          const visited = visitedSites.has(siteId);
                          return (
                            <div key={siteId} className="flex items-center gap-2 group">
                              <button onClick={() => toggleVisited(siteId)} className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0 ${visited ? 'border-emerald-600 bg-emerald-600' : 'border-[#5a4a3a]/25 hover:border-emerald-500'}`} data-testid={`visit-check-${siteId}`}>
                                {visited && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2} />}
                              </button>
                              <button onClick={() => { setSelectedSite(site); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`text-[11px] flex-1 text-left truncate transition-colors ${visited ? 'text-emerald-600 line-through opacity-65' : 'text-[#5a4a3a]/75 hover:text-[#6D2B35]'}`}>
                                {site.name} <span className="text-[10px] text-[#5a4a3a]/35">— {site.nameHindi}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#D4AF37]/15">
                        <span className="text-[10px] text-[#5a4a3a]/45 mr-auto uppercase tracking-wider font-semibold">Share</span>
                        <button onClick={() => handleShare("twitter", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-twitter-${goal.id}`}><Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" strokeWidth={1.8} /></button>
                        <button onClick={() => handleShare("facebook", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-fb-${goal.id}`}><Facebook className="h-3.5 w-3.5 text-[#4267B2]" strokeWidth={1.8} /></button>
                        <button onClick={() => handleShare("whatsapp", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-wa-${goal.id}`}>
                          <svg className="h-3.5 w-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.614-5.963-1.672l-.427-.254-2.755.872.856-2.688-.278-.442A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" /></svg>
                        </button>
                        <button onClick={() => handleShare("copy", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-copy-${goal.id}`}><Link2 className="h-3.5 w-3.5 text-[#5a4a3a]/55" strokeWidth={1.8} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="border border-[#D4AF37]/30 bg-white rounded-lg overflow-hidden" data-testid="overall-progress-card">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-md bg-[#6D2B35] border border-[#D4AF37]/40 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-base text-[#6D2B35]">Your Spiritual Journey</h3>
                        <p className="text-[11px] text-[#5a4a3a]/60 mt-0.5">Overall pilgrimage progress across all goals</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { v: visitedSites.size, l: "Sites Visited", c: "#6D2B35" },
                          { v: pilgrimageSites.length, l: "Total Sites", c: "#6D2B35" },
                          { v: pilgrimageGoals.filter(g => g.siteIds.every(id => visitedSites.has(id))).length, l: "Goals Done", c: "#D4AF37" },
                          { v: pilgrimageGoals.length, l: "Total Goals", c: "#6D2B35" },
                          { v: new Set(pilgrimageSites.filter(s => visitedSites.has(s.id)).map(s => s.state)).size, l: "States Covered", c: "#6D2B35" },
                          { v: `${Math.round((visitedSites.size / pilgrimageSites.length) * 100)}%`, l: "Complete", c: "#6D2B35" },
                        ].map((s) => (
                          <div key={s.l} className="text-center p-2.5 bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md">
                            <p className="text-xl font-bold font-serif" style={{ color: s.c }}>{s.v}</p>
                            <p className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold mt-1">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center pt-4 border-t border-[#D4AF37]/20">
                    <button onClick={() => { const text = `I've visited ${visitedSites.size}/${pilgrimageSites.length} sacred sites across India on my spiritual journey with @VedicTatva! #SpiritualJourney #VedicTatva #TempleTourism`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://vedictatva.com/temple-tourism")}`, "_blank"); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-[#1DA1F2] hover:bg-[#1a91da] text-white border border-[#1DA1F2] transition-colors" data-testid="share-overall-twitter"><Twitter className="h-3.5 w-3.5" strokeWidth={1.8} /> Twitter</button>
                    <button onClick={() => { const text = `I've visited ${visitedSites.size}/${pilgrimageSites.length} sacred sites across India! Check out the Vedic Tatva pilgrimage map: https://vedictatva.com/temple-tourism #SpiritualJourney`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-[#25D366] hover:bg-[#1faa54] text-white border border-[#25D366] transition-colors" data-testid="share-overall-whatsapp">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                      WhatsApp
                    </button>
                    <button onClick={() => { const text = `My Vedic Tatva Pilgrimage Progress:\n${visitedSites.size}/${pilgrimageSites.length} sacred sites visited\n${pilgrimageGoals.filter(g => g.siteIds.every(id => visitedSites.has(id))).length}/${pilgrimageGoals.length} goals completed\n\nTrack your spiritual journey: https://vedictatva.com/temple-tourism`; navigator.clipboard.writeText(text); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-white text-[#6D2B35] border border-[#D4AF37]/40 hover:bg-[#FBF7EE] transition-colors" data-testid="share-overall-copy"><Link2 className="h-3.5 w-3.5" strokeWidth={1.8} /> Copy</button>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section className="mb-10">
            <Link href="/route-planner">
              <div className="cursor-pointer group" data-testid="route-planner-cta">
                <div className="relative overflow-hidden rounded-lg border border-[#D4AF37]/40 hover:border-[#D4AF37]/65 transition-colors" style={{ backgroundColor: "#6D2B35" }}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                  <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 sm:p-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-md bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1">AI-Powered</span>
                      <h3 className="font-serif font-semibold text-lg sm:text-xl text-white">Plan Your Pilgrimage Route</h3>
                      <p className="text-[12px] text-white/70 leading-relaxed max-w-xl mt-1">AI-generated personalised itineraries with travel tips, accommodation, local food, packing lists and sacred mantras for your journey.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-[#D4AF37] hover:bg-[#c19c2e] text-[#3a1a20] font-semibold text-[12px] uppercase tracking-wider border border-[#D4AF37] transition-colors">
                        Plan Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.8} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          <section className="mb-8" aria-labelledby="yatra-tips">
            <div className="border border-[#D4AF37]/25 rounded-lg overflow-hidden bg-white" data-testid="yatra-tips-section">
              <div className="p-5 bg-[#6D2B35] text-white border-b border-[#D4AF37]/40 relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                <h2 id="yatra-tips" className="font-serif font-semibold text-lg text-white">Essential Yatra Planning Guide</h2>
                <p className="text-[12px] text-white/70 mt-0.5">Everything you need to know before starting your pilgrimage</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#D4AF37]/15">
                {[
                  { icon: Calendar, title: "Plan Around Festivals", desc: "Visiting during festivals like Navratri, Shivaratri, or Janmashtami enhances the spiritual experience manifold. Book accommodation months in advance for popular festivals." },
                  { icon: Clock, title: "Early Morning Darshan", desc: "Most temples open at 4-5 AM. Early morning darshan has shortest queues and the most peaceful, meditative atmosphere. Bhasma Aarti, Mangla Aarti — all happen at dawn." },
                  { icon: Heart, title: "Respect Local Customs", desc: "Dress modestly (no shorts/sleeveless), remove footwear, cover head at Gurdwaras. Some temples don't allow leather items. Non-veg food is prohibited in many holy cities." },
                  { icon: Mountain, title: "Altitude Preparation", desc: "For Himalayan pilgrimages (Char Dham, Amarnath, Hemkund), acclimatize properly. Carry medicines for altitude sickness. Get medical fitness certificate for high-altitude treks." },
                  { icon: Train, title: "Book Transport Early", desc: "Train tickets sell out 60-120 days before for popular routes. IRCTC Tatkal opens at 10 AM. Consider helicopter services for Kedarnath, Vaishno Devi, Amarnath — book weeks ahead." },
                  { icon: Footprints, title: "Walking Pilgrimages", desc: "For Kawad Yatra, Govardhan Parikrama, Narmada Parikrama — break in your footwear beforehand. Carry minimal luggage. Many routes have free food camps (langar/bhandara)." },
                  { icon: Sun, title: "Weather & Seasons", desc: "Most North Indian temples: Oct-Mar best. South Indian temples: Year-round. Himalayan temples: May-Oct only. Monsoon adds beauty to Western Ghat temples. Summer in plains can be extreme." },
                  { icon: Globe, title: "Digital Tools", desc: "IRCTC for trains, Shrine Board apps for Vaishno Devi/Amarnath, TTD app for Tirupati, online Aarti booking for Mahakaleshwar. Google Maps works for most locations. Keep offline maps for remote treks." },
                ].map((tip, i) => (
                  <div key={i} className="bg-white p-4" data-testid={`yatra-tip-${i}`}>
                    <div className="w-7 h-7 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mb-2.5">
                      <tip.icon className="h-3.5 w-3.5 text-[#6D2B35]" strokeWidth={1.8} />
                    </div>
                    <h4 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1">{tip.title}</h4>
                    <p className="text-[11px] text-[#5a4a3a]/70 leading-relaxed">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <PageAPlusContent
            eyebrow="Why Plan Temple Yatra With Vedic Tatva"
            title="Hindu Temple Tourism — Char Dham, Jyotirlinga, Shakti Peeth Yatra"
            intro="Temple yatra is the highest pilgrimage in Sanatan tradition. From Char Dham (Kedarnath, Badrinath, Gangotri, Yamunotri) to 12 Jyotirlingas, 51 Shakti Peeths, Tirupati, Vaishno Devi, Jagannath Puri, Rameshwaram and Shirdi — Vedic Tatva helps you plan complete yatra with darshan timings, route maps, accommodation and special puja booking."
            trustBadges={[
              { value: "500+", label: "Sacred Temples" },
              { value: "12", label: "Jyotirlingas" },
              { value: "51", label: "Shakti Peeths" },
              { value: "Live", label: "Darshan Timings" },
            ]}
            benefits={[
              { icon: Mountain, title: "Char Dham Yatra Planning", body: "Complete itinerary for Char Dham (Uttarakhand) and Chota Char Dham — Kedarnath, Badrinath, Gangotri, Yamunotri — with helicopter, road & trek options, weather alerts and seasonal opening dates." },
              { icon: Flame, title: "12 Jyotirlinga Tour", body: "Plan Dwadash Jyotirlinga yatra — Somnath, Mallikarjuna, Mahakaleshwar, Omkareshwar, Kedarnath, Bhimashankar, Vishweshwar (Kashi), Trimbakeshwar, Vaidyanath, Nageshwar, Rameshwaram, Grishneshwar." },
              { icon: Crown, title: "51 Shakti Peeths", body: "Discover all 51 Shakti Peeths across India, Nepal, Bangladesh, Sri Lanka, Pakistan and Tibet — with shloka, presiding Devi name, body part legend and travel guidance." },
              { icon: Clock, title: "Live Darshan Timings", body: "Real-time darshan timings, abhishek slot booking, special puja windows, festival schedules and crowd advisories for major temples." },
              { icon: Route, title: "Detailed Route Planner", body: "Train, flight, road and trek route guidance with distance, duration, recommended stops and budget estimates for every major pilgrimage." },
              { icon: BookOpen, title: "Sthala Purana & History", body: "Read the authentic sthala purana (temple legend), history, presiding deity story, and ritual significance of every temple — deepen your darshan experience." },
            ]}
            steps={[
              { title: "Choose Yatra Type", body: "Pick from Char Dham, 12 Jyotirlinga, 51 Shakti Peeth, Sapta Puri, Pancharama Kshetra, single-temple visit or custom multi-temple yatra." },
              { title: "Plan Route & Dates", body: "Build your itinerary with route maps, transport options, accommodation suggestions and seasonal best-time advisories." },
              { title: "Book Special Puja", body: "Reserve Rudra Abhishek (Jyotirlinga), Maha Aarti, Sahasranama Archana or special darshan slots in advance." },
              { title: "Travel & Darshan", body: "Receive day-by-day yatra checklist, dress code, samagri and prasad guidance. Track darshan, share with family back home." },
            ]}
            faqs={[
              { q: "Which is the best time for Char Dham Yatra?", a: "Char Dham (Kedarnath, Badrinath, Gangotri, Yamunotri) opens around late April/early May (Akshaya Tritiya for some) and closes by mid-November (around Diwali) due to heavy snowfall. Best months are May-June and September-October — avoiding peak monsoon (July-August) when landslides are common." },
              { q: "What are the 12 Jyotirlingas?", a: "Somnath (Gujarat), Mallikarjuna (Andhra Pradesh), Mahakaleshwar (Ujjain, MP), Omkareshwar (MP), Kedarnath (Uttarakhand), Bhimashankar (Maharashtra), Kashi Vishweshwar (Varanasi, UP), Trimbakeshwar (Maharashtra), Vaidyanath (Jharkhand), Nageshwar (Gujarat), Rameshwaram (Tamil Nadu), Grishneshwar (Maharashtra)." },
              { q: "What are the 51 Shakti Peeths?", a: "The 51 Shakti Peeths are sacred sites associated with parts of Devi Sati's body falling during Lord Shiva's tandav. The lists vary slightly across traditions (Devi Bhagavata Purana, Pithanirnaya, Tantra Chudamani). Widely venerated peeths include Kamakhya (Assam), Kalighat (Kolkata), Jwalamukhi (HP), Mahalakshmi (Kolhapur), Hinglaj (Pakistan), Tara Tarini (Odisha) and Dakshineswar Kali (Kolkata)." },
              { q: "How do I book darshan at Tirupati or Vaishno Devi?", a: "For Tirupati Balaji, online darshan booking is available 60-90 days in advance via TTD. For Vaishno Devi, RFID yatra registration is mandatory. Vedic Tatva integrates with both — book special darshan slots, accommodation and helicopter directly through our platform." },
              { q: "Can I do Kedarnath yatra without trekking?", a: "Yes — helicopter services from Phata, Sersi and Guptkashi operate during yatra season (May-Nov). Booking opens 3 months in advance via IRCTC heli services. Vedic Tatva helps plan helicopter combo packages that cover Kedarnath in a single day from Dehradun/Haridwar." },
              { q: "What is the dress code for temple darshan?", a: "Most major South Indian temples (Tirupati, Padmanabhaswamy, Guruvayur, Sabarimala) require traditional dress — dhoti for men, saree/sari or salwar for women. Many temples disallow leather items, photography inside sanctum, and require head-cover. We provide temple-specific dress codes for every yatra." },
              { q: "Can I book special pujas in advance?", a: "Yes — Vedic Tatva partners with major temples for advance booking of Rudra Abhishek (Jyotirlinga temples), Maha Aarti (Kashi, Ujjain), Sahasranama Archana (Tirupati), Suprabhata Seva and other special rituals. Book online before your yatra." },
              { q: "Is there a recommended yatra order for spiritual benefit?", a: "Traditionally: (1) Sapta Puri (7 holy cities — Ayodhya, Mathura, Haridwar, Kashi, Kanchipuram, Ujjain, Dwarka), (2) Char Dham (Badrinath, Dwarka, Puri, Rameshwaram), (3) Chota Char Dham (Uttarakhand), (4) 12 Jyotirlingas. Many devotees do Kashi-Prayagraj-Ayodhya as their first major yatra." },
            ]}
            keywordsBlurb="Hindu temple tourism and pilgrimage yatra — Char Dham yatra (Kedarnath, Badrinath, Gangotri, Yamunotri), 12 Jyotirlinga darshan (Somnath, Mahakaleshwar, Kashi Vishwanath, Rameshwaram, Trimbakeshwar), 51 Shakti Peeth (Kamakhya, Vaishno Devi, Kalighat, Jwalamukhi), Sapta Puri (Ayodhya, Mathura, Haridwar, Kashi, Kanchipuram, Ujjain, Dwarka). Tirupati Balaji darshan booking, Vaishno Devi RFID registration, Kedarnath helicopter booking, Sabarimala yatra. Live darshan timings, special puja booking, sthala purana, dress code, accommodation and complete pilgrimage planning for every Hindu temple in India."
          />
        </div>
      </div>
    </>
  );
}