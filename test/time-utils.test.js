import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calendarDaysSince, formatRelativeReleaseDate, isNewRelease, parseDateOnly } from '../src/scripts/TimeUtils.js';

const at = value => new Date(value);
test('UTC release-day boundaries and NEW threshold are exact',()=>{
  const now=at('2026-03-31T23:59:59Z');
  assert.equal(calendarDaysSince('2026-03-31',now),0); assert.equal(formatRelativeReleaseDate('2026-03-31',now),'today');
  assert.equal(calendarDaysSince('2026-03-30',now),1); assert.equal(formatRelativeReleaseDate('2026-03-30',now),'1 day ago');
  assert.equal(isNewRelease('2026-03-01',now),true); assert.equal(isNewRelease('2026-02-28',now),false);
  assert.equal(isNewRelease('2026-04-01',now),false); assert.equal(formatRelativeReleaseDate('2026-04-01',now),'upcoming');
});
test('rollovers, leap day, and local-offset-looking instants use UTC calendar days',()=>{
  assert.equal(calendarDaysSince('2025-12-31',at('2026-01-01T00:00:01Z')),1);
  assert.equal(calendarDaysSince('2024-02-29',at('2024-03-01T00:01:00Z')),1);
  assert.equal(calendarDaysSince('2026-01-01',at('2026-01-01T00:30:00Z')),0);
  assert.equal(calendarDaysSince('2025-12-31',at('2025-12-31T23:30:00Z')),0);
  assert.equal(parseDateOnly('2025-02-29'),null);
});
test('relative output accepts browser now at runtime rather than a frozen build instant',()=>{
  assert.equal(formatRelativeReleaseDate('2026-01-01',at('2026-01-01T12:00:00Z')),'today');
  assert.equal(formatRelativeReleaseDate('2026-01-01',at('2026-02-01T12:00:00Z')),'1 month ago');
});
test('static homepage performs client-side clock enhancement',()=>{
  const client=readFileSync('src/scripts/home-page.js','utf8');
  assert.match(client,/enhanceRelativeDates\(document\)/); assert.doesNotMatch(client,/TIME_OFFSET|simNow/);
});
