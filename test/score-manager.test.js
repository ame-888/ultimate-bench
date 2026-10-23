import test from 'node:test';
import assert from 'node:assert/strict';
import { ScoreManager } from '../src/scripts/GameEngine.js';

test('high scores reject malformed storage and HTML payloads before rendering', () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    let value = JSON.stringify({ tetris: {}, snake: [{ score: '<img src=x onerror=alert(1)>', date: '2026-10-23' }], breakout: null, pool: [{ score: 10, date: 'bad date' }], tictactoe: '<svg/onload=alert(1)>' });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => value } });
    try {
        const manager = new ScoreManager();
        assert.deepEqual(manager.getScores(), { tetris: [], snake: [], breakout: [], pool: [], tictactoe: 0 });
        value = JSON.stringify({ snake: Array.from({ length: 8 }, (_, score) => ({ score, date: '2026-10-23T00:00:00Z' })), tictactoe: 3 });
        assert.deepEqual(manager.getScores().snake.map(row => row.score), [7, 6, 5, 4, 3]);
        assert.equal(manager.getScores().tictactoe, 3);
        value = '{invalid';
        assert.deepEqual(manager.getScores().snake, []);
        value = 'null';
        assert.deepEqual(manager.getScores().pool, []);
    } finally {
        if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
        else delete globalThis.localStorage;
    }
});
