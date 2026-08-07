import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlsdxbjoghpfzltubshs.supabase.co',
  'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD'
);

const STOPWORDS = new Set([
  'i', "i'm", 'im', 'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and',
  'or', 'is', 'are', 'am', 'be', 'me', 'my', 'we', 'us', 'you', 'your', 'need',
  'needs', 'want', 'wants', 'looking', 'look', 'find', 'get', 'with', 'who', 'can',
  'help', 'someone', 'some', 'any', 'please', 'would', 'like', 'near', 'around',
  'from', 'this', 'that', 'have', 'has', 'about',
]);

const SYNONYM_GROUPS = [
  ['tech', 'technology', 'software', 'developer', 'engineer', 'programming', 'code', 'coding', 'data', 'computer', 'it', 'web', 'frontend', 'backend', 'fullstack'],
  ['mentor', 'coach', 'mentorship', 'guide', 'advisor', 'consultant', 'teacher', 'instructor', 'trainer', 'guru'],
  ['design', 'designer', 'creative', 'artist', 'styling'],
  ['ui', 'ux', 'user interface', 'user experience', 'figma'],
  ['graphic', 'graphics', 'illustration', 'illustrator', 'photoshop', 'vector', 'logo'],
  ['product', 'product design', 'interaction design', 'product designer'],
  ['startup', 'entrepreneur', 'business', 'founder', 'co-founder', 'funding', 'seed', 'angel', 'venture'],
  ['career', 'resume', 'interview', 'hr', 'job', 'hiring', 'recruiting']
];

const SYNONYM_MAP = {};
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYM_MAP[word] = group.filter(w => w !== word);
  }
}

const normalize = (value) => String(value || '').trim().toLowerCase();

const normalizeTerms = (rawQuery) => {
  const query = normalize(rawQuery);
  if (!query) return { query: '', terms: [] };

  const terms = query
    .split(/[\s,]+/)
    .map(term => term.trim().replace(/[^a-z0-9'+#.]/g, ''))
    .filter(term => term.length >= 2 && !STOPWORDS.has(term));

  return { query, terms };
};

const matchTerm = (text, term) => {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  if (!normalizedText || !normalizedTerm) return false;

  let index = normalizedText.indexOf(normalizedTerm);
  while (index !== -1) {
    const charBefore = index > 0 ? normalizedText[index - 1] : ' ';
    const charAfter = index + normalizedTerm.length < normalizedText.length ? normalizedText[index + normalizedTerm.length] : ' ';

    const isBoundary = (char) => /[\s,.\-()&/|\\_]/.test(char);
    if (isBoundary(charBefore) && isBoundary(charAfter)) {
      return true;
    }
    index = normalizedText.indexOf(normalizedTerm, index + 1);
  }
  return false;
};

const matchToken = (fieldValue, token) => {
  const normalizedField = normalize(fieldValue);
  const normalizedToken = normalize(token);
  if (!normalizedField || !normalizedToken) return { exact: false, prefix: false };

  const words = normalizedField.split(/[\s,.\-()&/|\\_]+/);
  let exact = false;
  let prefix = false;

  for (const word of words) {
    if (word === normalizedToken) {
      exact = true;
    } else if (word.startsWith(normalizedToken)) {
      prefix = true;
    }
  }

  return { exact, prefix };
};

const getCategoryNames = (expert) =>
  (expert.speaker_categories || [])
    .map(row => row.categories?.name)
    .filter(Boolean);

const getExpertise = (expert) =>
  expert.expertise?.length ? expert.expertise : expert.expertise_areas || [];

const scoreExpert = (expert, query, terms) => {
  if (!query && terms.length === 0) return { score: 0, matches: [] };

  let score = 0;
  const matches = [];
  const name = normalize(expert.full_name || expert.name);
  const title = normalize(expert.title);
  const bio = normalize(expert.bio);
  const location = normalize(expert.location);
  const company = normalize(expert.company);
  const expertiseArr = getExpertise(expert).map(normalize);
  const topicsArr = (expert.topics || []).map(normalize);
  const languagesArr = (expert.languages || []).map(normalize);
  const categoryNames = getCategoryNames(expert).map(normalize);

  // 1. Phrase / Full Query matches (Weighted highest)
  if (matchTerm(title, query)) { score += 60; matches.push(`full query match in title (+60)`); }
  if (expertiseArr.some(e => matchTerm(e, query))) { score += 50; matches.push(`full query match in expertise (+50)`); }
  if (categoryNames.some(c => matchTerm(c, query))) { score += 40; matches.push(`full query match in category (+40)`); }
  if (matchTerm(name, query)) { score += 30; matches.push(`full query match in name (+30)`); }
  if (matchTerm(bio, query)) { score += 15; matches.push(`full query match in bio (+15)`); }

  let matchedTermsCount = 0;

  for (const term of terms) {
    let termMatched = false;
    let termScore = 0;
    const termMatches = [];

    // Fields list with priority weights
    const fields = [
      { name: 'title', value: title, exactW: 30, prefW: 15 },
      { name: 'expertise', values: expertiseArr, exactW: 30, prefW: 15 },
      { name: 'category', values: categoryNames, exactW: 20, prefW: 10 },
      { name: 'name', value: name, exactW: 15, prefW: 8 },
      { name: 'topic', values: topicsArr, exactW: 10, prefW: 5 },
      { name: 'bio', value: bio, exactW: 10, prefW: 5 },
      { name: 'company', value: company, exactW: 8, prefW: 4 },
      { name: 'location', value: location, exactW: 8, prefW: 4 },
      { name: 'language', values: languagesArr, exactW: 8, prefW: 4 }
    ];

    for (const field of fields) {
      if (field.values) {
        for (const val of field.values) {
          const { exact, prefix } = matchToken(val, term);
          if (exact) {
            termScore += field.exactW;
            termMatches.push(`exact match in ${field.name}("${val}") (+${field.exactW})`);
            termMatched = true;
          } else if (prefix) {
            termScore += field.prefW;
            termMatches.push(`prefix match in ${field.name} ("${val}") (+${field.prefW})`);
            termMatched = true;
          }
        }
      } else if (field.value) {
        const { exact, prefix } = matchToken(field.value, term);
        if (exact) {
          termScore += field.exactW;
          termMatches.push(`exact match in ${field.name}("${field.value}") (+${field.exactW})`);
          termMatched = true;
        } else if (prefix) {
          termScore += field.prefW;
          termMatches.push(`prefix match in ${field.name} ("${field.value}") (+${field.prefW})`);
          termMatched = true;
        }
      }
    }

    // Synonym match (only if no direct match was found in the fields)
    if (!termMatched) {
      const syns = SYNONYM_MAP[term];
      if (syns) {
        for (const syn of syns) {
          for (const field of fields) {
            if (field.values) {
              for (const val of field.values) {
                const { exact } = matchToken(val, syn);
                if (exact) {
                  const synW = Math.round(field.exactW * 0.4); // Synonyms weighted lower
                  termScore += synW;
                  termMatches.push(`synonym "${syn}" of "${term}" matched in ${field.name}("${val}") (+${synW})`);
                  termMatched = true;
                }
              }
            } else if (field.value) {
              const { exact } = matchToken(field.value, syn);
              if (exact) {
                const synW = Math.round(field.exactW * 0.4);
                termScore += synW;
                termMatches.push(`synonym "${syn}" of "${term}" matched in ${field.name}("${field.value}") (+${synW})`);
                termMatched = true;
              }
            }
          }
        }
      }
    }

    if (termMatched) {
      matchedTermsCount++;
      score += termScore;
      matches.push(...termMatches);
    }
  }

  // Coverage scaling
  if (terms.length > 0) {
    const coverage = matchedTermsCount / terms.length;
    score = score * (coverage * coverage);
    matches.push(`coverage: ${coverage} (matched ${matchedTermsCount}/${terms.length})`);
    if (terms.length >= 2 && coverage < 0.5) {
      score = 0;
      matches.push('score reset to 0 due to low coverage (< 50%)');
    }
  }

  return { score, matches };
};

const run = async () => {
  const { data: allExperts, error } = await supabase
    .from('speakers')
    .select(`
      *,
      speaker_categories (
        category_id,
        categories ( id, name )
      )
    `)
    .or('verification_status.eq.verified,is_verified.eq.true,verification_status.is.null');

  if (error) {
    console.error("Error:", error);
    return;
  }

  const queries = [
    "Graphic Designer",
    "UI Designer",
    "AI Engineer",
    "Marketing",
    "Career Coach",
    "Product Manager"
  ];

  const MIN_RELEVANCE_THRESHOLD = 15;

  for (const queryStr of queries) {
    const { query, terms } = normalizeTerms(queryStr);
    console.log(`\n======================================================`);
    console.log(`Searching for "${queryStr}" -> terms: [${terms.join(', ')}]`);
    console.log(`======================================================`);

    for (const expert of allExperts) {
      const { score, matches } = scoreExpert(expert, query, terms);
      if (score >= MIN_RELEVANCE_THRESHOLD) {
        console.log(`- Expert: ${expert.name} (${expert.title}) [Score: ${score}]`);
        console.log(`  Matches:`, matches);
      }
    }
  }
};

run();
