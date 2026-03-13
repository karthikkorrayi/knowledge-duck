const cache = new Map<string, string>();

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function hasSignificantTelugu(text: string): boolean {
  const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) ?? []).length;
  return teluguChars > 2;
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  if (!hasSignificantTelugu(text)) return text;

  const trimmed = text.trim();
  if (cache.has(trimmed)) return cache.get(trimmed)!;

  try {
    const { translate } = require('google-translate-api-x');
    const result = await translate(trimmed, { to: 'en' });
    const translated: string = result?.text ?? trimmed;
    cache.set(trimmed, translated);
    await sleep(100); // gentle rate limit
    return translated;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Cannot find module')) {
      // Package not installed — only warn once
      if (!cache.has('__warned__')) {
        console.warn('[translator] google-translate-api-x not installed. Run: npm install google-translate-api-x');
        cache.set('__warned__', '1');
      }
    }
    return trimmed; // Return original text, don't crash
  }
}

export async function translateBatch(texts: string[], delayMs = 150): Promise<string[]> {
  const out: string[] = [];
  for (const t of texts) {
    out.push(await translateToEnglish(t));
    if (delayMs > 0) await sleep(delayMs);
  }
  return out;
}

const TELUGU_MAP: Record<string, string> = {
  // Post / vacancy
  'పోస్టు పేరు':           'post name',
  'పోస్ట్ పేరు':           'post name',
  'పేరు':                   'name',
  'ఖాళీలు':                'vacancies',
  'మొత్తం ఖాళీలు':        'total vacancies',
  'మొత్తం పోస్టులు':      'total posts',
  'పోస్టుల సంఖ్య':        'number of posts',
  // Salary
  'వేతనం':                 'salary',
  'జీతం':                  'salary',
  'నెలవారీ వేతనం':         'monthly salary',
  'స్టైపెండ్':             'stipend',
  'పే స్కేల్':             'pay scale',
  'వేతన శ్రేణి':           'pay scale',
  'వేతన బ్యాండ్':          'pay band',
  // Qualification
  'అర్హత':                 'qualification',
  'విద్యార్హత':            'qualification',
  'విద్య అర్హత':           'educational qualification',
  'కనీస అర్హత':            'minimum qualification',
  // Age
  'వయసు':                  'age limit',
  'వయో పరిమితి':           'age limit',
  'గరిష్ట వయసు':           'maximum age',
  'కనీస వయసు':             'minimum age',
  // Dates
  'చివరి తేదీ':            'last date',
  'దరఖాస్తు చివరి తేది':  'last date to apply',
  'దరఖాస్తు మొదలయ్యే తేదీ': 'start date',
  'ప్రారంభ తేదీ':          'start date',
  'నోటిఫికేషన్ తేదీ':     'notification date',
  'పరీక్ష తేదీ':           'exam date',
  'ఫలితాల తేదీ':           'result date',
  // Fee
  'ఫీజు':                  'application fee',
  'దరఖాస్తు రుసుం':        'application fee',
  'పరీక్ష ఫీజు':           'exam fee',
  'రిజిస్ట్రేషన్ ఫీజు':   'registration fee',
  // Selection
  'ఎంపిక ప్రక్రియ':       'selection process',
  'ఎంపిక విధానం':          'selection procedure',
  // Location
  'స్థానం':                'job location',
  'పని స్థలం':             'job location',
  'ఉద్యోగ స్థలం':          'job location',
  // Org
  'సంస్థ':                 'organization',
  'విభాగం':                'department',
  'అధికారిక వెబ్‌సైట్':   'official website',
  'అధికారిక సైట్':         'official website',
  // Misc
  'దరఖాస్తు విధానం':       'application process',
  'ఎలా దరఖాస్తు చేయాలి':  'how to apply',
  'ముఖ్యమైన తేదీలు':      'important dates',
  'ముఖ్యమైన లింకులు':     'important links',
};

// Try hardcoded map first — avoids any API call for known terms
export function quickTranslate(text: string): string {
  const t = text.trim();
  return TELUGU_MAP[t] ?? t;
}