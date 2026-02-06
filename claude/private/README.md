# Private Data Folder

This folder contains personal data and is **gitignored** by default. Nothing in this folder will be committed to version control.

## Structure

```
private/
├── commits/          # Git commit history extractions (from /collect-commits)
├── notes/            # Personal notes and research
├── cache/            # Temporary cached data
└── tutoring/         # Tutoring/academy data
    ├── presets.json  # Student names, hourly rates, bank info
    └── invoices/     # Generated invoice PDFs (archive)
```

## Tutoring Data

### presets.json
Contains sensitive information:
- Student names and hourly rates
- Bank account information
- Default lesson counts

**Setup**: Copy `skills/invoice-generator/presets.json.example` here and edit with your actual data.

### invoices/
Archive of generated invoice PDFs for record-keeping.

---

**Important**: This entire folder is in `.gitignore`. Never commit personal data to Git.
