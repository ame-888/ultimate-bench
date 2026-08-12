const DAY_MS = 86_400_000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getSiteNow() { return new Date(); }
export function parseDateOnly(value) {
  const match=DATE_ONLY.exec(value || ''); if(!match) return null;
  const time=Date.UTC(+match[1],+match[2]-1,+match[3]); const date=new Date(time);
  return date.getUTCFullYear()===+match[1]&&date.getUTCMonth()===+match[2]-1&&date.getUTCDate()===+match[3] ? date : null;
}
export function utcCalendarDay(date) { return Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()); }
export function calendarDaysSince(dateString, now=getSiteNow()) { const date=parseDateOnly(dateString); return date ? Math.floor((utcCalendarDay(now)-date.getTime())/DAY_MS) : null; }
export function isNewRelease(dateString, now=getSiteNow()) { const days=calendarDaysSince(dateString,now); return days!==null&&days>=0&&days<=30; }
export function formatRelativeReleaseDate(dateString, now=getSiteNow()) {
  const days=calendarDaysSince(dateString,now); if(days===null)return ''; if(days<0)return 'upcoming'; if(days===0)return 'today'; if(days===1)return '1 day ago'; if(days<30)return `${days} days ago`;
  const months=Math.floor(days/30.4375); if(months===1)return '1 month ago'; if(months<12)return `${months} months ago`; const years=Math.floor(months/12); return `${years} ${years===1?'year':'years'} ago`;
}
export function enhanceRelativeDates(root=document, now=getSiteNow()) {
  root.querySelectorAll('[data-release-date]').forEach(el=>{ const date=el.getAttribute('data-release-date'); if(!date)return; const line=el.closest('.model-name-line') ?? el.parentElement; const relative=line?.querySelector('.release-time-ago'); if(relative)relative.textContent=formatRelativeReleaseDate(date,now); let badge=line?.querySelector('.new-badge'); if(isNewRelease(date,now)&&line&&!badge){badge=document.createElement('span');badge.className='new-badge';badge.textContent='NEW';line.appendChild(badge)} else if(!isNewRelease(date,now)&&badge)badge.remove(); });
}
