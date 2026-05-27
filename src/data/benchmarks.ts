export const benchmarks = {
    levels: [
        { id: 'lvl1', name: 'Level 1' },
        { id: 'lvl2', name: 'Level 2' },
        { id: 'lvl3', name: 'Level 3' }
    ],
    models: [
        {
            name: 'GPT-5.4 Thinking Mini',
            scores: {
                'lvl1': 35,
                'lvl2': 38,
                'lvl3': 34,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Claude 4.5 Sonnet (with extended reasoning)',
            scores: {
                'lvl1': 24,
                'lvl2': 4,
                'lvl3': 0,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Claude 4.5 Haiku (with extended reasoning)',
            scores: {
                'lvl1': 6,
                'lvl2': 1,
                'lvl3': 2,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.5 Flash (with code execution)',
            scores: {
                'lvl1': 84,
                'lvl2': 92,
                'lvl3': 77,
                'lvl4': 'INVALID',
                'lvl5': 'INVALID'
            }
        },
        {
            name: 'Claude 4.6 Sonnet (with extended reasoning)',
            scores: {
                'lvl1': 12,
                'lvl2': 5,
                'lvl3': 2,
                'lvl4': 0,
                'lvl5': 0
            },
            releaseDate: '2026-02-21'
        },
        {
            name: 'Gemini 3.5 Flash',
            scores: {
                'lvl1': 79,
                'lvl2': 76,
                'lvl3': 64,
                'lvl4': 12,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.1 Pro Preview',
            scores: {
                'lvl1': 75,
                'lvl2': 64,
                'lvl3': 62,
                'lvl4': 0,
                'lvl5': 0
            },
            releaseDate: '2026-02-20'
        },
        {
            name: 'Gemini 3.1 Pro Preview (with code execution)',
            scores: {
                'lvl1': 84,
                'lvl2': 73,
                'lvl3': 56,
                'lvl4': 0,
                'lvl5': 0
            },
            releaseDate: '2026-02-20'
        },
        {
            name: 'Gemini 3.1 Flashlite GA',
            scores: {
                'lvl1': 38,
                'lvl2': 33,
                'lvl3': 39,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.1 Flashlite GA (with code execution)',
            scores: {
                'lvl1': 40,
                'lvl2': 33,
                'lvl3': 43,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.0 Flash Preview (with code execution)',
            scores: {
                'lvl1': 85,
                'lvl2': 61,
                'lvl3': 66,
                'lvl4': 4,
                'lvl5': 0
            },
            releaseDate: '2026-02-06'
        },
        {
            name: 'Gemini 2.5 Pro',
            scores: {
                'lvl1': 40,
                'lvl2': 32,
                'lvl3': 44,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.0 Pro Preview',
            scores: {
                'lvl1': 42,
                'lvl2': 50,
                'lvl3': 35,
                'lvl4': 2,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.1 Flashlite Preview',
            scores: {
                'lvl1': 30,
                'lvl2': 29,
                'lvl3': 63,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 3.0 Flash Preview',
            scores: {
                'lvl1': 81,
                'lvl2': 60,
                'lvl3': 54,
                'lvl4': 3,
                'lvl5': 0
            }
        },
        {
            name: 'Gemini 2.5 Flash',
            scores: {
                'lvl1': 6,
                'lvl2': 11,
                'lvl3': 13,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Grok 4.20 Expert',
            scores: {
                'lvl1': 10,
                'lvl2': 7,
                'lvl3': 3,
                'lvl4': 0,
                'lvl5': 0
            },
            releaseDate: '2026-02-18'
        },
        {
            name: 'Muse Spark (with reasoning)',
            scores: {
                'lvl1': 'INVALID',
                'lvl2': 'INVALID',
                'lvl3': 'INVALID',
                'lvl4': 'INVALID',
                'lvl5': 'INVALID'
            }
        },
        {
            name: 'GPT-5.5 Instant',
            scores: {
                'lvl1': 30,
                'lvl2': 38,
                'lvl3': 19,
                'lvl4': 0,
                'lvl5': 0
            }
        },
        {
            name: 'Grok 4.3 Fast',
            scores: {
                'lvl1': 6,
                'lvl2': 4,
                'lvl3': 0,
                'lvl4': 0,
                'lvl5': 0
            }
        }
    ],
    dataRetrieval: [
        { name: 'Gemini 3.5 Flash', scores: { worm: 16, koala: 'INVALID', crow: 'INVALID', octopus: 'INVALID' } },
        { name: 'Grok 4.20 Expert', scores: { worm: 24, koala: "UNAVAILABLE", crow: "UNAVAILABLE", octopus: "UNAVAILABLE" }, releaseDate: '2026-02-18' },
        { name: 'Grok 4.3 Fast', scores: { worm: 27, koala: 21, crow: 7, octopus: 0 } },
        { name: 'Gemini 3.1 Pro Preview', scores: { worm: 20, koala: 11, crow: 11, octopus: 0 } },
        { name: 'Muse Spark (with reasoning)', scores: { worm: 13, koala: 'INVALID', crow: 'INVALID', octopus: 'INVALID' } },
        { name: 'Claude 4.6 Sonnet (with extended reasoning)', scores: { worm: 9, koala: 10, crow: 3, octopus: 0 }, releaseDate: '2026-02-21' },
        { name: 'GPT-5.5 Instant', scores: { worm: 34, koala: 3, crow: 0, octopus: 0 } },
        { name: 'Gemini 3.1 Flashlite GA', scores: { worm: 16, koala: 14, crow: 8, octopus: 0 } },
        { name: 'Gemini 3.0 Flash Preview', scores: { worm: 15, koala: 19, crow: 2, octopus: 0 } }
    ],
    chessModels: [
        { name: 'Gemini 3.1 Flashlite GA', scores: { mouse: 0, spider: 0, wolf: 0, hawk: 0, python: 0 } },
        { name: 'Grok 4.3 Fast', scores: { mouse: 0, spider: 0, wolf: 0, hawk: 0, python: 0 } },
        { name: 'Gemini 3.1 Pro Preview*', scores: { mouse: 57, spider: 0, wolf: 0, hawk: 0, python: 0 } },
        { name: 'GPT-5.5 Instant', scores: { mouse: 0, spider: 0, wolf: 0, hawk: 0, python: 0 } },
        { name: 'Gemini 3.5 Flash', scores: { mouse: 40, spider: 0, wolf: 0, hawk: 0, python: 0 } },
        { name: 'Claude 4.6 Sonnet (with extended reasoning)*', scores: { mouse: 0, spider: 0, wolf: 0, hawk: 0, python: 0 } }
    ]
};
