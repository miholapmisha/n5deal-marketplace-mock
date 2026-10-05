import type { Prisma } from "../../src/generated/prisma/client";
import { DEMO_ACCOUNTS } from "../../src/lib/demo-accounts";
import { daysAgo } from "./time";

export type SeedUser = Omit<Prisma.UserCreateManyInput, "passwordHash">;

export const AURORA_SUSPENSION_REASON =
  "Ownership documents for two listings could not be verified. Suspended pending review.";

export const managers: SeedUser[] = [
  {
    id: "usr_manager_demo",
    email: DEMO_ACCOUNTS.manager,
    name: "Anna Lindqvist",
    companyName: "N5Deal",
    role: "MANAGER",
    createdAt: daysAgo(120),
  },
  {
    id: "usr_manager_compliance",
    email: "compliance@demo.n5deal",
    name: "Robert Hale",
    companyName: "N5Deal",
    role: "MANAGER",
    createdAt: daysAgo(118),
  },
];

export const sellers: SeedUser[] = [
  {
    id: "usr_seller_demo",
    email: DEMO_ACCOUNTS.seller,
    name: "Elena Vasquez",
    companyName: "Baltic Fintech Holdings",
    role: "SELLER",
    createdAt: daysAgo(90),
  },
  {
    id: "usr_seller_meridian",
    email: "thomas.grech@meridian-advisory.example",
    name: "Thomas Grech",
    companyName: "Meridian Corporate Advisory",
    role: "SELLER",
    createdAt: daysAgo(110),
  },
  {
    id: "usr_seller_thames",
    email: "oliver.bennett@thames-licensing.example",
    name: "Oliver Bennett",
    companyName: "Thames Licensing Partners",
    role: "SELLER",
    createdAt: daysAgo(105),
  },
  {
    id: "usr_seller_nordlicht",
    email: "katrin.hoffmann@nordlicht-finanz.example",
    name: "Katrin Hoffmann",
    companyName: "Nordlicht Finanz GmbH",
    role: "SELLER",
    createdAt: daysAgo(80),
  },
  {
    id: "usr_seller_vistula",
    email: "marek.kowalczyk@vistula-capital.example",
    name: "Marek Kowalczyk",
    companyName: "Vistula Capital",
    role: "SELLER",
    createdAt: daysAgo(70),
  },
  {
    id: "usr_seller_aurora",
    email: "daniel.ross@aurora-brokers.example",
    name: "Daniel Ross",
    companyName: "Aurora Asset Brokers",
    role: "SELLER",
    status: "SUSPENDED",
    statusReason: AURORA_SUSPENSION_REASON,
    createdAt: daysAgo(60),
  },
];

export const buyers: SeedUser[] = [
  { id: "usr_buyer_demo", email: DEMO_ACCOUNTS.buyer, name: "James Whitfield", companyName: "Northbridge Capital Partners", role: "BUYER", createdAt: daysAgo(85) },
  { id: "usr_buyer_adriatic", email: "sofia.marin@adriatic-payments.example", name: "Sofia Marin", companyName: "Adriatic Payments Group", role: "BUYER", createdAt: daysAgo(78) },
  { id: "usr_buyer_alpenrose", email: "lukas.brenner@alpenrose-fo.example", name: "Lukas Brenner", companyName: "Alpenrose Family Office", role: "BUYER", createdAt: daysAgo(75) },
  { id: "usr_buyer_crescent", email: "aisha.rahman@crescentpay.example", name: "Aisha Rahman", companyName: "Crescent Pay", role: "BUYER", createdAt: daysAgo(66) },
  { id: "usr_buyer_lowlands", email: "pieter.devries@lowlands-digital.example", name: "Pieter de Vries", companyName: "Lowlands Digital Assets", role: "BUYER", createdAt: daysAgo(64) },
  { id: "usr_buyer_silva", email: "mateo.silva@mail.example", name: "Mateo Silva", companyName: null, role: "BUYER", createdAt: daysAgo(58) },
  { id: "usr_buyer_greywater", email: "helen.carter@greywater.example", name: "Helen Carter", companyName: "Greywater Capital", role: "BUYER", createdAt: daysAgo(55) },
  { id: "usr_buyer_atlantico", email: "rafael.costa@atlantico-ventures.example", name: "Rafael Costa", companyName: "Atlântico Ventures", role: "BUYER", createdAt: daysAgo(50) },
  { id: "usr_buyer_kumo", email: "yuki.tanaka@kumo-payments.example", name: "Yuki Tanaka", companyName: "Kumo Payments", role: "BUYER", createdAt: daysAgo(47) },
  { id: "usr_buyer_petrova", email: "nadia.petrova@petrova-holdings.example", name: "Nadia Petrova", companyName: "Petrova Holdings", role: "BUYER", createdAt: daysAgo(41) },
  { id: "usr_buyer_maple", email: "ethan.brooks@mapleledger.example", name: "Ethan Brooks", companyName: "Maple Ledger", role: "BUYER", createdAt: daysAgo(36) },
  { id: "usr_buyer_fjord", email: "ingrid.lund@fjord-growth.example", name: "Ingrid Lund", companyName: "Fjord Growth Partners", role: "BUYER", createdAt: daysAgo(30) },
  { id: "usr_buyer_bianchi", email: "marco.bianchi@bianchi-figli.example", name: "Marco Bianchi", companyName: "Bianchi & Figli", role: "BUYER", createdAt: daysAgo(25) },
  { id: "usr_buyer_martin", email: "chloe.martin@mail.example", name: "Chloe Martin", companyName: null, role: "BUYER", createdAt: daysAgo(19) },
  { id: "usr_buyer_danube", email: "viktor.novak@danube-fintech.example", name: "Viktor Novak", companyName: "Danube Fintech Partners", role: "BUYER", createdAt: daysAgo(40) },
];

export const buyerProfiles: Prisma.BuyerProfileCreateManyInput[] = [
  {
    userId: "usr_buyer_demo",
    buyerType: "PE_FUND",
    ticketMinEur: 500_000,
    ticketMaxEur: 3_000_000,
    categories: ["EMI", "PAYMENT", "FINTECH"],
    countries: ["LT", "MT", "IE", "NL", "CY"],
    statusPref: "ACTIVE",
    timeline: "WITHIN_3_MONTHS",
    thesis:
      "Mid-market private equity fund building a pan-European payments platform. We acquire operating EMIs and payment institutions with clean regulatory records, safeguarding in place, and a management team willing to stay for at least 18 months. Preference for EEA passporting and existing SEPA access.",
  },
  {
    userId: "usr_buyer_adriatic",
    buyerType: "STRATEGIC",
    ticketMinEur: 1_000_000,
    ticketMaxEur: 5_000_000,
    categories: ["PAYMENT", "EMI"],
    countries: ["MT", "CY", "IE"],
    statusPref: "ACTIVE",
    timeline: "IMMEDIATE",
    thesis:
      "Payment group expanding into the EU from the Western Balkans. Looking for an operating institution with card issuing or acquiring capability that we can migrate our merchant base onto within six months.",
  },
  {
    userId: "usr_buyer_alpenrose",
    buyerType: "FAMILY_OFFICE",
    ticketMinEur: 10_000_000,
    ticketMaxEur: 30_000_000,
    categories: ["BANK"],
    countries: ["DE", "CH", "NL"],
    statusPref: "ACTIVE",
    timeline: "WITHIN_6_MONTHS",
    thesis:
      "Single-family office seeking a small, well-capitalised bank in the DACH region or the Netherlands as a long-term holding. Conservative risk appetite; private banking or SME lending focus preferred.",
  },
  {
    userId: "usr_buyer_crescent",
    buyerType: "FINTECH_OPERATOR",
    ticketMinEur: 200_000,
    ticketMaxEur: 1_000_000,
    categories: ["EMI"],
    countries: [],
    statusPref: "ANY",
    timeline: "IMMEDIATE",
    thesis:
      "Remittance app with 400k users looking for its own e-money licence to stop relying on a banking-as-a-service partner. Open to any EEA or UK jurisdiction; license-only shells are fine if the regulator relationship is clean.",
  },
  {
    userId: "usr_buyer_lowlands",
    buyerType: "FINTECH_OPERATOR",
    ticketMinEur: 300_000,
    ticketMaxEur: 1_500_000,
    categories: ["CRYPTO"],
    countries: ["NL", "EE", "LT", "MT"],
    statusPref: "LICENSE_ONLY",
    timeline: "WITHIN_3_MONTHS",
    thesis:
      "Digital asset custody provider that needs a MiCA CASP authorisation to passport across the EU. We bring our own technology and team, so a license-only entity is our preferred structure.",
  },
  {
    userId: "usr_buyer_silva",
    buyerType: "INDIVIDUAL",
    ticketMinEur: 30_000,
    ticketMaxEur: 200_000,
    categories: ["PAYMENT"],
    countries: ["CA", "GB"],
    statusPref: "LICENSE_ONLY",
    timeline: "EXPLORING",
    thesis:
      "Entrepreneur with a background in cross-border payroll. Exploring a small money services business registration in Canada or a small payment institution in the UK to launch a niche payout product.",
  },
  {
    userId: "usr_buyer_greywater",
    buyerType: "PE_FUND",
    ticketMinEur: 5_000_000,
    ticketMaxEur: 25_000_000,
    categories: ["BANK", "FINTECH"],
    countries: ["GB", "IE"],
    statusPref: "ACTIVE",
    timeline: "WITHIN_6_MONTHS",
    thesis:
      "Growth equity fund targeting UK and Irish specialist lenders and challenger banks with proven unit economics. We look for profitable or near-profitable businesses with a deposit franchise or committed funding lines.",
  },
  {
    userId: "usr_buyer_atlantico",
    buyerType: "STRATEGIC",
    ticketMinEur: 500_000,
    ticketMaxEur: 4_000_000,
    categories: [],
    countries: ["PL", "CZ", "LT", "LV", "EE"],
    statusPref: "ANY",
    timeline: "WITHIN_3_MONTHS",
    thesis:
      "Iberian fintech group entering Central and Eastern Europe. Open to any licence type that gives us a regulated foothold in Poland, Czechia, or the Baltics; integration plan is already prepared.",
  },
  {
    userId: "usr_buyer_kumo",
    buyerType: "STRATEGIC",
    ticketMinEur: 2_000_000,
    ticketMaxEur: 8_000_000,
    categories: ["PAYMENT", "EMI"],
    countries: ["GB", "NL", "DE"],
    statusPref: "ACTIVE",
    timeline: "IMMEDIATE",
    thesis:
      "Asian payment processor establishing a European hub. Requires an operating institution with an established compliance function, in-house MLRO, and existing scheme memberships.",
  },
  {
    userId: "usr_buyer_petrova",
    buyerType: "FAMILY_OFFICE",
    ticketMinEur: 1_000_000,
    ticketMaxEur: 3_000_000,
    categories: ["CRYPTO", "FINTECH"],
    countries: ["CH", "CY", "MT"],
    statusPref: "ANY",
    timeline: "EXPLORING",
    thesis:
      "Family office diversifying into regulated digital-asset and wealth-tech businesses. Interested in Swiss FinTech licences and Cypriot investment firms with a clean supervisory history.",
  },
  {
    userId: "usr_buyer_maple",
    buyerType: "FINTECH_OPERATOR",
    ticketMinEur: 50_000,
    ticketMaxEur: 700_000,
    categories: ["CRYPTO", "PAYMENT"],
    countries: ["CA"],
    statusPref: "ANY",
    timeline: "IMMEDIATE",
    thesis:
      "Canadian crypto on-ramp looking to acquire an existing FINTRAC-registered MSB with virtual currency dealing to shorten our time to market by a year.",
  },
  {
    userId: "usr_buyer_fjord",
    buyerType: "PE_FUND",
    ticketMinEur: null,
    ticketMaxEur: null,
    categories: ["FINTECH", "EMI"],
    countries: ["EE", "LT", "LV"],
    statusPref: "ANY",
    timeline: "EXPLORING",
    thesis:
      "Nordic venture fund mapping the Baltic fintech market. Ticket size depends on the asset; we co-invest alongside strategic operators and can move quickly on the right opportunity.",
  },
  {
    userId: "usr_buyer_bianchi",
    buyerType: "FAMILY_OFFICE",
    ticketMinEur: 3_000_000,
    ticketMaxEur: 12_000_000,
    categories: ["BANK", "EMI"],
    countries: ["MT", "CY"],
    statusPref: "ACTIVE",
    timeline: "WITHIN_6_MONTHS",
    thesis:
      "Italian family office reviewing Mediterranean banks and EMIs. Profile is hidden from sellers while we complete an internal mandate review.",
    isVisible: false,
  },
  {
    userId: "usr_buyer_martin",
    buyerType: "INDIVIDUAL",
    ticketMinEur: 100_000,
    ticketMaxEur: 400_000,
    categories: ["EMI", "PAYMENT"],
    countries: ["IE", "GB"],
    statusPref: "LICENSE_ONLY",
    timeline: "WITHIN_3_MONTHS",
    thesis:
      "Former payments compliance lead planning to launch a B2B treasury product. Looking for a small EMI or payment institution licence in Ireland or the UK with no legacy clients.",
  },
  {
    userId: "usr_buyer_danube",
    buyerType: "STRATEGIC",
    ticketMinEur: 800_000,
    ticketMaxEur: 2_500_000,
    categories: ["PAYMENT"],
    countries: ["CZ", "PL", "DE"],
    statusPref: "ACTIVE",
    timeline: "WITHIN_3_MONTHS",
    thesis:
      "Regional acquiring business consolidating payment institutions in Central Europe. We want licensed entities with merchant portfolios we can migrate onto our processing stack.",
  },
];
