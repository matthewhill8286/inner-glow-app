import catalogueData from '@/data/medications.json';

/**
 * Medication search for the assessment (10 §3.1–3.2).
 *
 * The catalogue (`data/medications.json`, built by `scripts/build-medication-catalogue.py`) holds the
 * medicines authorised in Cyprus, the United Kingdom (Northern Ireland) and EU-wide, from the European
 * Medicines Agency's Article 57 list, so the names are the ones on UK and Cypriot packs (paracetamol,
 * Apotel, Calpol). Generic names carry a class from their ATC code. Search runs on the device.
 */

export type MedicationClassKey =
  | 'antidepressant'
  | 'antipsychotic'
  | 'anxiolytic'
  | 'sleepAid'
  | 'stimulant'
  | 'moodStabiliser'
  | 'painRelief'
  | 'antiInflammatory'
  | 'inhaler'
  | 'antihistamine'
  | 'heart'
  | 'diabetes'
  | 'thyroid'
  | 'hormone'
  | 'antibiotic'
  | 'stomach'
  | 'supplement';

/** What the assessment stores in `assessments.medications`. */
export type PickedMedication = { name: string; class?: MedicationClassKey; generic?: string; custom: boolean };

/** A search hit. `generic` is set for brands ("Apotel" → "Paracetamol"). */
export type MedicationResult = { name: string; class?: MedicationClassKey; generic?: string };

export type MedicationCatalogue = {
  classes: string[];
  /** [generic name, index into `classes` or -1] */
  generics: [string, number][];
  /** [brand name, index into `generics`] */
  brands: [string, number][];
};

const MAX_RESULTS = 8;

/**
 * Ranks names by how the query matches: the start of the name, then the start of a later word
 * ("para" finds "Codeine + Paracetamol"), then anywhere. Generics come before brands at each level.
 */
export function searchCatalogue(catalogue: MedicationCatalogue, query: string, limit = MAX_RESULTS): MedicationResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const wordStart = new RegExp(`[\\s+/(-]${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const rank = (name: string) => {
    const n = name.toLowerCase();
    if (n.startsWith(q)) return 0;
    if (wordStart.test(n)) return 1;
    return n.includes(q) ? 2 : -1;
  };
  const classOf = (i: number) => (i >= 0 ? (catalogue.classes[i] as MedicationClassKey) : undefined);
  const hits: { rank: number; brand: boolean; result: MedicationResult }[] = [];
  catalogue.generics.forEach(([name, cls]) => {
    const r = rank(name);
    if (r >= 0) hits.push({ rank: r, brand: false, result: { name, class: classOf(cls) } });
  });
  catalogue.brands.forEach(([name, g]) => {
    const r = rank(name);
    if (r < 0) return;
    const [generic, cls] = catalogue.generics[g] ?? [undefined, -1];
    hits.push({ rank: r, brand: true, result: { name, generic, class: classOf(cls) } });
  });
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      Number(a.brand) - Number(b.brand) ||
      a.result.name.length - b.result.name.length ||
      a.result.name.localeCompare(b.result.name),
  );
  return hits.slice(0, limit).map((h) => h.result);
}

export function searchMedications(query: string): MedicationResult[] {
  // JSON imports type tuples as plain arrays, so the shape is asserted here.
  return searchCatalogue(catalogueData as unknown as MedicationCatalogue, query);
}

/** Adds or removes a medication by name (case-insensitive), as tapping a result row does. */
export function toggleMedication(list: PickedMedication[], item: PickedMedication): PickedMedication[] {
  const key = item.name.trim().toLowerCase();
  return list.some((m) => m.name.toLowerCase() === key)
    ? list.filter((m) => m.name.toLowerCase() !== key)
    : [...list, { ...item, name: item.name.trim() }];
}

/** The comma-joined text kept in `assessments.meds` for older readers and AI context. */
export function medicationsText(list: PickedMedication[]): string | null {
  return list.length ? list.map((m) => m.name).join(', ') : null;
}
