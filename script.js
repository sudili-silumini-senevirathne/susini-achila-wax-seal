// =========================================================
// SUSINI & ACHILA — MODERN WAX-SEAL INVITATION
// Demo project only. Backend/Google Sheet will be added after approval.
// =========================================================

const WEDDING_DATE = new Date('2027-05-16T09:00:00+05:30');
const CHURCH_MAP = 'https://www.google.com/maps/search/?api=1&query=St.+Jude%27s+Church+Daluwakotuwa+Sri+Lanka';

// Auto-scroll behavior requested:
// - starts after the invitation opens
// - pauses whenever the guest manually scrolls/touches/uses the wheel
// - DOES NOT stop permanently
// - automatically resumes after the guest stops interacting
const AUTO_SCROLL_ENABLED = true;
const AUTO_SCROLL_START_DELAY = 1800;
const AUTO_SCROLL_RESUME_DELAY = 2800;
const AUTO_SCROLL_SPEED_PX_PER_SECOND = 24;

const envelopeScreen = document.getElementById('envelopeScreen');
const envelope = document.getElementById('envelope');
const openInvitation = document.getElementById('openInvitation');
const floatingActions = document.getElementById('floatingActions');
const weddingAudio = document.getElementById('weddingAudio');
const musicToggle = document.getElementById('musicToggle');
const calendarBtn = document.getElementById('calendarBtn');
const locationBtn = document.getElementById('locationBtn');
const rsvpShortcut = document.getElementById('rsvpShortcut');
const rsvpForm = document.getElementById('rsvpForm');
const formResult = document.getElementById('formResult');
const guestCount = document.getElementById('guestCount');
const guestCountGroup = document.getElementById('guestCountGroup');
const guestName = document.getElementById('guestName');
const rsvpName = document.getElementById('rsvpName');

// Personalized demo link support: ?name=Miss%20Sudili&max=2
const params = new URLSearchParams(location.search);
const displayName = (params.get('name') || 'Our Dear Guest').trim();
const maxGuests = Math.max(1, Math.min(10, Number(params.get('max') || 2) || 2));
guestName.textContent = displayName;
rsvpName.value = displayName;
for (let i = 1; i <= maxGuests; i++) {
  const option = document.createElement('option');
  option.value = String(i);
  option.textContent = i === 1 ? '1 Guest' : `${i} Guests`;
  guestCount.appendChild(option);
}

// =========================================================
// ENVELOPE OPENING + MUSIC
// =========================================================
let invitationOpened = false;
openInvitation.addEventListener('click', async () => {
  if (invitationOpened) return;
  invitationOpened = true;
  envelope.classList.add('opening');

  try {
    weddingAudio.volume = 0.34;
    await weddingAudio.play();
  } catch (e) {
    // Some browsers can still block playback; user can use the music button.
  }

  window.setTimeout(() => {
    envelopeScreen.classList.add('is-gone');
    document.body.classList.remove('locked');
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    floatingActions.hidden = false;
    setScrollTop(0);
    startRevealObserver();

    // Give the opened invitation a moment to settle, then begin moving.
    if (AUTO_SCROLL_ENABLED) {
      autoScrollStarted = true;
      scheduleAutoScroll(AUTO_SCROLL_START_DELAY);
    }
  }, 1450);
});

musicToggle.addEventListener('click', async () => {
  if (weddingAudio.paused) {
    try { await weddingAudio.play(); } catch (e) {}
  } else {
    weddingAudio.pause();
  }
});

// =========================================================
// AUTO SCROLL — ROBUST MOBILE/DESKTOP VERSION
// =========================================================
// Behaviour:
// 1) Starts automatically after the envelope opens.
// 2) Uses the browser's real scrolling element (important on mobile).
// 3) Pauses immediately when the guest manually scrolls.
// 4) Automatically resumes a few seconds after the guest stops.
// 5) Keeps going until the RSVP/end of the invitation.
let autoScrollRaf = null;
let autoScrollResumeTimer = null;
let lastAutoTimestamp = null;
let autoScrollStarted = false;
let userInteracting = false;
let focusPause = false;

function getScrollRoot() {
  return document.scrollingElement || document.documentElement || document.body;
}

function getScrollTop() {
  const root = getScrollRoot();
  return Number(root.scrollTop || window.pageYOffset || 0);
}

function getMaxScrollTop() {
  const root = getScrollRoot();
  return Math.max(0, root.scrollHeight - window.innerHeight);
}

function atBottom() {
  return getScrollTop() >= getMaxScrollTop() - 6;
}

function setScrollTop(value) {
  const root = getScrollRoot();
  const next = Math.max(0, Math.min(getMaxScrollTop(), value));

  // Setting the actual scrolling element is more reliable than scrollBy()
  // when the invitation is opened from a local file or on mobile Safari.
  root.scrollTop = next;

  // Fallback for browsers that keep body/documentElement scrolling separate.
  if (Math.abs(getScrollTop() - next) > 2) {
    window.scrollTo(0, next);
  }
}

function stopAutoScrollFrame() {
  if (autoScrollRaf !== null) {
    cancelAnimationFrame(autoScrollRaf);
  }
  autoScrollRaf = null;
  lastAutoTimestamp = null;
}

function autoScrollStep(timestamp) {
  if (!autoScrollStarted || userInteracting || focusPause || atBottom()) {
    stopAutoScrollFrame();
    return;
  }

  if (lastAutoTimestamp === null) {
    lastAutoTimestamp = timestamp;
  }

  const elapsed = Math.min(80, Math.max(0, timestamp - lastAutoTimestamp));
  lastAutoTimestamp = timestamp;

  const current = getScrollTop();
  const distance = AUTO_SCROLL_SPEED_PX_PER_SECOND * (elapsed / 1000);
  setScrollTop(current + distance);

  if (!atBottom()) {
    autoScrollRaf = requestAnimationFrame(autoScrollStep);
  } else {
    stopAutoScrollFrame();
  }
}

function resumeAutoScrollNow() {
  if (!invitationOpened || !autoScrollStarted || userInteracting || focusPause || atBottom()) {
    return;
  }

  if (autoScrollRaf !== null) {
    return;
  }

  lastAutoTimestamp = null;
  autoScrollRaf = requestAnimationFrame(autoScrollStep);
}

function scheduleAutoScroll(delay = AUTO_SCROLL_RESUME_DELAY) {
  clearTimeout(autoScrollResumeTimer);

  autoScrollResumeTimer = setTimeout(() => {
    if (!invitationOpened || focusPause || atBottom()) {
      return;
    }

    autoScrollStarted = true;
    userInteracting = false;
    resumeAutoScrollNow();
  }, delay);
}

function pauseForManualInteraction() {
  if (!invitationOpened) {
    return;
  }

  userInteracting = true;
  stopAutoScrollFrame();
  clearTimeout(autoScrollResumeTimer);

  // Important: manual scrolling only pauses the experience.
  // It never disables auto-scroll permanently.
  autoScrollResumeTimer = setTimeout(() => {
    userInteracting = false;
    resumeAutoScrollNow();
  }, AUTO_SCROLL_RESUME_DELAY);
}

// Desktop / trackpad
window.addEventListener('wheel', pauseForManualInteraction, { passive: true });

// Mobile touch scrolling. touchstart catches the interaction immediately;
// touchmove refreshes the resume timer while the finger is still moving.
window.addEventListener('touchstart', pauseForManualInteraction, { passive: true });
window.addEventListener('touchmove', pauseForManualInteraction, { passive: true });

// Keyboard scrolling
window.addEventListener('keydown', e => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
    pauseForManualInteraction();
  }
});

// Pause while the guest is filling in the RSVP form.
rsvpForm.addEventListener('focusin', () => {
  focusPause = true;
  stopAutoScrollFrame();
  clearTimeout(autoScrollResumeTimer);
});

rsvpForm.addEventListener('focusout', () => {
  setTimeout(() => {
    if (!rsvpForm.contains(document.activeElement)) {
      focusPause = false;
      scheduleAutoScroll(3500);
    }
  }, 80);
});

// =========================================================
// REVEALS
// =========================================================
function startRevealObserver() {
  const items = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -4% 0px' });
  items.forEach(item => observer.observe(item));
}

// =========================================================
// COUNTDOWN
// =========================================================
function updateCountdown() {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) {
    ['days','hours','minutes','seconds'].forEach(id => document.getElementById(id).textContent = '00');
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  document.getElementById('days').textContent = String(days).padStart(2,'0');
  document.getElementById('hours').textContent = String(hours).padStart(2,'0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2,'0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// =========================================================
// FLOATING ACTIONS
// =========================================================
calendarBtn.addEventListener('click', () => {
  pauseForManualInteraction();
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InviteBloom//Susini and Achila//EN',
    'BEGIN:VEVENT',
    'UID:susini-achila-20270516@invitebloom',
    'DTSTAMP:20261014T000000Z',
    'DTSTART:20270516T033000Z',
    'DTEND:20270516T103000Z',
    'SUMMARY:Susini & Achila Wedding',
    "LOCATION:St. Jude's Church, Daluwakotuwa / Olanro Hotel, Negombo",
    'DESCRIPTION:Wedding of Susini and Achila',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Susini-Achila-Wedding.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

locationBtn.addEventListener('click', () => {
  pauseForManualInteraction();
  document.getElementById('venue').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
rsvpShortcut.addEventListener('click', () => {
  pauseForManualInteraction();
  document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// =========================================================
// DEMO RSVP (backend will be connected only after user approval)
// =========================================================
rsvpForm.addEventListener('change', e => {
  if (e.target.name === 'attendance') {
    guestCountGroup.style.display = e.target.value === 'No' ? 'none' : 'grid';
  }
});

rsvpForm.addEventListener('submit', e => {
  e.preventDefault();
  const selected = rsvpForm.querySelector('input[name="attendance"]:checked');
  if (!selected) return;
  formResult.style.display = 'block';
  formResult.textContent = selected.value === 'Yes'
    ? `Thank you, ${displayName}. We can't wait to celebrate with you.`
    : `Thank you, ${displayName}. Your response has been noted.`;
  // No network request in this approval version.
});
