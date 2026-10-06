"use client";

import { CountryMultiSelect } from "@/components/forms/country-multi-select";
import { Field, FormSection, controlProps, selectClass } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BuyerType, Category, StatusPref, Timeline } from "@/generated/prisma/enums";
import {
  type BuyerProfileFormValues,
  PROFILE_LIMITS as L,
  type ProfileFormField,
} from "@/lib/buyer-profile-form";
import { parsePriceInput } from "@/lib/catalog-filters";
import type { CountryOption } from "@/lib/countries";
import { formatPrice } from "@/lib/format";
import { BUYER_TYPE_LABELS, CATEGORY_LABELS, STATUS_PREF_LABELS, TIMELINE_LABELS } from "@/lib/labels";

const inputClass = "h-10 bg-card";

export interface ProfileSectionProps {
  values: BuyerProfileFormValues;
  errorsFor: (field: ProfileFormField) => string[] | undefined;
  update: <K extends ProfileFormField>(field: K, value: BuyerProfileFormValues[K]) => void;
}

export function AboutSection({ values, errorsFor, update }: ProfileSectionProps) {
  return (
    <FormSection title="About you" description="Sellers see this on your card in the buyer directory.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="buyerType" label="Buyer type" errors={errorsFor("buyerType")}>
          <select
            {...controlProps("buyerType", errorsFor("buyerType"))}
            value={values.buyerType}
            onChange={(event) => update("buyerType", event.target.value as BuyerProfileFormValues["buyerType"])}
            className={selectClass}
          >
            <option value="" disabled>
              Choose a type
            </option>
            {Object.values(BuyerType).map((type) => (
              <option key={type} value={type}>
                {BUYER_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="companyName" label="Company (optional)" errors={errorsFor("companyName")}>
          <Input
            {...controlProps("companyName", errorsFor("companyName"))}
            value={values.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            maxLength={L.companyMax}
            autoComplete="organization"
            className={inputClass}
          />
        </Field>
      </div>
    </FormSection>
  );
}

function ticketHint(text: string): string {
  const euros = parsePriceInput(text);
  return euros === null ? "Whole euros; leave empty for no limit." : formatPrice(euros);
}

export function MandateSection({
  values,
  errorsFor,
  update,
  countries,
}: ProfileSectionProps & { countries: readonly CountryOption[] }) {
  const toggleCategory = (category: Category) =>
    update(
      "categories",
      values.categories.includes(category)
        ? values.categories.filter((value) => value !== category)
        : [...values.categories, category],
    );

  return (
    <FormSection title="What you are looking for" description="Used to rank assets for you by match score.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="ticketMin" label="Ticket from (€)" errors={errorsFor("ticketMin")} hint={ticketHint(values.ticketMin)}>
          <Input
            {...controlProps("ticketMin", errorsFor("ticketMin"), true)}
            value={values.ticketMin}
            onChange={(event) => update("ticketMin", event.target.value)}
            inputMode="numeric"
            maxLength={20}
            placeholder="250000"
            className={inputClass}
          />
        </Field>
        <Field id="ticketMax" label="Ticket up to (€)" errors={errorsFor("ticketMax")} hint={ticketHint(values.ticketMax)}>
          <Input
            {...controlProps("ticketMax", errorsFor("ticketMax"), true)}
            value={values.ticketMax}
            onChange={(event) => update("ticketMax", event.target.value)}
            inputMode="numeric"
            maxLength={20}
            placeholder="5000000"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        id="categories"
        label="Target categories"
        errors={errorsFor("categories")}
        hint="None selected = any category."
        group
      >
        <div className="flex flex-wrap gap-2">
          {Object.values(Category).map((category) => (
            <label
              key={category}
              className="flex h-9 cursor-pointer items-center rounded-full border border-input bg-card px-4 text-sm font-medium transition has-checked:border-pill has-checked:bg-pill has-checked:text-pill-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="checkbox"
                checked={values.categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="sr-only"
              />
              {CATEGORY_LABELS[category]}
            </label>
          ))}
        </div>
      </Field>

      <Field
        id="countries"
        label="Target countries"
        errors={errorsFor("countries")}
        hint="None selected = any country."
      >
        <CountryMultiSelect
          {...controlProps("countries", errorsFor("countries"), true)}
          options={countries}
          values={values.countries}
          onChange={(next) => update("countries", next)}
          emptyLabel="Any country"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="statusPref" label="Business status" errors={errorsFor("statusPref")}>
          <select
            {...controlProps("statusPref", errorsFor("statusPref"))}
            value={values.statusPref}
            onChange={(event) => update("statusPref", event.target.value as StatusPref)}
            className={selectClass}
          >
            {Object.values(StatusPref).map((pref) => (
              <option key={pref} value={pref}>
                {STATUS_PREF_LABELS[pref]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="timeline" label="Timeline" errors={errorsFor("timeline")}>
          <select
            {...controlProps("timeline", errorsFor("timeline"))}
            value={values.timeline}
            onChange={(event) => update("timeline", event.target.value as Timeline)}
            className={selectClass}
          >
            {Object.values(Timeline).map((timeline) => (
              <option key={timeline} value={timeline}>
                {TIMELINE_LABELS[timeline]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </FormSection>
  );
}

export function ThesisSection({ values, errorsFor, update }: ProfileSectionProps) {
  const length = values.thesis.trim().length;
  return (
    <FormSection title="Investment thesis" description="What you want to buy and why, in your own words.">
      <Field
        id="thesis"
        label="Thesis"
        errors={errorsFor("thesis")}
        hint={`${length} / ${L.thesisMax} (at least ${L.thesisMin})`}
      >
        <Textarea
          {...controlProps("thesis", errorsFor("thesis"), true)}
          value={values.thesis}
          onChange={(event) => update("thesis", event.target.value)}
          maxLength={L.thesisMax}
          rows={5}
          placeholder="e.g. We acquire EU EMIs with SEPA access to launch our B2B card product in the Baltics…"
          className="min-h-32 bg-card"
        />
      </Field>
      <label className="flex cursor-pointer items-start gap-3">
        <Switch
          checked={values.isVisible}
          onCheckedChange={(checked) => update("isVisible", checked)}
          className="mt-0.5"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Visible to sellers</span>
          <span className="text-sm text-muted-foreground">
            Sellers can find you in the buyer directory and contact you about their assets.
          </span>
        </span>
      </label>
    </FormSection>
  );
}
