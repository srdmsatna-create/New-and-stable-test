# V61 — Corrected Work Category Modules

- `Final Work Category` in `ongoing-details.js` is treated as authoritative.
- Category/Sub Engineer summary is rebuilt at runtime from corrected work-level records, not the older broad category rules in auto-data.
- Added `Work Category Summary` tab.
- Added `Category × Sub Engineer` tab with Work Count, Apr-Jun NREGA Mandays, Jul-Today Mandays, expenditure buckets, Sanction, Booked, Remaining and Exp %.
- Added `Category Work Details` tab with category-wise work-level drill-down: Work Code, Work Name, Sub Engineer, Cluster, GP, FY, Sanction, Booked Wage, Booked Material, Total Booked, Exp %, Apr-Jun NREGA Mandays, and Jul-Today Mandays.
- Added global Work Category filter that works together with District, Janpad, Engineer and Cluster filters.
- Corrected runtime source contains 15,663 VBGRAMG ongoing works, 40 final categories and 1,107 Category × Sub Engineer combinations.
