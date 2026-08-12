/** Canonical, auditable model dates. Date-only values are public-release UTC calendar dates. */
export interface ModelMetadata { releaseDate: string; source: string; observationDate?: string; note?: string }

const sources = {
  anthropic: 'https://www.anthropic.com/news',
  anthropicNotes: 'https://docs.anthropic.com/en/release-notes/api',
  openai: 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes',
  google: 'https://ai.google.dev/gemini-api/docs/deprecations',
  meta: 'https://ai.meta.com/blog/',
  xai: 'https://docs.x.ai/docs/release-notes',
} as const;

const canonical = {
  claude3opus: { releaseDate:'2024-03-04', source:'https://www.anthropic.com/news/claude-3-family' },
  claude45sonnet: { releaseDate:'2025-09-29', source:sources.anthropic }, claude45haiku: { releaseDate:'2025-10-15', source:sources.anthropic },
  claude46sonnet: { releaseDate:'2026-02-17', observationDate:'2026-02-21', source:sources.anthropic }, claude48opus: { releaseDate:'2026-05-28', source:sources.anthropic },
  claude5fable: { releaseDate:'2026-06-09', observationDate:'2026-07-18', source:sources.anthropic, note:'Original public launch; July redeployment did not create a new model release.' },
  claude5opus: { releaseDate:'2026-07-24', source:sources.anthropicNotes },
  gpt54: { releaseDate:'2026-03-05', source:sources.openai }, gpt54mini: { releaseDate:'2026-03-17', source:sources.openai, note:'Model launch; ChatGPT rollout followed March 18.' },
  gpt55: { releaseDate:'2026-04-23', observationDate:'2026-06-02', source:sources.openai },
  gpt550505: { releaseDate:'2026-05-05', source:sources.openai }, gpt550529: { releaseDate:'2026-05-28', observationDate:'2026-05-29', source:sources.openai },
  gpt550624: { releaseDate:'2026-06-24', source:sources.openai },
  gpt56sol: { releaseDate:'2026-07-09', source:sources.openai, note:'General public release; limited preview began June 26.' },
  gemini25: { releaseDate:'2025-06-17', source:sources.google }, gemini30pro: { releaseDate:'2025-11-18', source:sources.google }, gemini30flash: { releaseDate:'2025-12-17', source:sources.google },
  gemini31pro: { releaseDate:'2026-02-19', observationDate:'2026-02-20', source:sources.google }, gemini31flashpreview: { releaseDate:'2026-03-03', source:sources.google }, gemini31flashga: { releaseDate:'2026-05-07', observationDate:'2026-05-09', source:sources.google },
  gemini35flash: { releaseDate:'2026-05-19', observationDate:'2026-05-22', source:sources.google }, gemini36flash: { releaseDate:'2026-07-21', source:sources.google },
  museSpark: { releaseDate:'2026-04-08', observationDate:'2026-05-27', source:sources.meta }, museSpark11: { releaseDate:'2026-07-09', observationDate:'2026-07-15', source:sources.meta },
  grok420: { releaseDate:'2026-03-10', observationDate:'2026-02-18', source:sources.xai, note:'Canonical base-model public release; Expert is a product configuration.' },
  grok43: { releaseDate:'2026-05-15', observationDate:'2026-05-09', source:sources.xai, note:'Earliest clearly documented first-party availability for Grok 4.3.' },
  grok45: { releaseDate:'2026-07-08', observationDate:'2026-07-22', source:sources.xai, note:'Earliest verified API availability; product announcement followed July 16.' },
} satisfies Record<string, ModelMetadata>;

const aliases: Record<string, keyof typeof canonical> = {
  'Claude 3 Opus':'claude3opus','Claude 4.5 Sonnet (adaptive thinking)':'claude45sonnet','Claude 4.5 Haiku (adaptive thinking)':'claude45haiku',
  'Claude 4.6 Sonnet (max thinking)':'claude46sonnet','Claude 4.6 Sonnet (adaptive thinking)':'claude46sonnet','Claude 4.8 Opus (high)':'claude48opus','Claude 5 Fable (high)':'claude5fable','Claude 5 Opus (high)':'claude5opus',
  'GPT-5.4':'gpt54','GPT-5.4 Thinking Mini':'gpt54mini','GPT-5.5':'gpt55','GPT-5.5 Instant (0505)':'gpt550505','GPT-5.5 Instant (0529)':'gpt550529','GPT-5.5 Instant (0624)':'gpt550624','GPT-5.6 Sol (high) - JULY':'gpt56sol','GPT-5.6 Sol (high) - AUGUST':'gpt56sol',
  'Gemini 2.5 Pro':'gemini25','Gemini 2.5 Flash':'gemini25','Gemini 3.0 Pro Preview':'gemini30pro','Gemini 3.0 Flash Preview':'gemini30flash','Gemini 3.0 Flash Preview (with code execution)':'gemini30flash','Gemini 3.1 Pro Preview':'gemini31pro','Gemini 3.1 Pro Preview (with code execution)':'gemini31pro','Gemini 3.1 Flashlite Preview':'gemini31flashpreview','Gemini 3.1 Flashlite GA':'gemini31flashga','Gemini 3.1 Flashlite GA (with code execution)':'gemini31flashga','Gemini 3.5 Flash':'gemini35flash','Gemini 3.5 Flash (with code execution)':'gemini35flash','Gemini 3.6 Flash':'gemini36flash','Gemini 3.6 Flash (with code execution)':'gemini36flash',
  'Muse Spark (thinking)':'museSpark','Muse Spark 1.1':'museSpark11','Grok 4.20 Expert':'grok420','Grok 4.3 Fast':'grok43','Grok 4.5 Fast':'grok45',
};

const observationByAlias: Record<string, string> = {
  'Gemini 3.0 Flash Preview':'2025-12-23',
  'Gemini 3.0 Flash Preview (with code execution)':'2026-02-06',
  'GPT-5.6 Sol (high) - JULY':'2026-07-12',
};
export function getModelMetadata(name: string): ModelMetadata | undefined {
  const key=aliases[name]; if(!key)return undefined; const metadata=canonical[key];
  return observationByAlias[name] ? {...metadata,observationDate:observationByAlias[name]} : metadata;
}
export function getModelReleaseDate(name: string): string | undefined { return getModelMetadata(name)?.releaseDate }
export function validateModelMetadata(names: Iterable<string>): string[] {
  const errors:string[]=[]; for (const name of names) { const m=getModelMetadata(name); if(!m) errors.push(`${name}: missing metadata`); else if(!/^\d{4}-\d{2}-\d{2}$/.test(m.releaseDate)||Number.isNaN(Date.parse(`${m.releaseDate}T00:00:00Z`))) errors.push(`${name}: invalid release date`); }
  return errors;
}
export const modelMetadataSources = sources;
