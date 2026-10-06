import type { Prisma } from "../../src/generated/prisma/client";
import { daysAgo } from "./time";

type ListingInput = Omit<
  Prisma.AssetCreateManyInput,
  "id" | "createdAt" | "updatedAt" | "publishedAt" | "otherLicenses"
> & {
  ageDays: number;
  otherLicenses?: string[];
};

export const HIDDEN_ASSET_REASON =
  "Licence status on the FCA register does not match this listing. Please confirm the current authorisation before relisting.";

function listing({ ageDays, otherLicenses = [], ...input }: ListingInput): Prisma.AssetCreateManyInput {
  const status = input.status ?? "PUBLISHED";
  const createdAt = daysAgo(ageDays, 3);
  const publishedAt = status === "DRAFT" ? null : daysAgo(ageDays);
  const id = `ast_${input.slug.split("-").at(-1)}`;
  return { ...input, id, status, otherLicenses, createdAt, publishedAt, updatedAt: publishedAt ?? createdAt };
}

const demoSellerAssets = [
  listing({
    slug: "lithuania-emi-101", sellerId: "usr_seller_demo", ageDays: 4,
    title: "Lithuanian EMI with direct SEPA access", category: "EMI", businessStatus: "ACTIVE",
    country: "LT", regulator: "Bank of Lithuania", licenseType: "EMI", yearOfIssue: 2019, employees: 14,
    priceEur: 1_850_000, benefits: ["Direct SEPA access", "Safeguarding account", "Low-risk client portfolio", "Full management team"],
    description: "Operating electronic money institution authorised by the Bank of Lithuania with EEA passporting in 18 countries. Direct SEPA Instant participation, own IBANs, and a B2B client base of 1,200 SMEs with no high-risk verticals. The MLRO and CFO are prepared to stay through the transition.",
  }),
  listing({
    slug: "latvia-pi-102", sellerId: "usr_seller_demo", ageDays: 11,
    title: "Latvian payment institution, license only", category: "PAYMENT", businessStatus: "LICENSE_ONLY",
    country: "LV", regulator: "Bank of Latvia", licenseType: "PI", yearOfIssue: 2021, employees: 2,
    priceEur: 420_000, benefits: ["EEA passporting", "Clean regulatory record"],
    description: "Payment institution licence issued by the Latvian regulator (now Bank of Latvia) covering money remittance and payment initiation services. Never onboarded clients, so there is no legacy portfolio to review. Two directors remain available for the change-of-control filing.",
  }),
  listing({
    slug: "estonia-casp-103", sellerId: "usr_seller_demo", ageDays: 19,
    title: "Estonian crypto custody and exchange business", category: "CRYPTO", businessStatus: "ACTIVE",
    country: "EE", regulator: "EFSA", licenseType: "CASP", otherLicenses: ["VASP (legacy)"], yearOfIssue: 2024, employees: 9,
    priceEur: 950_000, benefits: ["MiCA authorised", "Custody infrastructure", "EU passport"],
    description: "MiCA-authorised crypto-asset service provider supervised by the Estonian Financial Supervision Authority, licensed for custody, exchange, and transfer services. Comes with an audited custody stack, Travel Rule tooling, and 3,800 verified retail clients.",
  }),
  listing({
    slug: "lithuania-open-banking-104", sellerId: "usr_seller_demo", ageDays: 2, status: "DRAFT",
    title: "Lithuanian open banking provider (AISP/PISP)", category: "FINTECH", businessStatus: "LICENSE_ONLY",
    country: "LT", regulator: "Bank of Lithuania", licenseType: "PI (AISP/PISP)", yearOfIssue: 2022, employees: 3,
    priceEur: null, benefits: ["PSD2 API connections", "EEA passporting"],
    description: "Account information and payment initiation licence with live PSD2 connections to 2,100 European banks. The draft listing is waiting for the latest audited accounts before publishing.",
  }),
];

const meridianAssets = [
  listing({
    slug: "malta-emi-105", sellerId: "usr_seller_meridian", ageDays: 7,
    title: "Maltese EMI with CASP authorisation and card programme", category: "EMI", businessStatus: "ACTIVE",
    country: "MT", regulator: "MFSA", licenseType: "EMI", otherLicenses: ["CASP"], yearOfIssue: 2017, employees: 22,
    priceEur: 4_900_000, benefits: ["Dual EMI and CASP licensing", "Card issuing programme", "Mobile app", "Full management team"],
    description: "Dual-licensed Maltese company holding an EMI licence and a MiCA CASP authorisation. Runs a principal-member card programme, a white-label mobile app, and safeguarding with two EU banks. No outstanding debts, liabilities, or open supervisory findings.",
  }),
  listing({
    slug: "malta-casp-106", sellerId: "usr_seller_meridian", ageDays: 13,
    title: "Maltese MiCA CASP licence, ready to passport", category: "CRYPTO", businessStatus: "LICENSE_ONLY",
    country: "MT", regulator: "MFSA", licenseType: "CASP", yearOfIssue: 2025, employees: 1,
    priceEur: 750_000, benefits: ["MiCA authorised", "EU passport ready"],
    description: "Newly granted MiCA authorisation for custody and exchange of crypto-assets, with passport notifications prepared for 12 member states. The entity has not traded, which keeps the change-of-control review short.",
  }),
  listing({
    slug: "cyprus-emi-107", sellerId: "usr_seller_meridian", ageDays: 22,
    title: "Cypriot EMI serving iGaming merchants", category: "EMI", businessStatus: "ACTIVE",
    country: "CY", regulator: "Central Bank of Cyprus", licenseType: "EMI", yearOfIssue: 2018, employees: 11,
    priceEur: 2_300_000, benefits: ["Profitable", "Merchant acquiring", "Safeguarding account"],
    description: "Profitable electronic money institution authorised by the Central Bank of Cyprus, processing €40M a month for licensed iGaming and travel merchants. Recurring revenue with a 38% EBITDA margin over the last two financial years.",
  }),
  listing({
    slug: "cyprus-investment-firm-108", sellerId: "usr_seller_meridian", ageDays: 31,
    title: "Cyprus investment firm with retail brokerage", category: "FINTECH", businessStatus: "ACTIVE",
    country: "CY", regulator: "CySEC", licenseType: "Investment Firm (CIF)", yearOfIssue: 2016, employees: 18,
    priceEur: 1_600_000, benefits: ["MiFID II passport", "Trading platform", "Retail client base"],
    description: "CySEC-regulated investment firm with a full MiFID II licence, including reception and transmission of orders, execution, and dealing on own account. Includes a proprietary trading platform and 6,000 funded retail accounts.",
  }),
  listing({
    slug: "malta-bank-109", sellerId: "usr_seller_meridian", ageDays: 45,
    title: "Maltese credit institution with corporate deposit base", category: "BANK", businessStatus: "ACTIVE",
    country: "MT", regulator: "MFSA", licenseType: "Banking", yearOfIssue: 2012, employees: 65,
    priceEur: 24_000_000, benefits: ["Full banking licence", "Corporate deposit base", "Core banking system"],
    description: "Licensed credit institution in Malta focused on corporate banking and trade finance. Holds €310M in deposits, a modern core banking system, and correspondent relationships in EUR, USD, and GBP. Capital ratios well above regulatory minimums.",
  }),
  listing({
    slug: "ireland-pi-110", sellerId: "usr_seller_meridian", ageDays: 16,
    title: "Irish payment institution with merchant acquiring", category: "PAYMENT", businessStatus: "ACTIVE",
    country: "IE", regulator: "CBI", licenseType: "PI", yearOfIssue: 2020, employees: 16,
    priceEur: 3_200_000, benefits: ["Merchant acquiring", "Visa and Mastercard membership", "EEA passporting"],
    description: "Central Bank of Ireland authorised payment institution offering card acquiring to e-commerce merchants. Principal membership with Visa and Mastercard, PCI DSS level 1 certification, and 900 active merchants across Ireland and the Netherlands.",
  }),
];

const thamesAssets = [
  listing({
    slug: "united-kingdom-emi-111", sellerId: "usr_seller_thames", ageDays: 5,
    title: "UK authorised EMI with Faster Payments access", category: "EMI", businessStatus: "ACTIVE",
    country: "GB", regulator: "FCA", licenseType: "EMI", yearOfIssue: 2018, employees: 28,
    priceEur: 6_500_000, benefits: ["Faster Payments access", "Own sort code", "Full management team", "Profitable"],
    description: "FCA authorised electronic money institution with indirect Faster Payments and Bacs access, its own sort code, and a safeguarding account at a UK clearing bank. Serves 15,000 freelancers and micro-businesses through a mobile-first current account.",
  }),
  listing({
    slug: "united-kingdom-small-emi-112", sellerId: "usr_seller_thames", ageDays: 26,
    title: "UK small EMI registration, no clients", category: "EMI", businessStatus: "LICENSE_ONLY",
    country: "GB", regulator: "FCA", licenseType: "Small EMI", yearOfIssue: 2023, employees: 2,
    priceEur: 180_000, benefits: ["Clean regulatory record", "Fast change of control"],
    description: "Small electronic money institution registered with the FCA, never operated. A quick, low-cost route to issuing e-money in the UK for a business that will stay under the €5M average outstanding e-money threshold.",
  }),
  listing({
    slug: "united-kingdom-pi-113", sellerId: "usr_seller_thames", ageDays: 9, status: "HIDDEN", statusReason: HIDDEN_ASSET_REASON,
    title: "UK authorised payment institution, FX and payouts", category: "PAYMENT", businessStatus: "ACTIVE",
    country: "GB", regulator: "FCA", licenseType: "PI", yearOfIssue: 2019, employees: 12,
    priceEur: 1_200_000, benefits: ["FX payments", "Multi-currency accounts"],
    description: "Authorised payment institution offering cross-border FX payments and mass payouts in 30 currencies. Hidden by a platform manager pending confirmation of its current FCA register entry.",
  }),
  listing({
    slug: "canada-msb-114", sellerId: "usr_seller_thames", ageDays: 38,
    title: "Canadian MSB registration with virtual currency dealing", category: "PAYMENT", businessStatus: "LICENSE_ONLY",
    country: "CA", regulator: "FINTRAC", licenseType: "MSB", otherLicenses: ["Virtual currency dealing"], yearOfIssue: 2024, employees: 1,
    priceEur: 50_000, benefits: ["Fast change of control", "Compliance manual included"],
    description: "FINTRAC-registered money services business covering money transfer and virtual currency dealing. Includes an AML compliance programme, risk assessment, and a nominee compliance officer for the first three months.",
  }),
  listing({
    slug: "canada-crypto-msb-115", sellerId: "usr_seller_thames", ageDays: 14,
    title: "Canadian crypto exchange operating under MSB registration", category: "CRYPTO", businessStatus: "ACTIVE",
    country: "CA", regulator: "FINTRAC", licenseType: "MSB", otherLicenses: ["Virtual currency dealing", "Foreign exchange dealing"], yearOfIssue: 2021, employees: 7,
    priceEur: 650_000, benefits: ["Active client base", "Banking partner in place"],
    description: "Operating crypto brokerage registered with FINTRAC as an MSB, serving 9,000 Canadian clients with CAD on- and off-ramps through a Schedule I bank partner. Monthly volume of CAD 12M.",
  }),
  listing({
    slug: "united-kingdom-bank-116", sellerId: "usr_seller_thames", ageDays: 52,
    title: "UK specialist lender with a full banking licence", category: "BANK", businessStatus: "ACTIVE",
    country: "GB", regulator: "PRA / FCA", licenseType: "Banking", yearOfIssue: 2015, employees: 120,
    priceEur: null, benefits: ["Full banking licence", "FSCS-protected deposits", "Profitable"],
    description: "PRA-authorised and FCA-regulated deposit taker specialising in asset finance for UK SMEs. £480M loan book funded by FSCS-protected retail savings. Price on request; NDA required before the information memorandum is shared.",
  }),
];

const nordlichtAssets = [
  listing({
    slug: "germany-bank-117", sellerId: "usr_seller_nordlicht", ageDays: 28,
    title: "German CRR bank with private banking focus", category: "BANK", businessStatus: "ACTIVE",
    country: "DE", regulator: "BaFin", licenseType: "Banking (CRR)", yearOfIssue: 2009, employees: 85,
    priceEur: 19_500_000, benefits: ["Full banking licence", "Deposit guarantee scheme", "Wealth management"],
    description: "BaFin-supervised CRR credit institution with a private banking and wealth management franchise in Hamburg and Munich. Covered by the German deposit guarantee scheme, with €1.1B in assets under management.",
  }),
  listing({
    slug: "germany-pi-118", sellerId: "usr_seller_nordlicht", ageDays: 17,
    title: "German payment institution for marketplace payouts", category: "PAYMENT", businessStatus: "ACTIVE",
    country: "DE", regulator: "BaFin", licenseType: "PI", yearOfIssue: 2020, employees: 19,
    priceEur: 2_750_000, benefits: ["Marketplace escrow", "EEA passporting", "Profitable"],
    description: "Payment institution licensed by BaFin providing escrow and split payouts for online marketplaces. Integrated with three of the five largest German marketplace platforms and profitable since 2023.",
  }),
  listing({
    slug: "netherlands-emi-119", sellerId: "usr_seller_nordlicht", ageDays: 8,
    title: "Dutch EMI with Benelux merchant base", category: "EMI", businessStatus: "ACTIVE",
    country: "NL", regulator: "DNB", licenseType: "EMI", yearOfIssue: 2019, employees: 24,
    priceEur: 3_900_000, benefits: ["iDEAL acquiring", "Safeguarding account", "EEA passporting"],
    description: "Electronic money institution licensed by De Nederlandsche Bank with iDEAL and Bancontact acquiring, prepaid wallets, and 2,400 Benelux merchants. Strong compliance function with an in-house MLRO and two analysts.",
  }),
  listing({
    slug: "netherlands-casp-120", sellerId: "usr_seller_nordlicht", ageDays: 3,
    title: "Dutch MiCA CASP authorisation", category: "CRYPTO", businessStatus: "LICENSE_ONLY",
    country: "NL", regulator: "AFM", licenseType: "CASP", yearOfIssue: 2025, employees: 3,
    priceEur: null, benefits: ["MiCA authorised", "EU passport ready"],
    description: "MiCA crypto-asset service provider authorisation granted by the AFM for custody, transfer, and placing of crypto-assets. Pre-launch entity with policies and outsourcing agreements in place. Price on request.",
  }),
  listing({
    slug: "switzerland-fintech-121", sellerId: "usr_seller_nordlicht", ageDays: 34,
    title: "Swiss FinTech licence with deposit-taking", category: "FINTECH", businessStatus: "ACTIVE",
    country: "CH", regulator: "FINMA", licenseType: "FinTech licence", yearOfIssue: 2021, employees: 10,
    priceEur: 2_100_000, benefits: ["Public deposits up to CHF 100M", "Swiss domicile"],
    description: "FINMA FinTech licence (Art. 1b Banking Act) permitting the acceptance of public deposits up to CHF 100M without lending them out. Operates a multi-currency business account for Swiss SMEs.",
  }),
];

const vistulaAssets = [
  listing({
    slug: "poland-pi-122", sellerId: "usr_seller_vistula", ageDays: 12,
    title: "Polish national payment institution with BLIK", category: "PAYMENT", businessStatus: "ACTIVE",
    country: "PL", regulator: "KNF", licenseType: "PI", yearOfIssue: 2018, employees: 31,
    priceEur: 1_450_000, benefits: ["BLIK acceptance", "Pay-by-link", "Merchant acquiring"],
    description: "National payment institution authorised by the KNF with BLIK, pay-by-link, and card acceptance for 3,500 Polish e-commerce merchants. Processing PLN 90M a month with a growing subscription-billing product.",
  }),
  listing({
    slug: "poland-small-pi-123", sellerId: "usr_seller_vistula", ageDays: 41,
    title: "Polish small payment institution (MIP)", category: "PAYMENT", businessStatus: "LICENSE_ONLY",
    country: "PL", regulator: "KNF", licenseType: "Small PI", yearOfIssue: 2022, employees: 1,
    priceEur: 95_000, benefits: ["Low capital requirement", "Clean regulatory record"],
    description: "Small payment institution (MIP) entered in the KNF register, suitable for domestic money remittance under the monthly volume threshold. Never operated, with no liabilities.",
  }),
  listing({
    slug: "czech-republic-emi-124", sellerId: "usr_seller_vistula", ageDays: 20,
    title: "Czech EMI with prepaid card programme", category: "EMI", businessStatus: "ACTIVE",
    country: "CZ", regulator: "CNB", licenseType: "EMI", yearOfIssue: 2017, employees: 15,
    priceEur: 2_600_000, benefits: ["Card issuing programme", "EEA passporting", "Safeguarding account"],
    description: "Electronic money institution authorised by the Czech National Bank, issuing prepaid and debit cards for corporate expense management. 40,000 active cards and an established BIN sponsorship arrangement.",
  }),
  listing({
    slug: "czech-republic-bank-125", sellerId: "usr_seller_vistula", ageDays: 6, status: "DRAFT",
    title: "Dormant Czech bank licence", category: "BANK", businessStatus: "LICENSE_ONLY",
    country: "CZ", regulator: "CNB", licenseType: "Banking", yearOfIssue: 2014, employees: 6,
    priceEur: 12_000_000, benefits: ["Full banking licence"],
    description: "Czech banking licence held by an entity that wound down its loan book in 2024. Draft listing pending confirmation from the CNB on the scope of the licence after the restructuring.",
  }),
  listing({
    slug: "poland-crowdfunding-126", sellerId: "usr_seller_vistula", ageDays: 24,
    title: "Polish crowdfunding platform with ECSP licence", category: "FINTECH", businessStatus: "ACTIVE",
    country: "PL", regulator: "KNF", licenseType: "Crowdfunding (ECSP)", yearOfIssue: 2023, employees: 8,
    priceEur: 380_000, benefits: ["EU passport", "Investor community"],
    description: "European crowdfunding service provider licensed by the KNF under the ECSP Regulation. Has raised €14M for 60 SME campaigns from a community of 11,000 registered investors.",
  }),
];

const auroraAssets = [
  listing({
    slug: "lithuania-casp-127", sellerId: "usr_seller_aurora", ageDays: 10,
    title: "Lithuanian MiCA CASP with exchange platform", category: "CRYPTO", businessStatus: "ACTIVE",
    country: "LT", regulator: "Bank of Lithuania", licenseType: "CASP", yearOfIssue: 2025, employees: 5,
    priceEur: 1_100_000, benefits: ["MiCA authorised", "Exchange platform"],
    description: "Crypto-asset service provider authorised under MiCA by the Bank of Lithuania, operating a spot exchange with fiat on-ramps in EUR and PLN. 2,000 verified users and live Travel Rule compliance.",
  }),
  listing({
    slug: "ireland-emi-128", sellerId: "usr_seller_aurora", ageDays: 21,
    title: "Irish EMI with corporate treasury product", category: "EMI", businessStatus: "ACTIVE",
    country: "IE", regulator: "CBI", licenseType: "EMI", yearOfIssue: 2016, employees: 40,
    priceEur: 7_800_000, benefits: ["Profitable", "Corporate client base", "EEA passporting"],
    description: "Central Bank of Ireland authorised EMI providing multi-currency treasury accounts to mid-sized corporates. Profitable for four consecutive years, with €220M in safeguarded funds.",
  }),
  listing({
    slug: "ireland-lending-129", sellerId: "usr_seller_aurora", ageDays: 33,
    title: "Irish consumer lender (retail credit firm)", category: "FINTECH", businessStatus: "ACTIVE",
    country: "IE", regulator: "CBI", licenseType: "Retail Credit Firm", yearOfIssue: 2019, employees: 12,
    priceEur: 900_000, benefits: ["Loan book included", "Credit scoring model"],
    description: "Retail credit firm authorised by the Central Bank of Ireland offering point-of-sale instalment loans through 150 retail partners. Includes a €6M performing loan book and a proprietary scoring model.",
  }),
  listing({
    slug: "malta-pi-130", sellerId: "usr_seller_aurora", ageDays: 47,
    title: "Maltese payment institution, license only", category: "PAYMENT", businessStatus: "LICENSE_ONLY",
    country: "MT", regulator: "MFSA", licenseType: "PI", yearOfIssue: 2024, employees: 1,
    priceEur: 260_000, benefits: ["EEA passporting", "Clean regulatory record"],
    description: "Payment institution licence from the MFSA covering money remittance and acquiring of payment transactions. Never operated; corporate structure and governance documents are ready for transfer.",
  }),
];

export const assets: Prisma.AssetCreateManyInput[] = [
  ...demoSellerAssets,
  ...meridianAssets,
  ...thamesAssets,
  ...nordlichtAssets,
  ...vistulaAssets,
  ...auroraAssets,
];
