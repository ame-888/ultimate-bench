import assert from 'node:assert/strict';
import test from 'node:test';

import { AdventureEngine } from '../src/scripts/AdventureEngine.js';

test('creates independent state and interpolates dynamic choices', () => {
    const first = new AdventureEngine();
    const second = new AdventureEngine();

    first.handleChoice(1); // Medieval
    assert.equal(first.getCurrentNode().choices[0].text, 'Human');
    assert.equal(second.state.theme, null);
});

test('initializes a selected class exactly once', () => {
    const game = new AdventureEngine();
    game.handleChoice(0); // Cyberpunk
    game.handleChoice(0); // Cyborg
    game.handleChoice(0); // Netrunner

    assert.equal(game.state.currentNode, 'init_game');
    assert.equal(game.state.currency, 10);
    assert.deepEqual(game.state.inventory, ['Mono-Katana']);
    assert.equal(game.state.stats.int, 15);
    assert.equal(game.state.stats.maxStm, 80);
});

test('applies node effects with stat caps and consumes required items', () => {
    const game = new AdventureEngine();
    game.state.theme = 'Medieval';
    game.state.currentNode = 'combat_win';
    game.state.stats.hp = 80;
    game.state.stats.stm = 40;
    game.state.inventory.push('Health Potion');

    game.handleChoice(1); // enter rest
    assert.equal(game.state.stats.hp, 100);
    assert.equal(game.state.stats.stm, 50);
    game.handleChoice(0); // leave rest
    assert.deepEqual(game.state.inventory, []);
});

test('end-screen actions reset the entire run', () => {
    const game = new AdventureEngine();
    game.state.currentNode = 'boss_win';
    game.state.theme = 'Pirate';
    game.state.currency = 99;
    game.state.inventory.push('Cutlass');

    game.handleChoice(0);
    assert.deepEqual(game.state, game.defaultState);
    assert.notEqual(game.state, game.defaultState);
});

test('rejects malformed saves and migrates valid older saves', () => {
    const storage = new Map();
    global.localStorage = {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value)
    };
    const game = new AdventureEngine();

    storage.set(game.key, '{"currentNode":"missing"}');
    assert.equal(game.explicitLoad(), false);

    storage.set(game.key, JSON.stringify({
        currentNode: 'explore', theme: 'Old West', inventory: [], stats: { hp: 42 }
    }));
    assert.equal(game.explicitLoad(), true);
    assert.equal(game.state.stats.hp, 42);
    assert.equal(game.state.stats.maxHp, 100);
});
