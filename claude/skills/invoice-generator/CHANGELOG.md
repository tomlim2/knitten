# Changelog

All notable changes to invoice-generator will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-31

### Changed
- Inputs: bottom border only, subtle gray (#CCCCCC) default
- Input background: transparent
- Updated to match Design System v1.1.0

## [1.1.0] - 2026-01-31

### Changed
- Complete UI overhaul to match Design System v1.0.0
- Removed all border-radius (brutalist: all corners = 0)
- Removed all transitions and transforms (instant state changes)
- Removed gradients and soft shadows
- Updated typography to system sans-serif primary
- Buttons: 2px border, 8px 12px padding, UPPERCASE
- Inputs: 2px gray-600 border, 4px black on focus
- Tables: black header, UPPERCASE labels
- Version display in generated invoice footer

## [1.0.0] - 2026-01-31

### Added
- Initial versioned release
- Dynamic lesson entry (date, hours, minutes)
- Automatic total calculation
- Bank account information display
- PDF export via html2canvas + jsPDF
- Invoice numbering system (YYYYMM-XXXX)
- Clipboard automation for `/move-invoice` command
- Version display in UI footer
