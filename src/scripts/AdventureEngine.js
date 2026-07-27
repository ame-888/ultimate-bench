export class AdventureEngine {
    constructor() {
        this.key = 'adventure_save';

        this.themes = {
            'Cyberpunk': {
                currency: 'Credits',
                weapon: 'Mono-Katana',
                consumable: 'Stimpack',
                enemy: 'Corporate Drone',
                boss: 'Rogue AI',
                races: ['Cyborg', 'Hacker', 'Street Samurai'],
                classes: ['Netrunner', 'Solo', 'Techie'],
                locations: ['Neon Slums', 'Megacorp Spire', 'The Undercity']
            },
            'Medieval': {
                currency: 'Gold Coins',
                weapon: 'Longsword',
                consumable: 'Health Potion',
                enemy: 'Goblin',
                boss: 'Ancient Dragon',
                races: ['Human', 'Elf', 'Dwarf'],
                classes: ['Warrior', 'Mage', 'Rogue'],
                locations: ['Dark Forest', 'King\'s Castle', 'Abandoned Mines']
            },
            'Pirate': {
                currency: 'Doubloons',
                weapon: 'Cutlass',
                consumable: 'Rum',
                enemy: 'Skeleton Pirate',
                boss: 'The Kraken',
                races: ['Human', 'Merfolk', 'Cursed Undead'],
                classes: ['Swashbuckler', 'Cannoneer', 'Navigator'],
                locations: ['Tortuga', 'Shipwreck Cove', 'The Maelstrom']
            },
            'Old West': {
                currency: 'Silver Dollars',
                weapon: 'Six-Shooter',
                consumable: 'Whiskey',
                enemy: 'Outlaw',
                boss: 'Corrupt Sheriff',
                races: ['Human', 'Native', 'Vaquero'],
                classes: ['Gunslinger', 'Bounty Hunter', 'Doc'],
                locations: ['Dusty Saloon', 'Abandoned Mine', 'Ghost Town']
            }
        };

        this.story = {
            'start': {
                text: "Welcome to The Architect's Journey RPG. Choose your theme to begin your adventure:",
                choices: [
                    { text: "Cyberpunk", next: 'choose_race', theme: 'Cyberpunk' },
                    { text: "Medieval", next: 'choose_race', theme: 'Medieval' },
                    { text: "Pirate", next: 'choose_race', theme: 'Pirate' },
                    { text: "Old West", next: 'choose_race', theme: 'Old West' }
                ]
            },
            'choose_race': {
                text: "Select your race:",
                dynamicChoices: 'races',
                next: 'choose_class'
            },
            'choose_class': {
                text: "Select your class:",
                dynamicChoices: 'classes',
                next: 'init_game'
            },
            'init_game': {
                text: "Your journey begins in the {location1}. You have nothing but your {weapon} and 10 {currency}.",
                choices: [
                    { text: "Explore the area", next: 'explore' },
                    { text: "Check your stats", next: 'check_stats' }
                ]
            },
            'explore': {
                text: "You venture deeper into the {location1}. Suddenly, a wild {enemy} appears!",
                choices: [
                    { text: "Attack", next: 'combat_round' },
                    { text: "Flee", next: 'flee' }
                ]
            },
            'combat_round': {
                text: "You strike the {enemy} with your {weapon}!",
                dynamicCombat: true,
                choices: [
                    { text: "Continue Battle", next: 'combat_round' }
                ]
            },
            'combat_win': {
                text: "You defeated the {enemy}! You found a {consumable} and some {currency}.",
                choices: [
                    { text: "Continue exploring", next: 'explore_2' },
                    { text: "Rest (Consume Item)", next: 'rest', req: 'consumable' }
                ]
            },
            'combat_lose': {
                text: "You have been defeated... GAME OVER.",
                isEnd: true,
                choices: [
                    { text: "Restart", next: 'start' }
                ]
            },
            'flee': {
                text: "You managed to escape safely, but you feel like a coward. You lost some stamina.",
                statChanges: { stm: -10 },
                choices: [
                    { text: "Catch your breath", next: 'explore_2' }
                ]
            },
            'explore_2': {
                text: "You find yourself at the entrance of the {location2}. It looks dangerous.",
                choices: [
                    { text: "Enter the {location2}", next: 'boss_fight' },
                    { text: "Rest (Consume Item)", next: 'rest', req: 'consumable' },
                    { text: "Go back to {location1} to train", next: 'explore' }
                ]
            },
            'boss_fight': {
                text: "The {boss} blocks your path! This is the final showdown.",
                choices: [
                    { text: "Attack the {boss}", next: 'boss_combat_round' }
                ]
            },
            'boss_combat_round': {
                text: "You clash with the {boss}!",
                dynamicCombatBoss: true,
                choices: [
                    { text: "Continue Battle", next: 'boss_combat_round' }
                ]
            },
            'boss_win': {
                text: "You did it! You defeated the {boss} and saved the day. You are a true hero of this realm! CONGRATULATIONS!",
                isEnd: true,
                win: true,
                choices: [
                    { text: "Play Again", next: 'start' }
                ]
            },
            'rest': {
                text: "You consumed the {consumable}. You feel much better.",
                statChanges: { hp: 30, stm: 20 },
                consumeItem: true,
                choices: [
                    { text: "Continue", next: 'explore_2' }
                ]
            },
            'check_stats': {
                text: "You are a level {level} {race} {class}. You feel ready for anything.",
                choices: [
                    { text: "Back", next: 'explore' }
                ]
            }
        };

        this.defaultState = {
            currentNode: 'start',
            theme: null,
            inventory: [],
            currency: 0,
            enemyHp: 0,
            stats: {
                level: 1,
                xp: 0,
                hp: 100,
                maxHp: 100,
                stm: 50,
                maxStm: 50,
                str: 10,
                dex: 10,
                int: 10,
                race: '',
                charClass: '',
                status: 'OK'
            }
        };

        this.state = this.createDefaultState();
    }

    createDefaultState() {
        return structuredClone(this.defaultState);
    }

    explicitLoad() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) {
                const saved = JSON.parse(data);
                if (!this.isValidState(saved)) return false;

                // Merge with the current schema so older saves gain newly-added
                // fields without allowing malformed storage to break the game.
                this.state = {
                    ...this.createDefaultState(),
                    ...saved,
                    inventory: [...saved.inventory],
                    stats: { ...this.defaultState.stats, ...saved.stats }
                };
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    isValidState(state) {
        return Boolean(
            state &&
            typeof state === 'object' &&
            typeof state.currentNode === 'string' &&
            this.story[state.currentNode] &&
            (state.theme === null || this.themes[state.theme]) &&
            Array.isArray(state.inventory) &&
            state.stats &&
            typeof state.stats === 'object'
        );
    }

    explicitSave() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.state));
            return true;
        } catch (e) {
            console.error('Save failed', e);
            return false;
        }
    }

    interpolateText(text) {
        if (!this.state.theme) return text;
        const themeData = this.themes[this.state.theme];
        const values = {
            ...themeData,
            location1: themeData.locations[0],
            location2: themeData.locations[1],
            location3: themeData.locations[2],
            race: this.state.stats.race,
            class: this.state.stats.charClass,
            level: this.state.stats.level
        };
        return text.replace(/\{(\w+)\}/g, (placeholder, key) => values[key] ?? placeholder);
    }

    getCurrentNode() {
        const rawNode = this.story[this.state.currentNode];
        if (!rawNode) return null;
        const node = structuredClone(rawNode);

        node.text = this.interpolateText(node.text);

        if (node.dynamicChoices === 'races') {
            node.choices = this.themes[this.state.theme].races.map(race => ({
                text: race,
                next: rawNode.next,
                setRace: race
            }));
        } else if (node.dynamicChoices === 'classes') {
            node.choices = this.themes[this.state.theme].classes.map(c => ({
                text: c,
                next: rawNode.next,
                setClass: c
            }));
        }

        if (node.choices) {
            node.choices.forEach(c => {
                c.text = this.interpolateText(c.text);
            });
        }

        return node;
    }

    handleChoice(index, callbacks = {}) {
        const node = this.getCurrentNode();
        const choice = node?.choices?.[index];

        if (!choice) return;

        // Check Requirements
        if (choice.req) {
            let reqType = choice.req;
            if(reqType === 'consumable') reqType = this.themes[this.state.theme].consumable;

            if (!this.state.inventory.includes(reqType)) {
                return { error: "You lack the required item." };
            }
        }

        // Apply Theme Selection
        if (choice.theme) {
            this.state.theme = choice.theme;
        }
        if (choice.setRace) {
            this.state.stats.race = choice.setRace;
        }
        if (choice.setClass) {
            this.state.stats.charClass = choice.setClass;
            // Setup initial stats based on class
            if (choice.setClass.includes('Warrior') || choice.setClass.includes('Solo') || choice.setClass.includes('Swashbuckler') || choice.setClass.includes('Gunslinger')) {
                this.state.stats.str = 15;
                this.state.stats.maxHp = 120;
                this.state.stats.hp = 120;
            } else if (choice.setClass.includes('Mage') || choice.setClass.includes('Netrunner') || choice.setClass.includes('Navigator') || choice.setClass.includes('Doc')) {
                this.state.stats.int = 15;
                this.state.stats.maxStm = 80;
                this.state.stats.stm = 80;
            } else {
                this.state.stats.dex = 15;
            }
        }

        // End-screen actions start a genuinely fresh run. Previously the reset
        // was checked against the destination node, so "Restart" never reset.
        if (this.story[this.state.currentNode].isEnd) {
            this.state = this.createDefaultState();
            return this.getCurrentNode();
        }

        // Apply Setup for init_game
        if (choice.next === 'init_game') {
            const weapon = this.themes[this.state.theme].weapon;
            if (!this.state.inventory.includes(weapon)) this.state.inventory.push(weapon);
            this.state.currency = 10;
        }

        // Consume item logic
        if (this.story[this.state.currentNode].consumeItem) {
            const itemToConsume = this.themes[this.state.theme].consumable;
            const idx = this.state.inventory.indexOf(itemToConsume);
            if(idx > -1) this.state.inventory.splice(idx, 1);
        }

        // Move to next
        let nextNodeId = choice.next;

        // --- Combat Logic ---
        if (nextNodeId === 'combat_round' || nextNodeId === 'boss_combat_round') {
            const isBoss = nextNodeId === 'boss_combat_round';
            // Setup enemy HP if first round
            if (this.state.enemyHp <= 0) {
                this.state.enemyHp = isBoss ? 100 : 30;
            }

            // Player attacks
            const playerDmg = Math.floor(Math.random() * this.state.stats.str) + 5;
            this.state.enemyHp -= playerDmg;

            if (this.state.enemyHp <= 0) {
                nextNodeId = isBoss ? 'boss_win' : 'combat_win';
                // Loot logic for normal enemies
                if (!isBoss) {
                    this.state.currency += Math.floor(Math.random() * 10) + 5;
                    this.state.stats.xp += 20;
                    if (Math.random() > 0.5) {
                        const consumable = this.themes[this.state.theme].consumable;
                        this.state.inventory.push(consumable);
                        if (callbacks.onLoot) callbacks.onLoot(consumable);
                    }

                    // Level up check
                    if (this.state.stats.xp >= this.state.stats.level * 50) {
                        this.state.stats.level++;
                        this.state.stats.maxHp += 10;
                        this.state.stats.hp = this.state.stats.maxHp;
                        this.state.stats.str += 2;
                        this.state.stats.dex += 2;
                        this.state.stats.int += 2;
                        this.state.stats.status = 'LEVELED UP!';
                        setTimeout(() => { if(this.state.stats.status === 'LEVELED UP!') this.state.stats.status = 'OK'; }, 3000);
                    }
                }
            } else {
                // Enemy attacks
                const enemyDmg = isBoss ? (Math.floor(Math.random() * 15) + 10) : (Math.floor(Math.random() * 8) + 2);
                this.state.stats.hp = Math.max(0, this.state.stats.hp - enemyDmg);
                if (this.state.stats.hp <= 0) {
                    nextNodeId = 'combat_lose';
                }
            }
        }

        this.state.currentNode = nextNodeId;
        const newNode = this.story[this.state.currentNode];

        // Node Stat Changes (applied when entering node)
        this.applyStatChanges(newNode.statChanges);

        return this.getCurrentNode();
    }

    applyStatChanges(changes) {
        if (!changes) return;
        const { stats } = this.state;
        if (typeof changes.hp === 'number') {
            stats.hp = Math.max(0, Math.min(stats.maxHp, stats.hp + changes.hp));
        }
        if (typeof changes.stm === 'number') {
            stats.stm = Math.max(0, Math.min(stats.maxStm, stats.stm + changes.stm));
        }
        if (changes.status) stats.status = changes.status;
    }
}
