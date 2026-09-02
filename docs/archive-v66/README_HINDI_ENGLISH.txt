VB-G RAM G - ONE CLICK DAILY REPORT
======================================

DAILY USE
---------
1. Keep Daily_Report_MASTER.xlsx in this folder.
2. Update/refresh the source sheets (especially RepDay) as usual.
3. Double-click: ONE_CLICK_DAILY_REPORT.bat
4. A dated file Daily_Report_DD-MM-YYYY.xlsx is created automatically.

WHAT IS AUTOMATIC NOW
---------------------
The Daily Report is mapped by:
Janpad + Engineer + Cluster + Panchayat

It does NOT depend on RepDay row order.

Automatic columns:
- Total Ongoing Work            <- RepDay column D
- Works with Muster Roll        <- RepDay column J
- No. of GPs                    <- RepDay column G
- Muster Issue GPs              <- RepDay column H
- Dysfunctional GPs             <- No. of GPs - Muster Issue GPs
- Unskilled Labour Engagement   <- RepDay column I
- Muster Rolls                  <- RepDay column L
- Workers without e-KYC         <- RepDay column K

AUTO CHECK
----------
The script creates/updates an "AUTO CHECK" sheet and verifies totals for:
- Muster Rolls
- Works with MR
- Unskilled Labour Engagement

If source rows are sorted differently tomorrow, mapping still works.

IMPORTANT
---------
This package automates report calculation and Muster mapping.
If the official website source itself is not already connected to the workbook,
source fetching is a separate automation step.
