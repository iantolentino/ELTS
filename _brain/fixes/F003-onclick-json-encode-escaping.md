# F003 — Every admin "Edit" button's onclick prefill was silently truncated

---

## Category
WEB

## Symptom
Not caught by any prior HTTP-level testing (curl-based POST/redirect/status checks never render
the page as a browser would) — only found during the T036 output-escaping audit by reading the
raw HTML `onclick` attribute directly. In a real browser, every "Edit" button in the admin CRUD
sections (Departments, Users, Settings, Service Status, Knowledge Base — both admin and
department-agent sides) would fail: clicking it either does nothing or throws a JS syntax error,
because the `onclick` handler is truncated mid-statement.

## Root Cause
The edit buttons build their prefill JS as a string, e.g.:
```php
'<button ... onclick="'
  . "document.getElementById('dp_name').value=" . json_encode((string) $d['name']) . ";"
  . '">Edit</button>'
```
`json_encode()` on a string always wraps it in literal, unescaped double quotes (`"Finance"`).
Those quotes were concatenated directly into the `onclick="..."` HTML attribute, which is itself
delimited by `"`. The HTML parser closes the attribute at the *first* unescaped `"` it hits — the
one from `json_encode`, not the one after the final `;`. Everything after that point (the rest of
the JS, and the literal `">Edit</button>`) becomes garbage trailing content instead of part of the
handler. This wasn't a one-off — it's structural: `json_encode()` of a string is *always*
double-quoted, so this broke for every value, every time, not just ones containing special
characters.

## Fix
Build the full JS snippet into a local variable first, then pass the *entire* thing through
`htmlspecialchars()` as a single unit when embedding it in the attribute:
```php
$editJs = "document.getElementById('dp_name').value=" . json_encode((string) $d['name']) . ";";
// ...
'<button ... onclick="' . htmlspecialchars($editJs) . '">Edit</button>'
```
`htmlspecialchars()` turns the JSON string's `"` into `&quot;`, which keeps the attribute intact;
the browser decodes `&quot;` back to `"` before handing the string to the JS engine, so the
handler executes exactly as intended. Applied to all 6 occurrences: `renderDepartmentsSection()`,
`renderUsersSection()`, `renderSettingsSection()`, `renderStatusSection()`, `renderKbSection()` in
`admin_controller.php`, and `renderKnowledgeBasePage()` in `department_controller.php`.

## Why It Recurs / When to Reuse This
Any time a JS value is built with `json_encode()` and concatenated into an HTML event-handler
attribute (`onclick`, `onchange`, etc.), the *whole attribute value* must be passed through
`htmlspecialchars()` as one unit before being embedded — never rely on `json_encode()` alone to
make a value "HTML-safe" for an attribute context. It only makes a value *JS-string-literal*-safe.
Two different escaping contexts (JS string vs. HTML attribute) are both in play here, and both
need their own escaping pass, applied in the right order (JS-escape first via `json_encode`,
then HTML-attribute-escape the result via `htmlspecialchars`).

## Verification
- [x] Fetched the raw HTML of the Departments admin page and confirmed the `onclick` attribute now
  contains `&quot;` entities and is well-formed (ends at the final `;`, not mid-statement)
- [x] Same check repeated for Users, Settings, Service Status, and both Knowledge Base sections
- [x] `php -l` clean on both modified files
- [ ] Not manually clicked in a real browser (no browser tooling available this session) — the raw
  HTML is now structurally correct, which is what actually determines browser behavior here, but
  flagging this as the one piece of the fix not visually confirmed end-to-end

## Related
None.
