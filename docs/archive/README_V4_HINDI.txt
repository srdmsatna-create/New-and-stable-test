SRDM ZERO MANDAYS V4 — ONE CLICK

1) ZIP extract karein.
2) APPLY_ZERO_MANDAYS_V4_ONE_CLICK.bat aur patch_zero_mandays_v4.py ko dashboard Git repository ke andar rakhein.
3) APPLY_ZERO_MANDAYS_V4_ONE_CLICK.bat double-click karein.

V4 kya karta hai:
- current Git-tracked index.html ko patch karta hai; static old HTML copy nahi karta.
- latest origin/main pull karta hai.
- Zero Mandays Generation tab ko Mandays Generation ke turant baad force-visible add karta hai.
- data wahi window.SRDM_V8_MONTHLY use karta hai jo Mandays Generation use karta hai.
- git diff stage verify karta hai; no-change par SUCCESS nahi bolega.
- real commit hash banne ke baad hi push karta hai.
- deploy ke baad https://srdmsatna.online/?v=<commit> cache-bypass ke saath kholta hai.
