// Curated geo database for common Indian and world birth places.
// lat (north +), lon (east +), tz IANA name. Falls back to OSM Nominatim for misses (cached in ai_cache).

export interface CityRecord {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
  aliases?: string[];
}

export const CITIES: CityRecord[] = [
  // -------- INDIA: National capital region & metros --------
  { name:"Delhi",        state:"Delhi", country:"India", lat:28.6139, lon:77.2090, tz:"Asia/Kolkata", aliases:["new delhi","दिल्ली","नई दिल्ली"] },
  { name:"Mumbai",       state:"Maharashtra", country:"India", lat:19.0760, lon:72.8777, tz:"Asia/Kolkata", aliases:["bombay","मुंबई","मुम्बई"] },
  { name:"Bengaluru",    state:"Karnataka", country:"India", lat:12.9716, lon:77.5946, tz:"Asia/Kolkata", aliases:["bangalore","बेंगलुरु","बेंगलूर","ಬೆಂಗಳೂರು"] },
  { name:"Chennai",      state:"Tamil Nadu", country:"India", lat:13.0827, lon:80.2707, tz:"Asia/Kolkata", aliases:["madras","चेन्नई","சென்னை"] },
  { name:"Kolkata",      state:"West Bengal", country:"India", lat:22.5726, lon:88.3639, tz:"Asia/Kolkata", aliases:["calcutta","कोलकाता","কলকাতা"] },
  { name:"Hyderabad",    state:"Telangana", country:"India", lat:17.3850, lon:78.4867, tz:"Asia/Kolkata", aliases:["हैदराबाद","హైదరాబాద్"] },
  { name:"Ahmedabad",    state:"Gujarat", country:"India", lat:23.0225, lon:72.5714, tz:"Asia/Kolkata", aliases:["अहमदाबाद","અમદાવાદ"] },
  { name:"Pune",         state:"Maharashtra", country:"India", lat:18.5204, lon:73.8567, tz:"Asia/Kolkata", aliases:["पुणे"] },
  { name:"Surat",        state:"Gujarat", country:"India", lat:21.1702, lon:72.8311, tz:"Asia/Kolkata", aliases:["सूरत","સુરત"] },
  { name:"Jaipur",       state:"Rajasthan", country:"India", lat:26.9124, lon:75.7873, tz:"Asia/Kolkata", aliases:["जयपुर"] },
  { name:"Lucknow",      state:"Uttar Pradesh", country:"India", lat:26.8467, lon:80.9462, tz:"Asia/Kolkata", aliases:["लखनऊ"] },
  { name:"Kanpur",       state:"Uttar Pradesh", country:"India", lat:26.4499, lon:80.3319, tz:"Asia/Kolkata", aliases:["कानपुर"] },
  { name:"Nagpur",       state:"Maharashtra", country:"India", lat:21.1458, lon:79.0882, tz:"Asia/Kolkata", aliases:["नागपुर"] },
  { name:"Indore",       state:"Madhya Pradesh", country:"India", lat:22.7196, lon:75.8577, tz:"Asia/Kolkata", aliases:["इंदौर"] },
  { name:"Thane",        state:"Maharashtra", country:"India", lat:19.2183, lon:72.9781, tz:"Asia/Kolkata" },
  { name:"Bhopal",       state:"Madhya Pradesh", country:"India", lat:23.2599, lon:77.4126, tz:"Asia/Kolkata", aliases:["भोपाल"] },
  { name:"Visakhapatnam",state:"Andhra Pradesh", country:"India", lat:17.6868, lon:83.2185, tz:"Asia/Kolkata", aliases:["vizag","विशाखापत्तनम"] },
  { name:"Patna",        state:"Bihar", country:"India", lat:25.5941, lon:85.1376, tz:"Asia/Kolkata", aliases:["पटना"] },
  { name:"Vadodara",     state:"Gujarat", country:"India", lat:22.3072, lon:73.1812, tz:"Asia/Kolkata", aliases:["baroda","वडोदरा"] },
  { name:"Ghaziabad",    state:"Uttar Pradesh", country:"India", lat:28.6692, lon:77.4538, tz:"Asia/Kolkata", aliases:["गाज़ियाबाद"] },
  { name:"Ludhiana",     state:"Punjab", country:"India", lat:30.9000, lon:75.8573, tz:"Asia/Kolkata", aliases:["लुधियाना"] },
  { name:"Agra",         state:"Uttar Pradesh", country:"India", lat:27.1767, lon:78.0081, tz:"Asia/Kolkata", aliases:["आगरा"] },
  { name:"Nashik",       state:"Maharashtra", country:"India", lat:19.9975, lon:73.7898, tz:"Asia/Kolkata", aliases:["नाशिक","नासिक"] },
  { name:"Faridabad",    state:"Haryana", country:"India", lat:28.4089, lon:77.3178, tz:"Asia/Kolkata", aliases:["फरीदाबाद"] },
  { name:"Meerut",       state:"Uttar Pradesh", country:"India", lat:28.9845, lon:77.7064, tz:"Asia/Kolkata", aliases:["मेरठ"] },
  { name:"Rajkot",       state:"Gujarat", country:"India", lat:22.3039, lon:70.8022, tz:"Asia/Kolkata", aliases:["राजकोट"] },
  { name:"Varanasi",     state:"Uttar Pradesh", country:"India", lat:25.3176, lon:82.9739, tz:"Asia/Kolkata", aliases:["banaras","kashi","वाराणसी","काशी","बनारस"] },
  { name:"Srinagar",     state:"Jammu and Kashmir", country:"India", lat:34.0837, lon:74.7973, tz:"Asia/Kolkata", aliases:["श्रीनगर"] },
  { name:"Aurangabad",   state:"Maharashtra", country:"India", lat:19.8762, lon:75.3433, tz:"Asia/Kolkata", aliases:["chhatrapati sambhajinagar"] },
  { name:"Dhanbad",      state:"Jharkhand", country:"India", lat:23.7957, lon:86.4304, tz:"Asia/Kolkata", aliases:["धनबाद"] },
  { name:"Amritsar",     state:"Punjab", country:"India", lat:31.6340, lon:74.8723, tz:"Asia/Kolkata", aliases:["अमृतसर"] },
  { name:"Allahabad",    state:"Uttar Pradesh", country:"India", lat:25.4358, lon:81.8463, tz:"Asia/Kolkata", aliases:["prayagraj","प्रयागराज","इलाहाबाद"] },
  { name:"Ranchi",       state:"Jharkhand", country:"India", lat:23.3441, lon:85.3096, tz:"Asia/Kolkata", aliases:["रांची"] },
  { name:"Howrah",       state:"West Bengal", country:"India", lat:22.5958, lon:88.2636, tz:"Asia/Kolkata" },
  { name:"Coimbatore",   state:"Tamil Nadu", country:"India", lat:11.0168, lon:76.9558, tz:"Asia/Kolkata", aliases:["कोयंबटूर"] },
  { name:"Jabalpur",     state:"Madhya Pradesh", country:"India", lat:23.1815, lon:79.9864, tz:"Asia/Kolkata", aliases:["जबलपुर"] },
  { name:"Gwalior",      state:"Madhya Pradesh", country:"India", lat:26.2183, lon:78.1828, tz:"Asia/Kolkata", aliases:["ग्वालियर"] },
  { name:"Vijayawada",   state:"Andhra Pradesh", country:"India", lat:16.5062, lon:80.6480, tz:"Asia/Kolkata" },
  { name:"Jodhpur",      state:"Rajasthan", country:"India", lat:26.2389, lon:73.0243, tz:"Asia/Kolkata", aliases:["जोधपुर"] },
  { name:"Madurai",      state:"Tamil Nadu", country:"India", lat:9.9252,  lon:78.1198, tz:"Asia/Kolkata", aliases:["मदुरै"] },
  { name:"Raipur",       state:"Chhattisgarh", country:"India", lat:21.2514, lon:81.6296, tz:"Asia/Kolkata", aliases:["रायपुर"] },
  { name:"Kota",         state:"Rajasthan", country:"India", lat:25.2138, lon:75.8648, tz:"Asia/Kolkata", aliases:["कोटा"] },
  { name:"Chandigarh",   state:"Chandigarh", country:"India", lat:30.7333, lon:76.7794, tz:"Asia/Kolkata", aliases:["चंडीगढ़"] },
  { name:"Guwahati",     state:"Assam", country:"India", lat:26.1445, lon:91.7362, tz:"Asia/Kolkata", aliases:["गुवाहाटी"] },
  { name:"Solapur",      state:"Maharashtra", country:"India", lat:17.6599, lon:75.9064, tz:"Asia/Kolkata" },
  { name:"Hubballi",     state:"Karnataka", country:"India", lat:15.3647, lon:75.1240, tz:"Asia/Kolkata", aliases:["hubli","dharwad"] },
  { name:"Mysuru",       state:"Karnataka", country:"India", lat:12.2958, lon:76.6394, tz:"Asia/Kolkata", aliases:["mysore","मैसूर"] },
  { name:"Tiruchirappalli", state:"Tamil Nadu", country:"India", lat:10.7905, lon:78.7047, tz:"Asia/Kolkata", aliases:["trichy"] },
  { name:"Bareilly",     state:"Uttar Pradesh", country:"India", lat:28.3670, lon:79.4304, tz:"Asia/Kolkata", aliases:["बरेली"] },
  { name:"Aligarh",      state:"Uttar Pradesh", country:"India", lat:27.8974, lon:78.0880, tz:"Asia/Kolkata", aliases:["अलीगढ़"] },
  { name:"Moradabad",    state:"Uttar Pradesh", country:"India", lat:28.8386, lon:78.7733, tz:"Asia/Kolkata", aliases:["मुरादाबाद"] },
  { name:"Jalandhar",    state:"Punjab", country:"India", lat:31.3260, lon:75.5762, tz:"Asia/Kolkata", aliases:["जालंधर"] },
  { name:"Bhubaneswar",  state:"Odisha", country:"India", lat:20.2961, lon:85.8245, tz:"Asia/Kolkata", aliases:["भुवनेश्वर"] },
  { name:"Salem",        state:"Tamil Nadu", country:"India", lat:11.6643, lon:78.1460, tz:"Asia/Kolkata" },
  { name:"Gurugram",     state:"Haryana", country:"India", lat:28.4595, lon:77.0266, tz:"Asia/Kolkata", aliases:["gurgaon","गुड़गांव","गुरुग्राम"] },
  { name:"Noida",        state:"Uttar Pradesh", country:"India", lat:28.5355, lon:77.3910, tz:"Asia/Kolkata", aliases:["नोएडा"] },
  { name:"Dehradun",     state:"Uttarakhand", country:"India", lat:30.3165, lon:78.0322, tz:"Asia/Kolkata", aliases:["देहरादून"] },
  { name:"Saharanpur",   state:"Uttar Pradesh", country:"India", lat:29.9680, lon:77.5450, tz:"Asia/Kolkata" },
  { name:"Gorakhpur",    state:"Uttar Pradesh", country:"India", lat:26.7606, lon:83.3732, tz:"Asia/Kolkata", aliases:["गोरखपुर"] },
  { name:"Bikaner",      state:"Rajasthan", country:"India", lat:28.0229, lon:73.3119, tz:"Asia/Kolkata", aliases:["बीकानेर"] },
  { name:"Amravati",     state:"Maharashtra", country:"India", lat:20.9374, lon:77.7796, tz:"Asia/Kolkata" },
  { name:"Ajmer",        state:"Rajasthan", country:"India", lat:26.4499, lon:74.6399, tz:"Asia/Kolkata", aliases:["अजमेर"] },
  { name:"Kolhapur",     state:"Maharashtra", country:"India", lat:16.7050, lon:74.2433, tz:"Asia/Kolkata", aliases:["कोल्हापुर"] },
  { name:"Belagavi",     state:"Karnataka", country:"India", lat:15.8497, lon:74.4977, tz:"Asia/Kolkata", aliases:["belgaum"] },
  { name:"Tirunelveli",  state:"Tamil Nadu", country:"India", lat:8.7139,  lon:77.7567, tz:"Asia/Kolkata" },
  { name:"Mangaluru",    state:"Karnataka", country:"India", lat:12.9141, lon:74.8560, tz:"Asia/Kolkata", aliases:["mangalore"] },
  { name:"Udaipur",      state:"Rajasthan", country:"India", lat:24.5854, lon:73.7125, tz:"Asia/Kolkata", aliases:["उदयपुर"] },
  { name:"Davanagere",   state:"Karnataka", country:"India", lat:14.4644, lon:75.9218, tz:"Asia/Kolkata" },
  { name:"Kozhikode",    state:"Kerala", country:"India", lat:11.2588, lon:75.7804, tz:"Asia/Kolkata", aliases:["calicut","कोझिकोड"] },
  { name:"Kochi",        state:"Kerala", country:"India", lat:9.9312,  lon:76.2673, tz:"Asia/Kolkata", aliases:["cochin","कोच्चि"] },
  { name:"Thiruvananthapuram", state:"Kerala", country:"India", lat:8.5241, lon:76.9366, tz:"Asia/Kolkata", aliases:["trivandrum","तिरुवनंतपुरम"] },
  { name:"Thrissur",     state:"Kerala", country:"India", lat:10.5276, lon:76.2144, tz:"Asia/Kolkata", aliases:["trichur"] },
  { name:"Akola",        state:"Maharashtra", country:"India", lat:20.7002, lon:77.0082, tz:"Asia/Kolkata" },
  { name:"Latur",        state:"Maharashtra", country:"India", lat:18.4088, lon:76.5604, tz:"Asia/Kolkata" },
  { name:"Dhule",        state:"Maharashtra", country:"India", lat:20.9042, lon:74.7749, tz:"Asia/Kolkata" },
  { name:"Ahmednagar",   state:"Maharashtra", country:"India", lat:19.0948, lon:74.7480, tz:"Asia/Kolkata" },
  { name:"Sangli",       state:"Maharashtra", country:"India", lat:16.8524, lon:74.5815, tz:"Asia/Kolkata" },
  { name:"Jamshedpur",   state:"Jharkhand", country:"India", lat:22.8046, lon:86.2029, tz:"Asia/Kolkata", aliases:["जमशेदपुर"] },
  { name:"Cuttack",      state:"Odisha", country:"India", lat:20.4625, lon:85.8830, tz:"Asia/Kolkata" },
  { name:"Imphal",       state:"Manipur", country:"India", lat:24.8170, lon:93.9368, tz:"Asia/Kolkata" },
  { name:"Shillong",     state:"Meghalaya", country:"India", lat:25.5788, lon:91.8933, tz:"Asia/Kolkata" },
  { name:"Aizawl",       state:"Mizoram", country:"India", lat:23.7271, lon:92.7176, tz:"Asia/Kolkata" },
  { name:"Itanagar",     state:"Arunachal Pradesh", country:"India", lat:27.0844, lon:93.6053, tz:"Asia/Kolkata" },
  { name:"Agartala",     state:"Tripura", country:"India", lat:23.8315, lon:91.2868, tz:"Asia/Kolkata" },
  { name:"Kohima",       state:"Nagaland", country:"India", lat:25.6747, lon:94.1086, tz:"Asia/Kolkata" },
  { name:"Gangtok",      state:"Sikkim", country:"India", lat:27.3389, lon:88.6065, tz:"Asia/Kolkata" },
  { name:"Panaji",       state:"Goa", country:"India", lat:15.4909, lon:73.8278, tz:"Asia/Kolkata", aliases:["panjim","goa"] },
  { name:"Port Blair",   state:"Andaman and Nicobar", country:"India", lat:11.6234, lon:92.7265, tz:"Asia/Kolkata" },
  { name:"Puducherry",   state:"Puducherry", country:"India", lat:11.9416, lon:79.8083, tz:"Asia/Kolkata", aliases:["pondicherry"] },
  { name:"Shimla",       state:"Himachal Pradesh", country:"India", lat:31.1048, lon:77.1734, tz:"Asia/Kolkata" },
  { name:"Jammu",        state:"Jammu and Kashmir", country:"India", lat:32.7266, lon:74.8570, tz:"Asia/Kolkata" },
  { name:"Leh",          state:"Ladakh", country:"India", lat:34.1526, lon:77.5770, tz:"Asia/Kolkata" },

  // -------- Pilgrimage / Tirth places --------
  { name:"Haridwar",     state:"Uttarakhand", country:"India", lat:29.9457, lon:78.1642, tz:"Asia/Kolkata", aliases:["हरिद्वार"] },
  { name:"Rishikesh",    state:"Uttarakhand", country:"India", lat:30.0869, lon:78.2676, tz:"Asia/Kolkata", aliases:["ऋषिकेश"] },
  { name:"Ayodhya",      state:"Uttar Pradesh", country:"India", lat:26.7922, lon:82.1998, tz:"Asia/Kolkata", aliases:["अयोध्या"] },
  { name:"Mathura",      state:"Uttar Pradesh", country:"India", lat:27.4924, lon:77.6737, tz:"Asia/Kolkata", aliases:["मथुरा"] },
  { name:"Vrindavan",    state:"Uttar Pradesh", country:"India", lat:27.5800, lon:77.7000, tz:"Asia/Kolkata", aliases:["वृंदावन"] },
  { name:"Tirupati",     state:"Andhra Pradesh", country:"India", lat:13.6288, lon:79.4192, tz:"Asia/Kolkata", aliases:["तिरुपति"] },
  { name:"Rameswaram",   state:"Tamil Nadu", country:"India", lat:9.2876,  lon:79.3129, tz:"Asia/Kolkata" },
  { name:"Puri",         state:"Odisha", country:"India", lat:19.8135, lon:85.8312, tz:"Asia/Kolkata", aliases:["jagannath puri"] },
  { name:"Dwarka",       state:"Gujarat", country:"India", lat:22.2394, lon:68.9678, tz:"Asia/Kolkata", aliases:["द्वारका"] },
  { name:"Somnath",      state:"Gujarat", country:"India", lat:20.8880, lon:70.4017, tz:"Asia/Kolkata" },
  { name:"Ujjain",       state:"Madhya Pradesh", country:"India", lat:23.1765, lon:75.7885, tz:"Asia/Kolkata", aliases:["उज्जैन"] },
  { name:"Bodh Gaya",    state:"Bihar", country:"India", lat:24.6961, lon:84.9911, tz:"Asia/Kolkata", aliases:["बोधगया"] },
  { name:"Pushkar",      state:"Rajasthan", country:"India", lat:26.4877, lon:74.5511, tz:"Asia/Kolkata" },
  { name:"Nathdwara",    state:"Rajasthan", country:"India", lat:24.9311, lon:73.8226, tz:"Asia/Kolkata" },
  { name:"Shirdi",       state:"Maharashtra", country:"India", lat:19.7645, lon:74.4769, tz:"Asia/Kolkata", aliases:["शिर्डी"] },
  { name:"Trimbakeshwar",state:"Maharashtra", country:"India", lat:19.9325, lon:73.5294, tz:"Asia/Kolkata" },
  { name:"Pandharpur",   state:"Maharashtra", country:"India", lat:17.6727, lon:75.3261, tz:"Asia/Kolkata" },
  { name:"Sabarimala",   state:"Kerala", country:"India", lat:9.4364,  lon:77.0807, tz:"Asia/Kolkata" },
  { name:"Guruvayur",    state:"Kerala", country:"India", lat:10.5947, lon:76.0411, tz:"Asia/Kolkata" },
  { name:"Kanyakumari",  state:"Tamil Nadu", country:"India", lat:8.0883,  lon:77.5385, tz:"Asia/Kolkata" },
  { name:"Kedarnath",    state:"Uttarakhand", country:"India", lat:30.7346, lon:79.0669, tz:"Asia/Kolkata" },
  { name:"Badrinath",    state:"Uttarakhand", country:"India", lat:30.7433, lon:79.4938, tz:"Asia/Kolkata" },
  { name:"Gangotri",     state:"Uttarakhand", country:"India", lat:30.9947, lon:78.9398, tz:"Asia/Kolkata" },
  { name:"Yamunotri",    state:"Uttarakhand", country:"India", lat:31.0151, lon:78.4596, tz:"Asia/Kolkata" },
  { name:"Vaishno Devi", state:"Jammu and Kashmir", country:"India", lat:33.0306, lon:74.9499, tz:"Asia/Kolkata", aliases:["katra"] },
  { name:"Amarnath",     state:"Jammu and Kashmir", country:"India", lat:34.2150, lon:75.5009, tz:"Asia/Kolkata" },
  { name:"Tirumala",     state:"Andhra Pradesh", country:"India", lat:13.6833, lon:79.3500, tz:"Asia/Kolkata" },
  { name:"Palani",       state:"Tamil Nadu", country:"India", lat:10.4500, lon:77.5167, tz:"Asia/Kolkata" },
  { name:"Chidambaram",  state:"Tamil Nadu", country:"India", lat:11.3994, lon:79.6952, tz:"Asia/Kolkata" },
  { name:"Kanchipuram",  state:"Tamil Nadu", country:"India", lat:12.8387, lon:79.7011, tz:"Asia/Kolkata" },
  { name:"Tiruvannamalai", state:"Tamil Nadu", country:"India", lat:12.2253, lon:79.0747, tz:"Asia/Kolkata" },

  // -------- World capitals & top diaspora hubs --------
  { name:"London",        country:"United Kingdom", lat:51.5074, lon:-0.1278, tz:"Europe/London" },
  { name:"New York",      country:"United States", lat:40.7128, lon:-74.0060, tz:"America/New_York", aliases:["nyc"] },
  { name:"Los Angeles",   country:"United States", lat:34.0522, lon:-118.2437, tz:"America/Los_Angeles", aliases:["la"] },
  { name:"Chicago",       country:"United States", lat:41.8781, lon:-87.6298, tz:"America/Chicago" },
  { name:"San Francisco", country:"United States", lat:37.7749, lon:-122.4194, tz:"America/Los_Angeles", aliases:["sf"] },
  { name:"Houston",       country:"United States", lat:29.7604, lon:-95.3698, tz:"America/Chicago" },
  { name:"Dallas",        country:"United States", lat:32.7767, lon:-96.7970, tz:"America/Chicago" },
  { name:"Boston",        country:"United States", lat:42.3601, lon:-71.0589, tz:"America/New_York" },
  { name:"Seattle",       country:"United States", lat:47.6062, lon:-122.3321, tz:"America/Los_Angeles" },
  { name:"Atlanta",       country:"United States", lat:33.7490, lon:-84.3880, tz:"America/New_York" },
  { name:"Washington",    country:"United States", lat:38.9072, lon:-77.0369, tz:"America/New_York", aliases:["washington dc","dc"] },
  { name:"Toronto",       country:"Canada", lat:43.6532, lon:-79.3832, tz:"America/Toronto" },
  { name:"Vancouver",     country:"Canada", lat:49.2827, lon:-123.1207, tz:"America/Vancouver" },
  { name:"Montreal",      country:"Canada", lat:45.5017, lon:-73.5673, tz:"America/Toronto" },
  { name:"Sydney",        country:"Australia", lat:-33.8688, lon:151.2093, tz:"Australia/Sydney" },
  { name:"Melbourne",     country:"Australia", lat:-37.8136, lon:144.9631, tz:"Australia/Melbourne" },
  { name:"Perth",         country:"Australia", lat:-31.9505, lon:115.8605, tz:"Australia/Perth" },
  { name:"Auckland",      country:"New Zealand", lat:-36.8485, lon:174.7633, tz:"Pacific/Auckland" },
  { name:"Singapore",     country:"Singapore", lat:1.3521,  lon:103.8198, tz:"Asia/Singapore" },
  { name:"Kuala Lumpur",  country:"Malaysia", lat:3.1390, lon:101.6869, tz:"Asia/Kuala_Lumpur" },
  { name:"Bangkok",       country:"Thailand", lat:13.7563, lon:100.5018, tz:"Asia/Bangkok" },
  { name:"Hong Kong",     country:"Hong Kong", lat:22.3193, lon:114.1694, tz:"Asia/Hong_Kong" },
  { name:"Tokyo",         country:"Japan", lat:35.6762, lon:139.6503, tz:"Asia/Tokyo" },
  { name:"Dubai",         country:"United Arab Emirates", lat:25.2048, lon:55.2708, tz:"Asia/Dubai", aliases:["uae"] },
  { name:"Abu Dhabi",     country:"United Arab Emirates", lat:24.4539, lon:54.3773, tz:"Asia/Dubai" },
  { name:"Doha",          country:"Qatar", lat:25.2854, lon:51.5310, tz:"Asia/Qatar" },
  { name:"Riyadh",        country:"Saudi Arabia", lat:24.7136, lon:46.6753, tz:"Asia/Riyadh" },
  { name:"Muscat",        country:"Oman", lat:23.5859, lon:58.4059, tz:"Asia/Muscat" },
  { name:"Kuwait City",   country:"Kuwait", lat:29.3759, lon:47.9774, tz:"Asia/Kuwait" },
  { name:"Manama",        country:"Bahrain", lat:26.2235, lon:50.5876, tz:"Asia/Bahrain" },
  { name:"Kathmandu",     country:"Nepal", lat:27.7172, lon:85.3240, tz:"Asia/Kathmandu" },
  { name:"Pokhara",       country:"Nepal", lat:28.2096, lon:83.9856, tz:"Asia/Kathmandu" },
  { name:"Colombo",       country:"Sri Lanka", lat:6.9271,  lon:79.8612, tz:"Asia/Colombo" },
  { name:"Dhaka",         country:"Bangladesh", lat:23.8103, lon:90.4125, tz:"Asia/Dhaka" },
  { name:"Karachi",       country:"Pakistan", lat:24.8607, lon:67.0011, tz:"Asia/Karachi" },
  { name:"Lahore",        country:"Pakistan", lat:31.5204, lon:74.3587, tz:"Asia/Karachi" },
  { name:"Islamabad",     country:"Pakistan", lat:33.6844, lon:73.0479, tz:"Asia/Karachi" },
  { name:"Paris",         country:"France", lat:48.8566, lon:2.3522, tz:"Europe/Paris" },
  { name:"Berlin",        country:"Germany", lat:52.5200, lon:13.4050, tz:"Europe/Berlin" },
  { name:"Frankfurt",     country:"Germany", lat:50.1109, lon:8.6821, tz:"Europe/Berlin" },
  { name:"Amsterdam",     country:"Netherlands", lat:52.3676, lon:4.9041, tz:"Europe/Amsterdam" },
  { name:"Zurich",        country:"Switzerland", lat:47.3769, lon:8.5417, tz:"Europe/Zurich" },
  { name:"Rome",          country:"Italy", lat:41.9028, lon:12.4964, tz:"Europe/Rome" },
  { name:"Madrid",        country:"Spain", lat:40.4168, lon:-3.7038, tz:"Europe/Madrid" },
  { name:"Birmingham",    country:"United Kingdom", lat:52.4862, lon:-1.8904, tz:"Europe/London" },
  { name:"Manchester",    country:"United Kingdom", lat:53.4808, lon:-2.2426, tz:"Europe/London" },
  { name:"Edinburgh",     country:"United Kingdom", lat:55.9533, lon:-3.1883, tz:"Europe/London" },
  { name:"Leicester",     country:"United Kingdom", lat:52.6369, lon:-1.1398, tz:"Europe/London" },
];

// Build a normalized index for lookup.
function norm(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s\u0900-\u097F]/g, " ").replace(/\s+/g, " ").trim();
}

const INDEX: Map<string, CityRecord> = new Map();
for (const c of CITIES) {
  INDEX.set(norm(c.name), c);
  if (c.aliases) for (const a of c.aliases) INDEX.set(norm(a), c);
}

export function findCityLocal(query: string): CityRecord | null {
  if (!query) return null;
  const q = norm(query);
  if (INDEX.has(q)) return INDEX.get(q)!;
  // Try first token (e.g., "Mumbai, India" -> "mumbai")
  const first = q.split(",")[0].trim().split(" ").slice(0, 3).join(" ");
  if (INDEX.has(first)) return INDEX.get(first)!;
  // Try first single word
  const firstWord = q.split(/[\s,]/)[0];
  if (firstWord && INDEX.has(firstWord)) return INDEX.get(firstWord)!;
  // Substring match (slow but small DB)
  for (const [k, v] of INDEX) {
    if (k.includes(q) || q.includes(k)) return v;
  }
  return null;
}

export function defaultCity(): CityRecord {
  return INDEX.get("delhi")!;
}
