SUSINI & ACHILA — MODERN WAX-SEAL INVITATION V3
================================================

This is the design-approval version.
The Google Sheet / Apps Script backend is NOT connected yet.

V3 FIXES
--------
1. MOBILE RESPONSIVE
   - Optimized for iPhone and Android widths, including very small phones.
   - Mobile-friendly photo sizes, typography, RSVP form, floating buttons,
     safe-area spacing and landscape handling.

2. MOBILE AUTO-SCROLL
   - Starts automatically after the wax seal invitation opens.
   - Uses a floating-point internal scroll position so slow scrolling works
     reliably on mobile browsers that round scrollTop values.
   - Manual touch/wheel/keyboard scrolling pauses it immediately.
   - It automatically resumes about 3 seconds after the guest stops.
   - It pauses while the guest is using the RSVP form or RSVP popup.

3. RSVP CONFIRMATION POPUP
   - Press SEND RSVP after choosing an answer.
   - A styled confirmation popup appears with the guest name.
   - The popup has separate wording for accepting or declining.
   - This is demo-only until the Google Apps Script backend is connected.

PERSONALIZED DEMO LINK
----------------------
index.html?name=Miss%20Sudili&max=2

IMPORTANT
---------
When you approve this design, connect the real Google Sheet / Apps Script.
At that stage, the confirmation popup should be shown only after the RSVP
has successfully been saved to the backend.
