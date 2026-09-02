# V42 PPT Local Engine Fix

Problem fixed:
- Earlier PPT button depended on jsDelivr CDN.
- The browser could not load it and showed "PPT library load नहीं हुई".

V42:
- Bundles PptxGenJS inside `vendor/pptxgen.bundle.js`
- Uses browser global `PptxGenJS`
- No external PPT library internet request is needed
- Keep all ZIP files/folders when uploading to GitHub, especially `vendor/`

After GitHub upload:
1. Open srdmsatna.online
2. Press Ctrl+F5 once
3. PPT button should show `PPT engine: Local ✓`
4. Select PPT 16:9 or 4:3 and click PPT Download
