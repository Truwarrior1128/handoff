/* Repeating 14-day schedule, anchored to September 19, 2026 in Lakeland. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const ANCHOR = Date.UTC(2026, 8, 19);
  const OPEN_DAYS = [false, false, false, true, true, false, false, true, true, true, false, false, true, true];
  const localClock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const dateLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
  function isOpenDay(day) { return OPEN_DAYS[((Math.round((day - ANCHOR) / DAY) % 14) + 14) % 14]; }
  function getSchedule(now = new Date()) {
    const p = Object.fromEntries(localClock.formatToParts(now).map(part => [part.type, part.value]));
    const today = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
    const minutes = Number(p.hour) * 60 + Number(p.minute);
    const openToday = isOpenDay(today);
    const openNow = openToday && minutes >= 540 && minutes < 1020;
    let nextDay = today;
    if (!openToday || minutes >= 1020) {
      for (let i = 1; i <= 14; i++) { if (isOpenDay(today + i * DAY)) { nextDay = today + i * DAY; break; } }
    }
    const days = Array.from({ length: 14 }, (_, i) => {
      const day = today + i * DAY;
      return { label: dateLabel.format(day), iso: new Date(day).toISOString().slice(0, 10), open: isOpenDay(day), today: i === 0 };
    });
    return { openNow, openToday, today, nextDay, days,
      status: openNow ? 'Open now · Until 5 PM' : 'Closed now',
      next: openNow ? 'Today’s hours: 9 AM–5 PM' : `Next open: ${nextDay === today ? 'today' : dateLabel.format(nextDay)} at 9 AM`
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { getSchedule, isOpenDay };
  if (typeof document === 'undefined') return;
  function weekTable(days) {
    const list = document.createElement('ul'); list.className = 'hours-list';
    for (const day of days) {
      const row = document.createElement('li');
      if (day.today) row.className = 'hours-today';
      const time = document.createElement('time'); time.dateTime = day.iso;
      time.textContent = `${day.today ? 'Today · ' : ''}${day.label}`;
      const hours = document.createElement('span'); hours.textContent = day.open ? '9 AM–5 PM' : 'Closed';
      hours.className = day.open ? 'hours-open' : 'hours-closed';
      row.append(time, hours); list.append(row);
    }
    return list;
  }
  function renderHours() {
    const schedule = getSchedule();
    document.querySelectorAll('[data-hours-status]').forEach(el => { el.textContent = schedule.status; el.classList.toggle('is-open', schedule.openNow); });
    document.querySelectorAll('[data-hours-next]').forEach(el => { el.textContent = schedule.next; });
    document.querySelectorAll('[data-hours-week]').forEach(el => el.replaceChildren(weekTable(schedule.days.slice(0, 7))));
    document.querySelectorAll('[data-hours-next-week]').forEach(el => el.replaceChildren(weekTable(schedule.days.slice(7))));
  }
  document.querySelectorAll('[data-connection-badge]').forEach(el => {
    if (root.location.protocol === 'https:') return;
    // An HTTP local preview must not claim its connection is encrypted.
    const label = el.querySelector('span');
    if (label) label.textContent = 'HTTPS on live site';
    else el.append(document.createTextNode(' · on live site'));
    el.title = 'The public website uses HTTPS. This local preview is not an encrypted connection.';
  });
  renderHours();
  root.setInterval(renderHours, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderHours(); });
})(typeof window === 'undefined' ? globalThis : window);
