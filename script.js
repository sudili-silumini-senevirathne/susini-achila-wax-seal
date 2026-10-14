// =========================================================
// SUSINI & ACHILA — MODERN WAX-SEAL INVITATION
// Mobile-first demo. Backend/Google Sheet is intentionally not connected yet.
// =========================================================

const WEDDING_DATE = new Date('2027-05-16T09:00:00+05:30');

// Auto-scroll behavior:
// - starts after opening
// - works with a fractional internal position so slow scrolling also works on iOS
// - pauses immediately for manual touch/wheel/keyboard interaction
// - resumes automatically after the guest stops interacting
// - pauses while the RSVP form or confirmation popup is being used
const AUTO_SCROLL_ENABLED = true;
const AUTO_SCROLL_START_DELAY = 1700;
const AUTO_SCROLL_RESUME_DELAY = 3000;
const AUTO_SCROLL_SPEED_PX_PER_SECOND = 28;

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
const rsvpModal = document.getElementById('rsvpModal');
const rsvpModalTitle = document.getElementById('rsvpModalTitle');
const rsvpModalMessage = document.getElementById('rsvpModalMessage');
const rsvpModalMark = document.getElementById('rsvpModalMark');

// Personalized demo link support: ?name=Miss%20Sudili&max=2
const params = new URLSearchParams(location.search);
const displayName = (params.get('name') || 'Our Dear Guest').trim();
const maxGuests = Math.max(1, Math.min(10, Number(params.get('max') || 2) || 2));

guestName.textContent = displayName;
rsvpName.value = displayName;

for (let i = 1; i <= maxGuests; i += 1) {
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
  } catch (error) {
    // Mobile browsers can still block playback in some cases.
    // The MUSIC button remains available as a fallback.
  }

  window.setTimeout(() => {
    envelopeScreen.classList.add('is-gone');
    document.body.classList.remove('locked');
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    floatingActions.hidden = false;

    // Force a clean top position after the fixed opening screen disappears.
    window.scrollTo(0, 0);
    autoScrollPosition = 0;

    startRevealObserver();

    if (AUTO_SCROLL_ENABLED) {
      autoScrollStarted = true;
      scheduleAutoScroll(AUTO_SCROLL_START_DELAY);
    }
  }, 1450);
});

musicToggle.addEventListener('click', async () => {
  if (weddingAudio.paused) {
    try {
      await weddingAudio.play();
    } catch (error) {}
  } else {
    weddingAudio.pause();
  }
});

// =========================================================
// AUTO SCROLL — MOBILE / iOS SAFE VERSION
// =========================================================
let autoScrollRaf = null;
let autoScrollResumeTimer = null;
let lastAutoTimestamp = null;
let autoScrollStarted = false;
let autoScrollPosition = 0;
let userTouchActive = false;
let focusPause = false;
let modalPause = false;

function getScrollTop() {
  return Math.max(
    0,
    Number(
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    )
  );
}

function getMaxScrollTop() {
  const doc = document.documentElement;
  const body = document.body;
  const scrollHeight = Math.max(
    doc.scrollHeight,
    body.scrollHeight,
    doc.offsetHeight,
    body.offsetHeight
  );
  return Math.max(0, scrollHeight - window.innerHeight);
}

function atBottom() {
  return getScrollTop() >= getMaxScrollTop() - 8;
}

function stopAutoScrollFrame() {
  if (autoScrollRaf !== null) {
    cancelAnimationFrame(autoScrollRaf);
  }
  autoScrollRaf = null;
  lastAutoTimestamp = null;
}

function syncAutoScrollPosition() {
  autoScrollPosition = getScrollTop();
}

function autoScrollStep(timestamp) {
  if (
    !invitationOpened ||
    !autoScrollStarted ||
    userTouchActive ||
    focusPause ||
    modalPause ||
    document.hidden ||
    atBottom()
  ) {
    stopAutoScrollFrame();
    return;
  }

  if (lastAutoTimestamp === null) {
    lastAutoTimestamp = timestamp;
    autoScrollPosition = getScrollTop();
  }

  const elapsed = Math.min(80, Math.max(0, timestamp - lastAutoTimestamp));
  lastAutoTimestamp = timestamp;

  // Keep a floating-point position internally. Some mobile browsers round
  // scrollTop to whole pixels, which can otherwise make a very slow scroll
  // appear completely stationary.
  autoScrollPosition += AUTO_SCROLL_SPEED_PX_PER_SECOND * (elapsed / 1000);
  autoScrollPosition = Math.min(autoScrollPosition, getMaxScrollTop());

  window.scrollTo(0, Math.round(autoScrollPosition));

  if (!atBottom()) {
    autoScrollRaf = requestAnimationFrame(autoScrollStep);
  } else {
    stopAutoScrollFrame();
  }
}

function resumeAutoScrollNow() {
  if (
    !invitationOpened ||
    !autoScrollStarted ||
    userTouchActive ||
    focusPause ||
    modalPause ||
    document.hidden ||
    atBottom()
  ) {
    return;
  }

  if (autoScrollRaf !== null) return;

  syncAutoScrollPosition();
  lastAutoTimestamp = null;
  autoScrollRaf = requestAnimationFrame(autoScrollStep);
}

function scheduleAutoScroll(delay = AUTO_SCROLL_RESUME_DELAY) {
  clearTimeout(autoScrollResumeTimer);

  autoScrollResumeTimer = window.setTimeout(() => {
    if (
      !invitationOpened ||
      userTouchActive ||
      focusPause ||
      modalPause ||
      document.hidden ||
      atBottom()
    ) {
      return;
    }

    autoScrollStarted = true;
    resumeAutoScrollNow();
  }, delay);
}

function pauseAutoScroll() {
  if (!invitationOpened) return;
  stopAutoScrollFrame();
  clearTimeout(autoScrollResumeTimer);
  syncAutoScrollPosition();
}

function pauseAndResumeAfterInteraction(delay = AUTO_SCROLL_RESUME_DELAY) {
  pauseAutoScroll();
  scheduleAutoScroll(delay);
}

// iPhone / Android touch interaction.
window.addEventListener('touchstart', () => {
  if (!invitationOpened) return;
  userTouchActive = true;
  pauseAutoScroll();
}, { passive: true });

window.addEventListener('touchmove', () => {
  if (!invitationOpened) return;
  pauseAutoScroll();
}, { passive: true });

function finishTouchInteraction() {
  if (!invitationOpened) return;
  userTouchActive = false;
  syncAutoScrollPosition();
  scheduleAutoScroll(AUTO_SCROLL_RESUME_DELAY);
}

window.addEventListener('touchend', finishTouchInteraction, { passive: true });
window.addEventListener('touchcancel', finishTouchInteraction, { passive: true });

// Desktop mouse wheel / trackpad.
window.addEventListener('wheel', () => {
  pauseAndResumeAfterInteraction(AUTO_SCROLL_RESUME_DELAY);
}, { passive: true });

// Keyboard scrolling.
window.addEventListener('keydown', event => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
    pauseAndResumeAfterInteraction(AUTO_SCROLL_RESUME_DELAY);
  }
});

// If the tab/app was temporarily hidden, resume cleanly when it becomes active.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseAutoScroll();
  } else if (invitationOpened) {
    syncAutoScrollPosition();
    scheduleAutoScroll(1200);
  }
});

window.addEventListener('resize', () => {
  syncAutoScrollPosition();
});

// Pause while the guest is filling the RSVP form.
rsvpForm.addEventListener('focusin', () => {
  focusPause = true;
  pauseAutoScroll();
});

rsvpForm.addEventListener('focusout', () => {
  window.setTimeout(() => {
    if (!rsvpForm.contains(document.activeElement)) {
      focusPause = false;
      syncAutoScrollPosition();
      scheduleAutoScroll(3500);
    }
  }, 100);
});

// =========================================================
// REVEALS
// =========================================================
function startRevealObserver() {
  const items = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

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
    ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

// =========================================================
// FLOATING ACTIONS
// =========================================================
calendarBtn.addEventListener('click', () => {
  pauseAndResumeAfterInteraction(4500);

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
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Susini-Achila-Wedding.ics';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

locationBtn.addEventListener('click', () => {
  pauseAndResumeAfterInteraction(5000);
  document.getElementById('venue').scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(syncAutoScrollPosition, 900);
});

rsvpShortcut.addEventListener('click', () => {
  pauseAndResumeAfterInteraction(5000);
  document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(syncAutoScrollPosition, 900);
});

// =========================================================
// RSVP DEMO + BEAUTIFUL CONFIRMATION POPUP
// =========================================================
rsvpForm.addEventListener('change', event => {
  if (event.target.name === 'attendance') {
    guestCountGroup.style.display = event.target.value === 'No' ? 'none' : 'grid';
  }
});

function openRsvpModal(attendance) {
  modalPause = true;
  focusPause = true;
  pauseAutoScroll();

  const attending = attendance === 'Yes';
  rsvpModal.classList.toggle('is-decline', !attending);
  rsvpModalMark.textContent = attending ? '✓' : '♡';
  rsvpModalTitle.textContent = attending ? 'We are so happy!' : 'Thank you for letting us know';
  rsvpModalMessage.textContent = attending
    ? `${displayName}, your RSVP has been received. We cannot wait to celebrate this beautiful day with you.`
    : `${displayName}, thank you for your response. You will be in our thoughts as we celebrate our special day.`;

  rsvpModal.classList.add('is-open');
  rsvpModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('rsvp-modal-open');
}

function closeRsvpModal() {
  rsvpModal.classList.remove('is-open');
  rsvpModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('rsvp-modal-open');
  modalPause = false;
  focusPause = false;
  syncAutoScrollPosition();
  scheduleAutoScroll(2200);
}

document.querySelectorAll('[data-close-rsvp]').forEach(element => {
  element.addEventListener('click', closeRsvpModal);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && rsvpModal.classList.contains('is-open')) {
    closeRsvpModal();
  }
});

rsvpForm.addEventListener('submit', event => {
  event.preventDefault();

  const selected = rsvpForm.querySelector('input[name="attendance"]:checked');
  if (!selected) return;

  formResult.style.display = 'none';
  openRsvpModal(selected.value);

  // Demo only: no network request is sent yet.
  // Once the design is approved, the Google Apps Script response can call
  // openRsvpModal(...) only after the RSVP is successfully saved.
});
