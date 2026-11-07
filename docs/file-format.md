# File formats and count semantics

Editable files use `loopstead-project-v1`. Exactly four root fields are allowed: `schema`, `title`, `notes`, `parts`.

Each part has exactly `id`, `name`, `completed`, `repeatStart`, `repeatLength`, `target`, `notes`. IDs p1–p999999 are unique strings. Names can repeat; IDs identify independent parts.

`completed` is the last row recorded as finished, including any setup rows. It never resets at a repeat boundary. The next project row is always completed + 1.

With first repeat row S and length L:

- Completed rows inside the repeating section: max(0, completed − S + 1)
- Full repeats recorded: floor(section rows / L)
- When next ≥ S, next repeat number: floor((next − S) / L) + 1
- Next repeat row: ((next − S) mod L) + 1

No next repeat is shown before S. Null repeat length disables repeat derivation. A target is an optional total-row plan; remaining rows never go below zero and overshooting does not stop counting.

The model does not store patterns or stitch instructions. Text is literal and escaped on export. Line breaks are allowed in notes. Unsafe controls and unpaired UTF-16 surrogates are rejected; limits are in README.

The receipt format `loopstead-receipt-v1` contains the entire project plus derived part progress. It is not an import format. Reopen the editable project file instead. HTML and SVG are snapshots, not round-trip formats.

Browser storage uses the key `loopstead-project-v1` and stores the editable project. History and form drafts are session-only. Imports are read as strict UTF-8, validate atomically, and are ignored if a newer file, draft, saved action or storage event occurs before the read completes. Successful imports are undoable and explicitly replace the browser copy when storage is available.

The storage adapter compares the raw observed browser copy before writing. Conflicts require an explicit choice. This comparison is not an atomic transaction across tabs; use one editing tab. Storage denial or write errors produce memory-only operation, never a saved-success claim.
