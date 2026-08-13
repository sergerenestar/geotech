# CLAUDE CODE PROMPT — Smart Sieve Analysis (Analyse Granulométrique)
# GeoTech Lab · NF P 94-056 · Next.js 14 + Spring Boot

---

## OBJECTIVE

The existing sieve analysis test form in TechProjectView (and its supporting
components) only supports ONE fixed set of sieves regardless of material type.
This is wrong — the correct sieves, norm, calculations, and graph depend on
the material the technician is analysing.

You must upgrade the sieve analysis test so that when a Technician selects a
material type, the app automatically:
  1. Loads the correct sieve column set for that material
  2. Displays the applicable norm
  3. Computes the correct passing percentages and derived indices
  4. Renders the appropriate grain-size distribution curve

Do NOT change any other test type. Do NOT change role routing. Touch only
the sieve analysis flow.

---

## CONTEXT — READ FIRST

Before writing any code:

1. Locate the sieve analysis test component. Search for it:
   grep -rn "granulom\|sieve\|tamisage\|NF P 94-056" apps/web --include="*.tsx" --include="*.ts" -l

2. Locate the backend endpoint for sieve test results:
   grep -rn "granulom\|sieve\|tamisage" backend/src -l

3. Read TechProjectView.tsx to understand how test forms are currently
   opened and submitted.

4. Check what the current sieve data model looks like (what fields are
   stored per test result).

Use what you find. Do not assume file names or field names — verify them.

---

## MATERIAL TYPE → SIEVE CONFIG MAPPING

Implement this as a TypeScript constant (e.g. SIEVE_CONFIGS) in a new file:
  apps/web/lib/sieveConfigs.ts

### Config shape:
```ts
type SieveConfig = {
  materialType: string          // display label shown to technician
  norm: string                  // e.g. "NF P 94-056"
  sieves_mm: number[]           // ordered largest → smallest
  curveLimits?: {               // optional spec envelope for the graph
    upperBound: Record<number, number>
    lowerBound: Record<number, number>
  }
  derivedIndices: string[]      // which indices to compute and display
}
```

### Implement EXACTLY these four configs:

#### 1. Granulats pour enrobés / sable concassé (0/4, 4/6, 6/10)
```
norm:    "NF EN 13043 / XP P 18-545"
sieves:  [8, 5, 4, 2, 0.063]   (mm)
indices: ["Module de finesse"]
```

#### 2. Mélange bitumineux extrait (EB10–BBME3)
```
norm:    "NF EN 12697-1"
sieves:  [14, 10, 5, 2, 0.5, 0.063]   (mm)
indices: ["Teneur en liant (%)"]
```

#### 3. Sol fin / argile / limon (analyse par sédimentation ou tamisage fin)
```
norm:    "NF P 94-056"
sieves:  [2, 0.5, 0.2, 0.08, 0.05, 0.02, 0.005]   (mm)
indices: ["D10", "D30", "D60", "Cu (Cc)"]
```

#### 4. Grave / gravier / tout-venant
```
norm:    "NF P 94-056"
sieves:  [50, 31.5, 20, 10, 5, 2, 0.5, 0.08]   (mm)
indices: ["D10", "D30", "D60", "Cu", "Cc"]
```

---

## FRONTEND CHANGES

### Step 1 — Material type selector

In the sieve analysis form component, add a `<select>` (or radio group) at
the TOP of the form, BEFORE any sieve inputs:

```
Label: "Type de matériau"
Options:
  - "Sable concassé / Granulats 0/4, 4/6, 6/10"
  - "Mélange bitumineux extrait (BBME3)"
  - "Sol fin / Argile / Limon"
  - "Grave / Gravier / Tout-venant"
```

When the technician changes this selector:
- Clear any existing sieve input values
- Replace the sieve rows with those from the matching SIEVE_CONFIGS entry
- Update the displayed norm label (read-only field below the selector)
- Reset the graph

### Step 2 — Dynamic sieve input table

Replace the hardcoded sieve rows with a dynamically generated table.
For each sieve in the selected config's `sieves_mm` array, render one row:

| Tamis (mm) | Masse retenue (g) | % Refus | % Passant |
|------------|-------------------|---------|-----------|

- "Tamis (mm)" — read-only, populated from config
- "Masse retenue (g)" — number input, entered by technician
- "% Refus" — auto-computed (read-only)
- "% Passant" — auto-computed (read-only)

### Step 3 — Live calculations

On every keystroke in any "Masse retenue" field:

```
total_mass = sum of all masse_retenue values entered so far
             (treat empty fields as 0)

For each sieve row i (ordered largest → smallest):
  refus_cumul_i   = sum of masse_retenue[0..i]
  % Refus_i       = (refus_cumul_i / total_mass) * 100
  % Passant_i     = 100 - % Refus_i
```

Display values rounded to 1 decimal place.

### Step 4 — Derived indices

Below the table, show a read-only "Indices calculés" section.

For configs that include D10 / D30 / D60:
  - Interpolate from the (sieve_mm, % Passant) pairs to find the sieve
    diameter at which 10%, 30%, and 60% of material passes
  - Cu = D60 / D10
  - Cc = (D30²) / (D10 × D60)
  - Show "—" if not enough data to interpolate

For "Module de finesse" (granulats):
  - MF = (sum of % Refus at 0.16, 0.315, 0.63, 1.25, 2.5, 5 mm) / 100
  - Only compute if those sieves are present; otherwise show "—"

### Step 5 — Grain-size distribution curve

Render a grain-size curve chart below the indices section using the
chart library already used in the project (check package.json — likely
recharts or chart.js).

Chart requirements:
- X axis: sieve diameter in mm, LOGARITHMIC scale, descending left→right
  (fine particles on left, coarse on right — standard geotechnical convention)
- Y axis: % Passant, linear, 0–100
- Plot a line connecting the (sieve_mm, % Passant) points
- If the selected config has curveLimits, draw two additional dashed lines
  (upper and lower spec bounds) in a muted color
- Title: "Courbe granulométrique — [materialType] — [norm]"
- Only render the chart once at least 2 sieve rows have non-zero mass values

### Step 6 — Norm display

Directly below the material selector, show a read-only badge or label:
  "Norme applicable : [norm from config]"

Style it as an info chip (blue outline, small font) consistent with your
existing UI tokens (slate/teal palette).

---

## BACKEND CHANGES

Check whether the existing sieve test result entity already stores
per-sieve data as a JSON field or as individual columns.

If it stores a flat JSON blob, add `material_type` as a new top-level
key in that JSON — no migration needed.

If it uses individual columns, create a Flyway migration
(next version after whatever V is current) to add:
  ALTER TABLE [sieve_test_table] ADD COLUMN material_type VARCHAR(80);

The backend endpoint should accept and return `material_type` so the
form can be pre-populated when a technician reopens a saved test.

---

## VALIDATION RULES

Before allowing the technician to submit:
- material_type must be selected (not blank)
- At least 3 sieve rows must have masse_retenue > 0
- total_mass must be > 0
- Show inline error messages in French, e.g.:
  "Veuillez sélectionner un type de matériau."
  "Veuillez saisir au moins 3 valeurs de masse retenue."

---

## WHAT NOT TO CHANGE

- Do not modify PmProjectView.tsx or LmProjectView.tsx
- Do not modify the role routing in projects/[id]/page.tsx
- Do not change any other test type (Proctor, Atterberg, CBR, etc.)
- Do not change the approval state machine
- Preserve all existing Tailwind class patterns and color tokens

---

## DEFINITION OF DONE

Run and confirm each of these before reporting complete:

1. Technician opens a sieve analysis test → sees material type selector
2. Selecting "Sol fin / Argile / Limon" → table shows 7 sieve rows,
   norm shows "NF P 94-056", other configs show different rows
3. Entering masses → % Refus and % Passant update live without page reload
4. D10 / D30 / D60 / Cu / Cc appear below table when data is sufficient
5. Grain-size curve renders on a log X axis once 2+ values entered
6. Submitting saves material_type to the backend; reopening the test
   restores the correct sieve set and previously entered values
7. Attempting to submit without selecting a material type shows the
   French validation error

Report any schema conflicts or missing endpoints before implementing them.
