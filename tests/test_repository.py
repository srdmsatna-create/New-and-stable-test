import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DashboardRegressionTests(unittest.TestCase):
    def test_canonical_v69_marker(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("V69-UI-FIX-2026-09-02", html)
        self.assertNotIn("V64-FORCE-VISIBLE-2026-08-29", html)

    def test_v69_visual_css_hygiene(self):
        css = (ROOT / 'styles.css').read_text(encoding='utf-8')
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertEqual(css.count(':root'), 1)
        self.assertLessEqual(css.count('!important'), 500)
        self.assertIn('font-family:"Inter"', css)
        self.assertNotIn('@media (prefers-color-scheme:dark)', css)
        self.assertIn('html[data-theme="dark"]', css)
        self.assertIn('assets/social-preview.png', html)
        self.assertIn('fonts.googleapis.com/css2?family=Inter', html)
        self.assertIn('id="themeToggleBtn"', html)
        self.assertIn('V69 UI FIX', html)

    def test_zero_mandays_is_module_not_patch(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("modules/zero-mandays.js?v=69", html)
        self.assertIn("modules/zero-mandays.css?v=69", html)
        self.assertNotIn("SRDM_ZERO_MANDAYS_TAB_V1_START", html)
        self.assertTrue((ROOT / "modules/zero-mandays.js").stat().st_size > 1000)

    def test_single_action_and_no_schedule(self):
        workflows = list((ROOT / ".github/workflows").glob("*.y*ml"))
        self.assertEqual([p.name for p in workflows], ["dashboard-validation.yml"])
        self.assertNotIn("schedule:", workflows[0].read_text(encoding="utf-8"))

    def test_lock_is_intentionally_preserved(self):
        text = (ROOT / "scripts/merge_official_summary.py").read_text(encoding="utf-8")
        self.assertIn("ONGOING_LOCK_END = date(2026, 9, 6)", text)
        self.assertIn('"AMARPATAN": (1044,109)', text)
        self.assertIn("if p!=11995 or e!=756", text)

    def test_no_credentials_or_patch_script(self):
        self.assertFalse((ROOT / "LOGIN_CREDENTIALS.txt").exists())
        self.assertFalse((ROOT / "patch_zero_mandays_v4.py").exists())

    def test_index_is_shell_not_data_bundle(self):
        html_path = ROOT / "index.html"
        self.assertLess(html_path.stat().st_size, 2_000_000)
        html = html_path.read_text(encoding="utf-8")
        self.assertNotIn('src="ongoing-details.js?v=69"', html)
        self.assertIn("s.src='ongoing-details.js?v=69'", (ROOT / 'app.js').read_text(encoding='utf-8'))
        self.assertIn('src="app.js?v=69"', html)
        self.assertIn('src="modules/mandays-selfcontained-v8.js?v=69"', html)
        self.assertIn('src="modules/zero-mandays-force-data.js?v=69"', html)

    def test_auto_report_has_eight_janpads(self):
        text = (ROOT / "auto-data.js").read_text(encoding="utf-8").strip()
        text = re.sub(r"^window\.AUTO_REPORT\s*=\s*", "", text).rstrip(";")
        data = json.loads(text)
        self.assertEqual(len(data.get("official", [])), 8)
        self.assertEqual(len(data.get("daily", [])), 8)

    def test_v69_hygiene_and_pwa(self):
        self.assertFalse((ROOT / "official-summary.csv").exists())
        self.assertFalse((ROOT / "sample-data.js").exists())
        self.assertFalse((ROOT / "scripts_local/local_auto_update_cloud_v2.py").exists())
        self.assertFalse((ROOT / "legacy/update-paths").exists())
        self.assertTrue((ROOT / "manifest.webmanifest").exists())
        self.assertTrue((ROOT / "service-worker.js").exists())
        self.assertTrue((ROOT / "data/history/summary-history.csv").exists())
        self.assertIn('incoming/Daily Report.xlsx', (ROOT / '.gitignore').read_text(encoding='utf-8'))

    def test_no_document_write(self):
        html=(ROOT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("document.write(",html)
        self.assertIn('auto-data.js?v=69',html)
        self.assertIn('vendor/pptxgen.bundle.js?v=69',html)

if __name__ == "__main__":
    unittest.main()
