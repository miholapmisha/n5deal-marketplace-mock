"use client";

import { ChipInput } from "@/components/forms/chip-input";
import { Field, FormSection, controlProps, selectClass } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BusinessStatus, Category } from "@/generated/prisma/enums";
import { ASSET_LIMITS as L, type AssetFormField, type AssetFormValues } from "@/lib/asset-form";
import { parsePriceInput } from "@/lib/catalog-filters";
import type { CountryOption } from "@/lib/countries";
import { countryFlag, formatPrice } from "@/lib/format";
import { BUSINESS_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/labels";

const LICENSE_SUGGESTIONS = ["EMI", "PI", "CASP", "VASP", "Banking", "PI (AISP/PISP)", "Investment firm"];
const inputClass = "h-10 bg-card";

export interface SectionProps {
  values: AssetFormValues;
  errorsFor: (field: AssetFormField) => string[] | undefined;
  update: <K extends AssetFormField>(field: K, value: AssetFormValues[K]) => void;
}

function counter(text: string, max: number): string {
  return `${text.trim().length} / ${max}`;
}

export function BasicsSection({ values, errorsFor, update, countries }: SectionProps & { countries: readonly CountryOption[] }) {
  return (
    <FormSection title="Basics" description="What is for sale and who regulates it.">
      <Field id="title" label="Title" errors={errorsFor("title")} hint={counter(values.title, L.titleMax)}>
        <Input
          {...controlProps("title", errorsFor("title"), true)}
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          maxLength={L.titleMax}
          placeholder="e.g. Maltese EMI with CASP authorisation"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="category" label="Category" errors={errorsFor("category")}>
          <select
            {...controlProps("category", errorsFor("category"))}
            value={values.category}
            onChange={(event) => update("category", event.target.value as AssetFormValues["category"])}
            className={selectClass}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {Object.values(Category).map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="businessStatus" label="Business status" errors={errorsFor("businessStatus")}>
          <select
            {...controlProps("businessStatus", errorsFor("businessStatus"))}
            value={values.businessStatus}
            onChange={(event) => update("businessStatus", event.target.value as AssetFormValues["businessStatus"])}
            className={selectClass}
          >
            <option value="" disabled>
              Choose a status
            </option>
            {Object.values(BusinessStatus).map((status) => (
              <option key={status} value={status}>
                {BUSINESS_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="country" label="Country" errors={errorsFor("country")}>
          <select
            {...controlProps("country", errorsFor("country"))}
            value={values.country}
            onChange={(event) => update("country", event.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Choose a country
            </option>
            {countries.map((option) => (
              <option key={option.value} value={option.value}>
                {countryFlag(option.value)} {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="regulator" label="Regulator (optional)" errors={errorsFor("regulator")}>
          <Input
            {...controlProps("regulator", errorsFor("regulator"))}
            value={values.regulator}
            onChange={(event) => update("regulator", event.target.value)}
            maxLength={L.regulatorMax}
            placeholder="e.g. MFSA"
            className={inputClass}
          />
        </Field>
        <Field id="licenseType" label="License type" errors={errorsFor("licenseType")}>
          <Input
            {...controlProps("licenseType", errorsFor("licenseType"))}
            value={values.licenseType}
            onChange={(event) => update("licenseType", event.target.value)}
            maxLength={L.licenseTypeMax}
            list="license-suggestions"
            placeholder="e.g. EMI"
            className={inputClass}
          />
          <datalist id="license-suggestions">
            {LICENSE_SUGGESTIONS.map((license) => (
              <option key={license} value={license} />
            ))}
          </datalist>
        </Field>
        <Field
          id="otherLicenses"
          label="Other licenses (optional)"
          errors={errorsFor("otherLicenses")}
          hint="Press Enter after each one."
        >
          <ChipInput
            {...controlProps("otherLicenses", errorsFor("otherLicenses"), true)}
            values={values.otherLicenses}
            onChange={(next) => update("otherLicenses", next)}
            maxItems={L.otherLicensesMax}
            maxLength={L.chipMax}
            placeholder="e.g. CASP"
          />
        </Field>
      </div>
    </FormSection>
  );
}

export function PriceSection({ values, errorsFor, update }: SectionProps) {
  const typed = parsePriceInput(values.price);
  const hint = typed ? `Shown as ${formatPrice(typed)}.` : "Whole euros, e.g. 1500000.";

  return (
    <FormSection title="Price" description="Asking price in euros. Buyers filter the catalog by price.">
      <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium">
        <Switch checked={values.priceOnRequest} onCheckedChange={(checked) => update("priceOnRequest", checked)} />
        Price on request
      </label>
      {!values.priceOnRequest && (
        <Field id="price" label="Price (€)" errors={errorsFor("price")} hint={hint} className="sm:max-w-xs">
          <Input
            {...controlProps("price", errorsFor("price"), true)}
            value={values.price}
            onChange={(event) => update("price", event.target.value)}
            inputMode="numeric"
            maxLength={20}
            placeholder="1500000"
            className={inputClass}
          />
        </Field>
      )}
    </FormSection>
  );
}

export function DetailsSection({ values, errorsFor, update }: SectionProps) {
  return (
    <FormSection title="Details" description="What makes this asset worth buying.">
      <Field
        id="benefits"
        label="Highlights (optional)"
        errors={errorsFor("benefits")}
        hint={`Up to ${L.benefitsMax}. The first 3 show on the catalog card.`}
      >
        <ChipInput
          {...controlProps("benefits", errorsFor("benefits"), true)}
          values={values.benefits}
          onChange={(next) => update("benefits", next)}
          maxItems={L.benefitsMax}
          maxLength={L.chipMax}
          placeholder="e.g. EEA passporting"
        />
      </Field>
      <Field
        id="description"
        label="Description"
        errors={errorsFor("description")}
        hint={`${counter(values.description, L.descriptionMax)} (at least ${L.descriptionMin})`}
      >
        <Textarea
          {...controlProps("description", errorsFor("description"), true)}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          maxLength={L.descriptionMax}
          rows={6}
          placeholder="License scope, passporting, clients, team, reason for sale…"
          className="min-h-36 bg-card"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="yearOfIssue" label="Year of issue (optional)" errors={errorsFor("yearOfIssue")}>
          <Input
            {...controlProps("yearOfIssue", errorsFor("yearOfIssue"))}
            value={values.yearOfIssue}
            onChange={(event) => update("yearOfIssue", event.target.value)}
            inputMode="numeric"
            maxLength={4}
            placeholder="2019"
            className={inputClass}
          />
        </Field>
        <Field id="employees" label="Employees (optional)" errors={errorsFor("employees")}>
          <Input
            {...controlProps("employees", errorsFor("employees"))}
            value={values.employees}
            onChange={(event) => update("employees", event.target.value)}
            inputMode="numeric"
            maxLength={7}
            placeholder="12"
            className={inputClass}
          />
        </Field>
      </div>
    </FormSection>
  );
}
