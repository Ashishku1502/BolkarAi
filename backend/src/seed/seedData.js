require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Business = require("../models/Business");

const SAMPLE_BUSINESSES = [
  {
    name: "Hero Splendor",
    category: "Motorcycle",
    tagline: "India's best-selling commuter bike",
    description:
      "The Hero Splendor is a 100-125cc commuter motorcycle known for high fuel efficiency, low maintenance cost, and wide service network across India.",
    facts: {
      Engine: "97.2cc / 124.7cc (Plus/XTEC variants)",
      Mileage: "~65-80 km/l",
      Price: "₹75,000 - ₹90,000 (ex-showroom, approx.)",
      "Fuel Type": "Petrol",
      Weight: "~112 kg",
    },
    website: "https://www.heromotocorp.com",
    tags: ["motorcycle", "commuter bike", "hero", "two wheeler"],
    verified: true,
    lastVerifiedAt: new Date(),
  },
  {
    name: "Hyundai Creta",
    category: "Automobile - SUV",
    tagline: "Compact SUV with premium features",
    description:
      "The Hyundai Creta is a compact SUV popular in India for its feature-rich cabin, panoramic sunroof options, and a choice of petrol, diesel, and turbo engines.",
    facts: {
      Engine: "1.5L Petrol / 1.5L Diesel / 1.5L Turbo",
      Mileage: "~16-21 km/l",
      Price: "₹11 - ₹20.5 Lakh (ex-showroom, approx.)",
      Seating: "5",
      "Boot Space": "433 litres",
    },
    website: "https://www.hyundai.com/in/en",
    tags: ["suv", "hyundai", "car", "compact suv"],
    verified: true,
    lastVerifiedAt: new Date(),
  },
  {
    name: "Toyota Hyryder",
    category: "Automobile - SUV",
    tagline: "Strong-hybrid SUV built with Toyota and Suzuki engineering",
    description:
      "The Toyota Urban Cruiser Hyryder is a compact SUV offered with a strong-hybrid powertrain (shared with Maruti Grand Vitara) that delivers class-leading fuel efficiency.",
    facts: {
      Engine: "1.5L Petrol / 1.5L Strong Hybrid",
      Mileage: "~21-27 km/l (hybrid)",
      Price: "₹11.1 - ₹20.3 Lakh (ex-showroom, approx.)",
      Seating: "5",
      "Boot Space": "373 litres",
    },
    website: "https://www.toyotabharat.com",
    tags: ["suv", "toyota", "car", "hybrid suv"],
    verified: true,
    lastVerifiedAt: new Date(),
  },
  {
    name: "Ramesh Sharma & Associates",
    category: "Lawyer",
    tagline: "Civil and property law practice, Bengaluru",
    description:
      "A Bengaluru-based law firm specialising in civil disputes, property documentation, and tenancy law, with over 15 years of court experience.",
    facts: {
      Specialisation: "Civil, Property, Tenancy",
      Experience: "15+ years",
      "Consultation Fee": "₹1,500 (approx.)",
      City: "Bengaluru",
    },
    address: "MG Road, Bengaluru, Karnataka",
    phone: "+91-80-0000-0000",
    tags: ["lawyer", "advocate", "legal", "bengaluru", "property law"],
    verified: false,
  },
  {
    name: "SecureLife Family Health Plan",
    category: "Insurance Policy",
    tagline: "Family floater health insurance",
    description:
      "A family floater health insurance policy covering hospitalisation, day-care procedures, and an annual health checkup, with cashless treatment at a wide hospital network.",
    facts: {
      "Cover Amount": "₹5 Lakh - ₹1 Crore",
      "Annual Premium": "₹8,000 - ₹35,000 (approx., varies by age/cover)",
      "Waiting Period": "30 days for illness, 2-4 years for pre-existing conditions",
      "Network Hospitals": "10,000+",
    },
    tags: ["insurance", "health insurance", "family floater"],
    verified: true,
    lastVerifiedAt: new Date(),
  },
];

async function seed() {
  await connectDB();

  await Business.deleteMany({});
  const created = await Business.insertMany(SAMPLE_BUSINESSES);
  console.log(`[seed] inserted ${created.length} sample businesses`);

  await mongoose.disconnect();
  process.exit(0);
}

async function seedIfEmpty() {
  const count = await Business.countDocuments();
  if (count === 0) {
    console.log("[seed] collection is empty, auto-seeding sample businesses...");
    await Business.insertMany(SAMPLE_BUSINESSES);
    console.log(`[seed] auto-inserted ${SAMPLE_BUSINESSES.length} sample businesses`);
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
}

module.exports = { SAMPLE_BUSINESSES, seedIfEmpty };
