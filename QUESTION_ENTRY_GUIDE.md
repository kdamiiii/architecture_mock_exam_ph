# Instructions for Question Data Entry

You are converting architecture board exam questions into JavaScript data files for a quiz app.

## Output Format

Each question is a JS object:

```js
{
  id: "S01",
  q: "The full question text goes here?",
  options: ["Choice A", "Choice B", "Choice C", "Choice D"],
  answer: null,
  explain: ""
}
```

## Rules

1. **ID format:** Use a prefix based on the category + a zero-padded number. Prefixes: `S` = Structural, `H` = History, `P` = Practice, `U` = Utilities, `D` = Design, `M` = Materials. Example: `S01`, `S02`, `H01`, `P14`.

2. **`answer`:** Set to `null`. The answer key is not provided. Do not guess.

3. **`explain`:** Set to an empty string `""`.

4. **`options`:** Always exactly 4 choices, as an array of strings. Preserve the original wording from the sheet.

5. **Skip any question that contains or references an image** (diagrams, figures, illustrations, photos). If the question says "refer to the figure" or "as shown in the diagram," skip it entirely.

6. **Output file format:** Wrap the array in an `addQuestions` call:

   ```js
   addQuestions("SOURCE_ID", "CATEGORY_ID", [
     { id: "S01", q: "...", options: ["...", "...", "...", "..."], answer: null, explain: "" },
     { id: "S02", q: "...", options: ["...", "...", "...", "..."], answer: null, explain: "" },
   ]);
   ```

7. **Source and category IDs** — use these exact values:

   - **Sources:** `"jpt"` (JPT Learning Center), `"ucj"` (UC Jaguars Mock Exam)
   - **Categories:** `"struct"`, `"hist"`, `"prac"`, `"util"`, `"design"`, `"mats"`

8. **One file per source + category combination.** File path: `data/sources/{source_id}/{category_id}/questions.js`

9. Preserve the exact wording of questions and choices. Do not rephrase, correct grammar, or add formatting.
