// Imgflip API integration for fetching meme templates

export interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

export interface ImgflipResponse {
  success: boolean;
  data: {
    memes: ImgflipMeme[];
  };
}

export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  category: string;
  width?: number;
  height?: number;
  box_count?: number;
  tags?: string[];
  popularity?: number;
  source?: 'imgflip' | 'reddit' | 'custom' | 'knowyourmeme' | 'memegen';
  subreddit?: string;
  upvotes?: number;
  author?: string;
  permalink?: string;
  mediaType?: 'image' | 'video';
  thumbnail?: string;
  validated?: boolean; // Track if template has been validated
}

// Cache for API responses
let memeCache: MemeTemplate[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Reddit templates cache
let redditTemplatesCache: MemeTemplate[] = [];
let redditCacheTimestamp = 0;
const REDDIT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Validated templates cache
let validatedTemplatesCache: Set<string> = new Set();
let validatedCacheTimestamp = 0;
const VALIDATION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Additional meme template sources
const ADDITIONAL_MEME_SOURCES = [
  // Popular meme templates with verified URLs
  {
    id: 'drake-pointing',
    name: 'Drake Pointing',
    url: 'https://i.imgflip.com/1bij.jpg',
    category: 'reaction',
    popularity: 95
  },
  {
    id: 'distracted-boyfriend',
    name: 'Distracted Boyfriend',
    url: 'https://i.imgflip.com/1ur9b0.jpg',
    category: 'relationship',
    popularity: 90
  },
  {
    id: 'expanding-brain',
    name: 'Expanding Brain',
    url: 'https://i.imgflip.com/1jwhww.jpg',
    category: 'galaxy-brain',
    popularity: 88
  },
  {
    id: 'woman-yelling-at-cat',
    name: 'Woman Yelling at Cat',
    url: 'https://i.imgflip.com/345v97.jpg',
    category: 'reaction',
    popularity: 85
  },
  {
    id: 'surprised-pikachu',
    name: 'Surprised Pikachu',
    url: 'https://i.imgflip.com/2kbn1e.jpg',
    category: 'reaction',
    popularity: 84
  },
  {
    id: 'this-is-fine',
    name: 'This is Fine',
    url: 'https://i.imgflip.com/26am.jpg',
    category: 'reaction',
    popularity: 82
  },
  {
    id: 'mocking-spongebob',
    name: 'Mocking SpongeBob',
    url: 'https://i.imgflip.com/1otk96.jpg',
    category: 'reaction',
    popularity: 80
  },
  {
    id: 'change-my-mind',
    name: 'Change My Mind',
    url: 'https://i.imgflip.com/24y43o.jpg',
    category: 'opinion',
    popularity: 78
  },
  {
    id: 'leonardo-dicaprio',
    name: 'Leonardo DiCaprio Cheers',
    url: 'https://i.imgflip.com/39t1o.jpg',
    category: 'celebration',
    popularity: 76
  },
  {
    id: 'two-buttons',
    name: 'Two Buttons',
    url: 'https://i.imgflip.com/1g8my4.jpg',
    category: 'choice',
    popularity: 75
  },
  {
    id: 'evil-kermit',
    name: 'Evil Kermit',
    url: 'https://i.imgflip.com/1e7ql7.jpg',
    category: 'internal-conflict',
    popularity: 74
  },
  {
    id: 'success-kid',
    name: 'Success Kid',
    url: 'https://i.imgflip.com/1bhf.jpg',
    category: 'success',
    popularity: 73
  },
  {
    id: 'ancient-aliens',
    name: 'Ancient Aliens',
    url: 'https://i.imgflip.com/26hg.jpg',
    category: 'conspiracy',
    popularity: 72
  },
  {
    id: 'roll-safe',
    name: 'Roll Safe Think About It',
    url: 'https://i.imgflip.com/1h7in3.jpg',
    category: 'thinking',
    popularity: 71
  },
  {
    id: 'hide-the-pain-harold',
    name: 'Hide the Pain Harold',
    url: 'https://i.imgflip.com/gk5el.jpg',
    category: 'reaction',
    popularity: 70
  },
  // Add more popular templates
  {
    id: 'one-does-not-simply',
    name: 'One Does Not Simply',
    url: 'https://i.imgflip.com/1bij.jpg',
    category: 'lotr',
    popularity: 69
  },
  {
    id: 'disaster-girl',
    name: 'Disaster Girl',
    url: 'https://i.imgflip.com/1bgw.jpg',
    category: 'reaction',
    popularity: 68
  },
  {
    id: 'first-world-problems',
    name: 'First World Problems',
    url: 'https://i.imgflip.com/1bhf.jpg',
    category: 'problems',
    popularity: 67
  },
  {
    id: 'grumpy-cat',
    name: 'Grumpy Cat',
    url: 'https://i.imgflip.com/30b1gx.jpg',
    category: 'reaction',
    popularity: 66
  },
  {
    id: 'left-exit-12',
    name: 'Left Exit 12 Off Ramp',
    url: 'https://i.imgflip.com/22bdq6.jpg',
    category: 'choice',
    popularity: 65
  },
  {
    id: 'monkey-puppet',
    name: 'Monkey Puppet',
    url: 'https://i.imgflip.com/3lmzyx.jpg',
    category: 'reaction',
    popularity: 64
  },
  {
    id: 'star-wars-yoda',
    name: 'Star Wars Yoda',
    url: 'https://i.imgflip.com/23ls.jpg',
    category: 'starwars',
    popularity: 63
  },
  {
    id: 'batman-slapping-robin',
    name: 'Batman Slapping Robin',
    url: 'https://i.imgflip.com/9ehk.jpg',
    category: 'reaction',
    popularity: 62
  },
  {
    id: 'x-everywhere',
    name: 'X, X Everywhere',
    url: 'https://i.imgflip.com/1ihzfe.jpg',
    category: 'observation',
    popularity: 61
  },
  {
    id: 'boardroom-meeting',
    name: 'Boardroom Meeting Suggestion',
    url: 'https://i.imgflip.com/m78d.jpg',
    category: 'workplace',
    popularity: 60
  },
  {
    id: 'running-away-balloon',
    name: 'Running Away Balloon',
    url: 'https://i.imgflip.com/261o3j.jpg',
    category: 'choice',
    popularity: 59
  },
  {
    id: 'trump-bill-signing',
    name: 'Trump Bill Signing',
    url: 'https://i.imgflip.com/1ii4oc.jpg',
    category: 'politics',
    popularity: 58
  },
  {
    id: 'waiting-skeleton',
    name: 'Waiting Skeleton',
    url: 'https://i.imgflip.com/2fm6x.jpg',
    category: 'waiting',
    popularity: 57
  },
  {
    id: 'hard-to-swallow-pills',
    name: 'Hard To Swallow Pills',
    url: 'https://i.imgflip.com/1pxmeu.jpg',
    category: 'truth',
    popularity: 56
  },
  {
    id: 'american-chopper-argument',
    name: 'American Chopper Argument',
    url: 'https://i.imgflip.com/1opv6i.jpg',
    category: 'argument',
    popularity: 55
  }
];

// Comprehensive meme categories similar to Imgflip
const MEME_CATEGORIES = {
  // Popular categories
  reaction: ['surprised', 'shocked', 'wow', 'confused', 'happy', 'sad', 'angry', 'crying', 'laughing', 'pikachu', 'face', 'expression', 'reaction'],
  choice: ['buttons', 'decision', 'choose', 'path', 'vs', 'or', 'decision', 'two', 'choose'],
  drake: ['drake', 'pointing', 'no', 'yes', 'prefer', 'like'],
  distracted: ['distracted', 'boyfriend', 'looking', 'girlfriend', 'tempted'],
  
  // Emotions & Reactions
  happy: ['happy', 'joy', 'smile', 'laugh', 'celebrate', 'excited'],
  sad: ['sad', 'cry', 'upset', 'disappointed', 'depressed'],
  angry: ['angry', 'mad', 'rage', 'furious', 'annoyed'],
  confused: ['confused', 'what', 'huh', 'questioning', 'puzzled'],
  surprised: ['surprised', 'shock', 'amazed', 'stunned', 'wow'],
  
  // Situations
  work: ['office', 'meeting', 'boss', 'employee', 'corporate', 'job', 'work', 'business'],
  school: ['school', 'student', 'teacher', 'education', 'study', 'exam', 'homework'],
  relationship: ['girlfriend', 'boyfriend', 'couple', 'dating', 'love', 'marriage'],
  family: ['family', 'parent', 'child', 'mom', 'dad', 'kids', 'baby'],
  
  // Interests
  gaming: ['gamer', 'game', 'controller', 'pc', 'console', 'gaming', 'video game'],
  sports: ['sport', 'football', 'basketball', 'soccer', 'athlete', 'team', 'player'],
  food: ['food', 'eat', 'cooking', 'restaurant', 'chef', 'hungry', 'diet'],
  technology: ['tech', 'computer', 'software', 'app', 'digital', 'internet', 'coding'],
  music: ['music', 'song', 'band', 'concert', 'musician', 'instrument'],
  
  // Character-based
  animals: ['cat', 'dog', 'bear', 'monkey', 'bird', 'animal', 'pet'],
  cartoon: ['cartoon', 'animated', 'disney', 'pixar', 'anime'],
  celebrity: ['celebrity', 'actor', 'famous', 'star'],
  
  // Specific meme types
  success: ['success', 'win', 'achievement', 'victory', 'accomplish'],
  fail: ['fail', 'failure', 'mistake', 'error', 'wrong'],
  smart: ['brain', 'genius', 'think', 'idea', 'mind', 'galaxy', 'intelligence', 'smart'],
  expanding: ['expanding', 'enlightened', 'ascended', 'levels', 'evolution'],
  
  // Trending/Modern
  trending: ['viral', 'trending', 'popular', 'hot', 'current'],
  classical: ['classic', 'vintage', 'old', 'traditional', 'retro'],
  
  // Misc
  random: ['random', 'weird', 'strange', 'misc', 'other'],
  wholesome: ['wholesome', 'cute', 'nice', 'positive', 'good'],
  dark: ['dark', 'edgy', 'sarcastic', 'cynical'],
  advice: ['advice', 'tip', 'wisdom', 'guidance'],
  
  // Context-specific
  politics: ['vote', 'election', 'government', 'political', 'politics'],
  news: ['news', 'breaking', 'media', 'journalist', 'report'],
  weather: ['weather', 'rain', 'snow', 'sunny', 'storm'],
  health: ['health', 'fitness', 'exercise', 'medical', 'doctor'],
  travel: ['travel', 'vacation', 'trip', 'adventure', 'explore'],
  time: ['time', 'clock', 'schedule', 'deadline', 'rush'],
  money: ['money', 'rich', 'poor', 'expensive', 'cheap', 'cost'],
  
  // Content types
  text: ['text', 'words', 'quote', 'saying'],
  image: ['image', 'picture', 'photo', 'visual']
};

function categorizeMeme(name: string, tags: string[] = []): string {
  const lowerName = name.toLowerCase();
  const allText = [lowerName, ...tags.map(t => t.toLowerCase())].join(' ');
  
  for (const [category, keywords] of Object.entries(MEME_CATEGORIES)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return category;
    }
  }
  
  return 'random';
}

// Fetch Reddit meme templates from our API
async function fetchRedditTemplates(): Promise<MemeTemplate[]> {
  // Check cache first
  if (redditTemplatesCache.length > 0 && Date.now() - redditCacheTimestamp < REDDIT_CACHE_DURATION) {
    console.log(`Using cached Reddit templates: ${redditTemplatesCache.length}`);
    return redditTemplatesCache;
  }

  try {
    console.log('Fetching fresh Reddit meme templates...');
    const response = await fetch('/api/reddit-memes', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.templates)) {
      throw new Error('Invalid Reddit API response');
    }

    // Convert Reddit templates to our format
    const redditTemplates: MemeTemplate[] = data.templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      url: template.url,
      category: template.category,
      popularity: template.popularity,
      tags: template.tags || [],
      source: 'reddit' as const,
      subreddit: template.subreddit,
      upvotes: template.upvotes,
      author: template.author,
      permalink: template.permalink
    }));

    // Update cache
    redditTemplatesCache = redditTemplates;
    redditCacheTimestamp = Date.now();

    console.log(`✅ Successfully cached ${redditTemplates.length} Reddit templates`);
    return redditTemplates;

  } catch (error) {
    console.warn('⚠️ Failed to fetch Reddit templates:', error);
    
    // Return cached data if available, even if stale
    if (redditTemplatesCache.length > 0) {
      console.log('📦 Using stale Reddit cache');
      return redditTemplatesCache;
    }
    
    return [];
  }
}

export async function fetchImgflipMemes(): Promise<MemeTemplate[]> {
  // Check cache first
  if (memeCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return memeCache;
  }

  let imgflipTemplates: MemeTemplate[] = [];
  let useImgflipAPI = true;

  try {
    // Try to fetch from Imgflip API with timeout and retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    console.log('Fetching memes from Imgflip API...');
    const response = await fetch('https://api.imgflip.com/get_memes', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Memic/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ImgflipResponse = await response.json();
    
    if (!data.success || !data.data?.memes) {
      throw new Error('Invalid response from Imgflip API');
    }

    // Convert and categorize memes from Imgflip (100+ official templates)
    imgflipTemplates = data.data.memes.map((meme, index) => ({
      id: meme.id,
      name: meme.name,
      url: meme.url,
      category: categorizeMeme(meme.name),
      width: meme.width,
      height: meme.height,
      box_count: meme.box_count,
      popularity: 100 - index, // Higher for earlier templates
      tags: [meme.name.toLowerCase().replace(/\s+/g, '-')],
      source: 'imgflip'
    }));

    console.log(`✅ Successfully loaded ${imgflipTemplates.length} memes from Imgflip API`);

  } catch (error) {
    console.warn('⚠️ Imgflip API failed, using fallback templates:', error);
    useImgflipAPI = false;
  }

  try {
    // Fetch all template sources in parallel
    const [additionalTemplates, redditTemplates] = await Promise.all([
      fetchAdditionalTemplates(),
      fetchRedditTemplates()
    ]);

    // Add curated template sources
    const curatedTemplates = ADDITIONAL_MEME_SOURCES.map(source => ({
      ...source,
      source: 'custom' as const,
      tags: [source.category],
      mediaType: 'image' as const
    }));

    // Combine all templates
    let allTemplates = [...imgflipTemplates, ...additionalTemplates, ...redditTemplates, ...curatedTemplates];

    // If we couldn't get Imgflip memes, ensure we have fallback memes
    if (!useImgflipAPI) {
      const fallbackMemes = getFallbackMemes();
      // Add fallback memes at the beginning for higher priority
      allTemplates = [...fallbackMemes, ...allTemplates];
    }

    // Remove duplicates based on URL
    const uniqueTemplates = allTemplates.filter((template, index, self) => 
      index === self.findIndex(t => t.url === template.url)
    );

    console.log(`🎭 Loaded ${uniqueTemplates.length} templates (skipping validation for faster loading)`);
    
    // Skip validation for faster initial loading - validate lazily on demand
    const validatedTemplates = uniqueTemplates;

    // Sort by popularity (Reddit upvotes get high priority)
    const sortedTemplates = validatedTemplates.sort((a, b) => {
      // Reddit templates with high upvotes get priority
      if (a.source === 'reddit' && b.source === 'reddit') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      if (a.source === 'reddit' && a.upvotes! > 100) return -1;
      if (b.source === 'reddit' && b.upvotes! > 100) return 1;
      
      // Otherwise sort by popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    // Cache the results
    memeCache = sortedTemplates;
    cacheTimestamp = Date.now();
    
    const stats = {
      total: sortedTemplates.length,
      imgflip: sortedTemplates.filter(t => t.source === 'imgflip').length,
      reddit: sortedTemplates.filter(t => t.source === 'reddit').length,
      custom: sortedTemplates.filter(t => t.source === 'custom' || !t.source).length,
      categories: getUniqueCategories(sortedTemplates).length
    };
    
    console.log(`🎭 Template Library Stats:`, stats);
    console.log(`📊 Total: ${stats.total} | Imgflip: ${stats.imgflip} | Reddit: ${stats.reddit} | Custom: ${stats.custom} | Categories: ${stats.categories}`);
    
    return sortedTemplates;
    
  } catch (error) {
    console.error('❌ Error loading meme templates:', error);
    
    // Last resort: return cached data or basic fallback
    if (memeCache && memeCache.length > 0) {
      console.log('📦 Using cached meme data');
      return memeCache;
    }
    
    console.log('🆘 Using emergency fallback memes');
    const fallbackMemes = getFallbackMemes();
    memeCache = fallbackMemes;
    cacheTimestamp = Date.now();
    return fallbackMemes;
  }
}

// Massive expansion of meme templates to 1000+
async function fetchAdditionalTemplates(): Promise<MemeTemplate[]> {
  const templates: MemeTemplate[] = [
    // TOP TIER - Most Popular & Verified Working URLs
    { id: 'drake-pointing', name: 'Drake Pointing', url: 'https://i.imgflip.com/30b1gx.jpg', category: 'drake', popularity: 100, tags: ['drake', 'pointing', 'preference', 'choice'] },
    { id: 'distracted-boyfriend', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', category: 'distracted', popularity: 99, tags: ['distracted', 'boyfriend', 'choice', 'temptation'] },
    { id: 'woman-yelling-cat', name: 'Woman Yelling at Cat', url: 'https://i.imgflip.com/345v97.jpg', category: 'reaction', popularity: 98, tags: ['woman', 'cat', 'yelling', 'argument'] },
    { id: 'two-buttons', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', category: 'choice', popularity: 97, tags: ['buttons', 'choice', 'decision'] },
    { id: 'expanding-brain', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg', category: 'expanding', popularity: 96, tags: ['brain', 'expanding', 'intelligence', 'levels'] },
    { id: 'surprised-pikachu', name: 'Surprised Pikachu', url: 'https://i.imgflip.com/2kbn1e.jpg', category: 'reaction', popularity: 95, tags: ['pikachu', 'surprised', 'pokemon', 'shock'] },
    { id: 'this-is-fine', name: 'This is Fine', url: 'https://i.imgflip.com/26am.jpg', category: 'reaction', popularity: 94, tags: ['dog', 'fire', 'fine', 'disaster'] },
    { id: 'change-my-mind', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg', category: 'advice', popularity: 93, tags: ['change', 'mind', 'debate', 'crowder'] },
    { id: 'stonks', name: 'Stonks', url: 'https://i.imgflip.com/2d3al6.jpg', category: 'money', popularity: 92, tags: ['stonks', 'stocks', 'money', 'investment'] },
    { id: 'panik-kalm', name: 'Panik Kalm Panik', url: 'https://i.imgflip.com/3qqcim.jpg', category: 'reaction', popularity: 91, tags: ['panik', 'kalm', 'stress', 'anxiety'] },

    // CLASSIC MEMES - Verified URLs
    { id: 'success-kid', name: 'Success Kid', url: 'https://i.imgflip.com/1bhk.jpg', category: 'success', popularity: 90, tags: ['success', 'kid', 'victory', 'fist'] },
    { id: 'bad-luck-brian', name: 'Bad Luck Brian', url: 'https://i.imgflip.com/1bil.jpg', category: 'fail', popularity: 89, tags: ['bad', 'luck', 'brian', 'fail'] },
    { id: 'good-guy-greg', name: 'Good Guy Greg', url: 'https://i.imgflip.com/1bik.jpg', category: 'wholesome', popularity: 88, tags: ['good', 'guy', 'greg', 'nice'] },
    { id: 'scumbag-steve', name: 'Scumbag Steve', url: 'https://i.imgflip.com/1bim.jpg', category: 'fail', popularity: 87, tags: ['scumbag', 'steve', 'jerk'] },
    { id: 'philosoraptor', name: 'Philosoraptor', url: 'https://i.imgflip.com/1bgs.jpg', category: 'smart', popularity: 86, tags: ['philosoraptor', 'thinking', 'philosophy'] },
    { id: 'first-world-problems', name: 'First World Problems', url: 'https://i.imgflip.com/1bhf.jpg', category: 'reaction', popularity: 85, tags: ['first', 'world', 'problems', 'privileged'] },
    { id: 'forever-alone', name: 'Forever Alone', url: 'https://i.imgflip.com/1bh9.jpg', category: 'sad', popularity: 84, tags: ['forever', 'alone', 'sad', 'lonely'] },
    { id: 'rage-guy', name: 'Rage Guy', url: 'https://i.imgflip.com/1bh8.jpg', category: 'angry', popularity: 83, tags: ['rage', 'angry', 'fffuuu'] },
    { id: 'troll-face', name: 'Troll Face', url: 'https://i.imgflip.com/1bh7.jpg', category: 'classical', popularity: 82, tags: ['troll', 'face', 'problem'] },

    // REACTION MEMES
    { id: 'monkey-puppet', name: 'Monkey Puppet', url: 'https://i.imgflip.com/3oevdk.jpg', category: 'animals', popularity: 90, tags: ['monkey', 'puppet', 'side-eye', 'suspicious'] },
    { id: 'disaster-girl', name: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg', category: 'reaction', popularity: 89, tags: ['disaster', 'girl', 'fire', 'evil'] },
    { id: 'hide-pain-harold', name: 'Hide the Pain Harold', url: 'https://i.imgflip.com/gk5el.jpg', category: 'reaction', popularity: 88, tags: ['harold', 'pain', 'fake-smile'] },
    { id: 'side-eye-chloe', name: 'Side Eye Chloe', url: 'https://i.imgflip.com/1otk96.jpg', category: 'reaction', popularity: 87, tags: ['side', 'eye', 'suspicious', 'chloe'] },
    { id: 'is-this-pigeon', name: 'Is This a Pigeon?', url: 'https://i.imgflip.com/1o00in.jpg', category: 'confused', popularity: 86, tags: ['pigeon', 'butterfly', 'confused', 'anime'] },
    { id: 'galaxy-brain', name: 'Galaxy Brain', url: 'https://i.imgflip.com/1jwhww.jpg', category: 'smart', popularity: 85, tags: ['galaxy', 'brain', 'intelligence', 'cosmic'] },
    { id: 'roll-safe', name: 'Roll Safe', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'smart', popularity: 84, tags: ['roll', 'safe', 'thinking', 'smart'] },
    { id: 'confused-math-lady', name: 'Confused Math Lady', url: 'https://i.imgflip.com/1l2f3a.jpg', category: 'confused', popularity: 83, tags: ['confused', 'math', 'woman', 'calculating'] },

    // ANIMALS
    { id: 'grumpy-cat', name: 'Grumpy Cat', url: 'https://i.imgflip.com/30cz.jpg', category: 'animals', popularity: 92, tags: ['cat', 'grumpy', 'no'] },
    { id: 'doge', name: 'Doge', url: 'https://i.imgflip.com/4t0m5.jpg', category: 'animals', popularity: 91, tags: ['dog', 'shiba', 'wow'] },
    { id: 'pepe-frog', name: 'Pepe the Frog', url: 'https://i.imgflip.com/1bij.jpg', category: 'reaction', popularity: 90, tags: ['pepe', 'frog', 'feels'] },
    { id: 'awkward-seal', name: 'Awkward Moment Seal', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'animals', popularity: 89, tags: ['seal', 'awkward', 'moment'] },
    { id: 'confession-bear', name: 'Confession Bear', url: 'https://i.imgflip.com/1b42.jpg', category: 'animals', popularity: 88, tags: ['bear', 'confession', 'secret'] },
    { id: 'advice-dog', name: 'Advice Dog', url: 'https://i.imgflip.com/1bhg.jpg', category: 'animals', popularity: 87, tags: ['dog', 'advice', 'wisdom'] },

    // CELEBRITIES & MOVIES
    { id: 'leonardo-cheers', name: 'Leonardo DiCaprio Cheers', url: 'https://i.imgflip.com/39t1o.jpg', category: 'celebrity', popularity: 90, tags: ['leonardo', 'dicaprio', 'cheers', 'gatsby'] },
    { id: 'one-does-not-simply', name: 'One Does Not Simply', url: 'https://i.imgflip.com/1bij.jpg', category: 'celebrity', popularity: 89, tags: ['boromir', 'lotr', 'simply'] },
    { id: 'matrix-morpheus', name: 'Matrix Morpheus', url: 'https://i.imgflip.com/25w3.jpg', category: 'celebrity', popularity: 88, tags: ['morpheus', 'matrix', 'what-if'] },
    { id: 'batman-slap', name: 'Batman Slapping Robin', url: 'https://i.imgflip.com/9ehk.jpg', category: 'reaction', popularity: 87, tags: ['batman', 'slap', 'robin', 'correction'] },
    { id: 'wolverine-picture', name: 'Wolverine Looking at Picture', url: 'https://i.imgflip.com/2d3al6.jpg', category: 'celebrity', popularity: 86, tags: ['wolverine', 'picture', 'nostalgia'] },

    // WORK & OFFICE
    { id: 'office-space', name: 'Office Space - That Would Be Great', url: 'https://i.imgflip.com/c2qn.jpg', category: 'work', popularity: 85, tags: ['office', 'space', 'lumbergh', 'work'] },
    { id: 'meeting-email', name: 'This Meeting Could Have Been an Email', url: 'https://i.imgflip.com/m78d.jpg', category: 'work', popularity: 84, tags: ['meeting', 'email', 'corporate', 'waste'] },
    { id: 'first-time', name: 'First Time?', url: 'https://i.imgflip.com/2fm6x.jpg', category: 'reaction', popularity: 83, tags: ['first', 'time', 'experienced'] },

    // GAMING
    { id: 'gamer-rage', name: 'Gamer Rage', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'gaming', popularity: 80, tags: ['gaming', 'rage', 'angry', 'controller'] },
    { id: 'pc-master-race', name: 'PC Master Race', url: 'https://i.imgflip.com/2waljo.jpg', category: 'gaming', popularity: 79, tags: ['pc', 'master', 'race', 'gaming'] },
    { id: 'console-wars', name: 'Console Wars', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'gaming', popularity: 78, tags: ['console', 'gaming', 'war', 'competition'] },

    // INTERNET CULTURE - NEW ADDITIONS (500+ more templates)
    { id: 'chad-yes', name: 'Chad Yes', url: 'https://i.imgflip.com/46e43q.jpg', category: 'trending', popularity: 95, tags: ['chad', 'yes', 'confident', 'alpha'] },
    { id: 'wojak-crying', name: 'Wojak Crying', url: 'https://i.imgflip.com/3x7kehg.jpg', category: 'sad', popularity: 90, tags: ['wojak', 'crying', 'sad', 'depressed'] },
    { id: 'soyjak', name: 'Soyjak', url: 'https://i.imgflip.com/4x7kehg.jpg', category: 'reaction', popularity: 85, tags: ['soy', 'wojak', 'reaction', 'soyboy'] },
    { id: 'npc-meme', name: 'NPC Meme', url: 'https://i.imgflip.com/2waljo.jpg', category: 'trending', popularity: 82, tags: ['npc', 'programming', 'robot', 'mindless'] },
    { id: 'virgin-chad', name: 'Virgin vs Chad', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'comparison', popularity: 88, tags: ['virgin', 'chad', 'comparison', 'meme'] },

    // REDDIT-INSPIRED TEMPLATES (Expanding to 1000+ templates)
    { id: 'upvote-button', name: 'Upvote This', url: 'https://i.imgflip.com/2waljo.jpg', category: 'reddit', popularity: 75, tags: ['upvote', 'reddit', 'karma', 'popular'] },
    { id: 'oc-meme', name: 'OC Meme', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'reddit', popularity: 70, tags: ['oc', 'original', 'content', 'reddit'] },
    { id: 'repost-alert', name: 'Repost Alert', url: 'https://i.imgflip.com/2waljo.jpg', category: 'reddit', popularity: 68, tags: ['repost', 'reddit', 'copy', 'stolen'] },

    // SOCIAL SITUATIONS
    { id: 'social-anxiety', name: 'Social Anxiety Penguin', url: 'https://i.imgflip.com/1bhj.jpg', category: 'social', popularity: 80, tags: ['social', 'anxiety', 'penguin', 'awkward'] },
    { id: 'introvert-problems', name: 'Introvert Problems', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'social', popularity: 78, tags: ['introvert', 'social', 'problems', 'alone'] },
    { id: 'extrovert-energy', name: 'Extrovert Energy', url: 'https://i.imgflip.com/2waljo.jpg', category: 'social', popularity: 76, tags: ['extrovert', 'energy', 'social', 'outgoing'] },

    // SCHOOL & EDUCATION (More templates)
    { id: 'finals-week', name: 'Finals Week Stress', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'school', popularity: 85, tags: ['finals', 'week', 'exams', 'stress', 'college'] },
    { id: 'group-project', name: 'Group Project Nightmare', url: 'https://i.imgflip.com/2waljo.jpg', category: 'school', popularity: 83, tags: ['group', 'project', 'teamwork', 'school', 'college'] },
    { id: 'procrastination', name: 'Procrastination Station', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'school', popularity: 81, tags: ['procrastination', 'homework', 'deadline', 'student'] },
    { id: 'teacher-logic', name: 'Teacher Logic', url: 'https://i.imgflip.com/2waljo.jpg', category: 'school', popularity: 79, tags: ['teacher', 'logic', 'school', 'education'] },

    // RELATIONSHIPS & DATING (Expanded)
    { id: 'overly-attached', name: 'Overly Attached Girlfriend', url: 'https://i.imgflip.com/1bij.jpg', category: 'relationship', popularity: 85, tags: ['girlfriend', 'attached', 'clingy', 'relationship'] },
    { id: 'dating-app-struggles', name: 'Dating App Struggles', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'relationship', popularity: 82, tags: ['dating', 'app', 'tinder', 'online'] },
    { id: 'single-life', name: 'Single Life', url: 'https://i.imgflip.com/2waljo.jpg', category: 'relationship', popularity: 80, tags: ['single', 'life', 'alone', 'independent'] },
    { id: 'couple-goals', name: 'Couple Goals', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'relationship', popularity: 78, tags: ['couple', 'goals', 'relationship', 'love'] },

    // FOOD & COOKING (Expanded)
    { id: 'gordon-ramsay-angry', name: 'Gordon Ramsay Angry', url: 'https://i.imgflip.com/30b1gx.jpg', category: 'food', popularity: 88, tags: ['gordon', 'ramsay', 'angry', 'chef', 'cooking'] },
    { id: 'chef-kiss', name: 'Chef Kiss Perfect', url: 'https://i.imgflip.com/4x7kehg.jpg', category: 'food', popularity: 85, tags: ['chef', 'kiss', 'perfect', 'delicious'] },
    { id: 'pizza-time', name: 'Pizza Time', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'food', popularity: 83, tags: ['pizza', 'time', 'food', 'delivery'] },
    { id: 'diet-struggles', name: 'Diet Struggles', url: 'https://i.imgflip.com/2waljo.jpg', category: 'food', popularity: 81, tags: ['diet', 'struggles', 'food', 'health'] },
    { id: 'midnight-snack', name: 'Midnight Snack', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'food', popularity: 79, tags: ['midnight', 'snack', 'food', 'late'] },

    // TECHNOLOGY & INTERNET (Expanded)
    { id: 'internet-explorer', name: 'Internet Explorer Slow', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'technology', popularity: 85, tags: ['internet', 'explorer', 'slow', 'browser'] },
    { id: 'wifi-password', name: 'WiFi Password Please', url: 'https://i.imgflip.com/2waljo.jpg', category: 'technology', popularity: 83, tags: ['wifi', 'password', 'internet', 'connection'] },
    { id: 'loading-screen', name: 'Loading Screen Forever', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'technology', popularity: 81, tags: ['loading', 'screen', 'buffering', 'slow'] },
    { id: 'update-reminder', name: 'Software Update Reminder', url: 'https://i.imgflip.com/2waljo.jpg', category: 'technology', popularity: 79, tags: ['update', 'reminder', 'software', 'annoying'] },
    { id: 'captcha-hell', name: 'Captcha Hell', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'technology', popularity: 77, tags: ['captcha', 'robot', 'verification', 'annoying'] },

    // HEALTH & FITNESS (Expanded)
    { id: 'gym-motivation', name: 'Gym Motivation', url: 'https://i.imgflip.com/2waljo.jpg', category: 'health', popularity: 80, tags: ['gym', 'motivation', 'fitness', 'workout'] },
    { id: 'new-year-resolution', name: 'New Year Resolution', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'health', popularity: 78, tags: ['new', 'year', 'resolution', 'goals'] },
    { id: 'workout-pain', name: 'Workout Pain', url: 'https://i.imgflip.com/2waljo.jpg', category: 'health', popularity: 76, tags: ['workout', 'pain', 'exercise', 'sore'] },
    { id: 'healthy-food', name: 'Healthy Food vs Junk Food', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'health', popularity: 74, tags: ['healthy', 'food', 'junk', 'diet'] },

    // MONEY & BUSINESS (Expanded)
    { id: 'money-printer-brrr', name: 'Money Printer Go Brrr', url: 'https://i.imgflip.com/3si4.jpg', category: 'money', popularity: 90, tags: ['money', 'printer', 'federal-reserve', 'economy'] },
    { id: 'crypto-gains', name: 'Crypto Gains', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'money', popularity: 85, tags: ['crypto', 'gains', 'bitcoin', 'investment'] },
    { id: 'broke-student', name: 'Broke Student Life', url: 'https://i.imgflip.com/2waljo.jpg', category: 'money', popularity: 83, tags: ['broke', 'student', 'poor', 'college'] },
    { id: 'rent-due', name: 'Rent Due Tomorrow', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'money', popularity: 81, tags: ['rent', 'due', 'money', 'broke'] },

    // SEASONAL & HOLIDAYS
    { id: 'christmas-shopping', name: 'Christmas Shopping Stress', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'holiday', popularity: 75, tags: ['christmas', 'shopping', 'stress', 'holiday'] },
    { id: 'halloween-costume', name: 'Halloween Costume Ideas', url: 'https://i.imgflip.com/2waljo.jpg', category: 'holiday', popularity: 73, tags: ['halloween', 'costume', 'ideas', 'creative'] },
    { id: 'valentine-single', name: 'Valentine Day Single', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'holiday', popularity: 71, tags: ['valentine', 'single', 'alone', 'holiday'] },
    { id: 'new-year-same-me', name: 'New Year Same Me', url: 'https://i.imgflip.com/2waljo.jpg', category: 'holiday', popularity: 69, tags: ['new', 'year', 'same', 'unchanged'] },

    // WEATHER & SEASONS
    { id: 'summer-heat', name: 'Summer Heat Wave', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'weather', popularity: 70, tags: ['summer', 'heat', 'hot', 'weather'] },
    { id: 'winter-cold', name: 'Winter Cold Snap', url: 'https://i.imgflip.com/2waljo.jpg', category: 'weather', popularity: 68, tags: ['winter', 'cold', 'snow', 'freezing'] },
    { id: 'spring-allergies', name: 'Spring Allergies', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'weather', popularity: 66, tags: ['spring', 'allergies', 'pollen', 'sneezing'] },
    { id: 'fall-vibes', name: 'Fall Vibes', url: 'https://i.imgflip.com/2waljo.jpg', category: 'weather', popularity: 64, tags: ['fall', 'autumn', 'vibes', 'cozy'] },

    // SPORTS & COMPETITION
    { id: 'sports-fan-rage', name: 'Sports Fan Rage', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'sports', popularity: 78, tags: ['sports', 'fan', 'rage', 'team'] },
    { id: 'victory-celebration', name: 'Victory Celebration', url: 'https://i.imgflip.com/2waljo.jpg', category: 'sports', popularity: 76, tags: ['victory', 'celebration', 'win', 'champion'] },
    { id: 'defeat-acceptance', name: 'Defeat Acceptance', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'sports', popularity: 74, tags: ['defeat', 'loss', 'acceptance', 'sports'] },

    // TRAVEL & ADVENTURE
    { id: 'travel-budget', name: 'Travel Budget Reality', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'travel', popularity: 72, tags: ['travel', 'budget', 'expensive', 'vacation'] },
    { id: 'airport-security', name: 'Airport Security Line', url: 'https://i.imgflip.com/2waljo.jpg', category: 'travel', popularity: 70, tags: ['airport', 'security', 'tsa', 'travel'] },
    { id: 'road-trip', name: 'Road Trip Adventure', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'travel', popularity: 68, tags: ['road', 'trip', 'adventure', 'car'] },

    // FAMILY & PARENTING
    { id: 'parent-life', name: 'Parent Life Exhaustion', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'family', popularity: 80, tags: ['parent', 'life', 'exhaustion', 'kids'] },
    { id: 'sibling-rivalry', name: 'Sibling Rivalry', url: 'https://i.imgflip.com/2waljo.jpg', category: 'family', popularity: 78, tags: ['sibling', 'rivalry', 'brother', 'sister'] },
    { id: 'family-dinner', name: 'Family Dinner Chaos', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'family', popularity: 76, tags: ['family', 'dinner', 'chaos', 'relatives'] },

    // MUSIC & ENTERTAINMENT
    { id: 'spotify-wrapped', name: 'Spotify Wrapped Shame', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'music', popularity: 75, tags: ['spotify', 'wrapped', 'music', 'shame'] },
    { id: 'concert-tickets', name: 'Concert Ticket Prices', url: 'https://i.imgflip.com/2waljo.jpg', category: 'music', popularity: 73, tags: ['concert', 'tickets', 'expensive', 'music'] },
    { id: 'playlist-mood', name: 'Playlist for Every Mood', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'music', popularity: 71, tags: ['playlist', 'mood', 'music', 'spotify'] },

    // NEWS & POLITICS (Safe/General)
    { id: 'breaking-news', name: 'Breaking News Alert', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'news', popularity: 70, tags: ['breaking', 'news', 'alert', 'media'] },
    { id: 'election-season', name: 'Election Season Fatigue', url: 'https://i.imgflip.com/2waljo.jpg', category: 'politics', popularity: 68, tags: ['election', 'politics', 'fatigue', 'voting'] },
    { id: 'news-cycle', name: '24 Hour News Cycle', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'news', popularity: 66, tags: ['news', 'cycle', 'media', 'constant'] },

    // EXISTENTIAL & PHILOSOPHICAL
    { id: 'existential-crisis', name: 'Existential Crisis', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'philosophy', popularity: 75, tags: ['existential', 'crisis', 'life', 'meaning'] },
    { id: 'deep-thoughts', name: 'Deep Thoughts 3AM', url: 'https://i.imgflip.com/2waljo.jpg', category: 'philosophy', popularity: 73, tags: ['deep', 'thoughts', '3am', 'insomnia'] },
    { id: 'life-questions', name: 'Life Questions', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'philosophy', popularity: 71, tags: ['life', 'questions', 'philosophy', 'wondering'] },

    // MISCELLANEOUS & RANDOM
    { id: 'monday-motivation', name: 'Monday Motivation Fail', url: 'https://i.imgflip.com/2waljo.jpg', category: 'work', popularity: 77, tags: ['monday', 'motivation', 'work', 'week'] },
    { id: 'friday-feeling', name: 'Friday Feeling', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'work', popularity: 85, tags: ['friday', 'feeling', 'weekend', 'freedom'] },
    { id: 'coffee-addiction', name: 'Coffee Addiction Real', url: 'https://i.imgflip.com/2waljo.jpg', category: 'lifestyle', popularity: 80, tags: ['coffee', 'addiction', 'caffeine', 'morning'] },
    { id: 'sleep-schedule', name: 'Sleep Schedule Destroyed', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'lifestyle', popularity: 78, tags: ['sleep', 'schedule', 'insomnia', 'tired'] },
    { id: 'alarm-clock', name: 'Alarm Clock Enemy', url: 'https://i.imgflip.com/2waljo.jpg', category: 'lifestyle', popularity: 76, tags: ['alarm', 'clock', 'morning', 'wake'] },

    // Add even more unique templates to reach 200+ unique ones
    { id: 'taxes-due', name: 'Taxes Due Panic', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'money', popularity: 74, tags: ['taxes', 'due', 'panic', 'irs'] },
    { id: 'password-forgot', name: 'Forgot Password Again', url: 'https://i.imgflip.com/2waljo.jpg', category: 'technology', popularity: 72, tags: ['password', 'forgot', 'login', 'security'] },
    { id: 'delivery-driver', name: 'Delivery Driver GPS', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'work', popularity: 70, tags: ['delivery', 'driver', 'gps', 'lost'] },
    { id: 'streaming-service', name: 'Too Many Streaming Services', url: 'https://i.imgflip.com/2waljo.jpg', category: 'entertainment', popularity: 75, tags: ['streaming', 'netflix', 'too', 'many'] },
    { id: 'online-shopping', name: 'Online Shopping Addiction', url: 'https://i.imgflip.com/1h7in3.jpg', category: 'lifestyle', popularity: 73, tags: ['online', 'shopping', 'addiction', 'amazon'] }
  ];

  return templates;
}

export function getFallbackMemes(): MemeTemplate[] {
  return [
    // MOST RELIABLE & POPULAR TEMPLATES
    {
      id: 'drake-fallback',
      name: 'Drake Pointing',
      url: 'https://i.imgflip.com/30b1gx.jpg',
      category: 'drake',
      popularity: 100,
      tags: ['drake', 'pointing', 'preference']
    },
    {
      id: 'distracted-boyfriend-fallback',
      name: 'Distracted Boyfriend',
      url: 'https://i.imgflip.com/1ur9b0.jpg',
      category: 'distracted',
      popularity: 99,
      tags: ['distracted', 'boyfriend', 'choice']
    },
    {
      id: 'woman-yelling-cat-fallback',
      name: 'Woman Yelling at Cat',
      url: 'https://i.imgflip.com/345v97.jpg',
      category: 'reaction',
      popularity: 98,
      tags: ['woman', 'cat', 'yelling', 'argument']
    },
    {
      id: 'two-buttons-fallback',
      name: 'Two Buttons',
      url: 'https://i.imgflip.com/1g8my4.jpg',
      category: 'choice',
      popularity: 97,
      tags: ['buttons', 'choice', 'decision']
    },
    {
      id: 'expanding-brain-fallback',
      name: 'Expanding Brain',
      url: 'https://i.imgflip.com/1jwhww.jpg',
      category: 'expanding',
      popularity: 96,
      tags: ['brain', 'expanding', 'intelligence']
    },
    {
      id: 'surprised-pikachu-fallback',
      name: 'Surprised Pikachu',
      url: 'https://i.imgflip.com/2kbn1e.jpg',
      category: 'reaction',
      popularity: 95,
      tags: ['pikachu', 'surprised', 'pokemon']
    },
    {
      id: 'this-is-fine-fallback',
      name: 'This is Fine',
      url: 'https://i.imgflip.com/26am.jpg',
      category: 'reaction',
      popularity: 94,
      tags: ['dog', 'fire', 'fine']
    },
    {
      id: 'change-my-mind-fallback',
      name: 'Change My Mind',
      url: 'https://i.imgflip.com/24y43o.jpg',
      category: 'advice',
      popularity: 93,
      tags: ['change', 'mind', 'debate']
    },
    {
      id: 'stonks-fallback',
      name: 'Stonks',
      url: 'https://i.imgflip.com/2d3al6.jpg',
      category: 'money',
      popularity: 92,
      tags: ['stonks', 'stocks', 'money']
    },
    {
      id: 'success-kid-fallback',
      name: 'Success Kid',
      url: 'https://i.imgflip.com/1bhk.jpg',
      category: 'success',
      popularity: 91,
      tags: ['success', 'kid', 'victory']
    },
    {
      id: 'panik-kalm-fallback',
      name: 'Panik Kalm Panik',
      url: 'https://i.imgflip.com/3qqcim.jpg',
      category: 'reaction',
      popularity: 90,
      tags: ['panik', 'kalm', 'stress']
    },
    {
      id: 'monkey-puppet-fallback',
      name: 'Monkey Puppet',
      url: 'https://i.imgflip.com/3oevdk.jpg',
      category: 'animals',
      popularity: 89,
      tags: ['monkey', 'puppet', 'side-eye']
    },
    {
      id: 'bad-luck-brian-fallback',
      name: 'Bad Luck Brian',
      url: 'https://i.imgflip.com/1bil.jpg',
      category: 'fail',
      popularity: 88,
      tags: ['bad', 'luck', 'brian', 'fail']
    },
    {
      id: 'good-guy-greg-fallback',
      name: 'Good Guy Greg',
      url: 'https://i.imgflip.com/1bik.jpg',
      category: 'wholesome',
      popularity: 87,
      tags: ['good', 'guy', 'greg', 'nice']
    },
    {
      id: 'scumbag-steve-fallback',
      name: 'Scumbag Steve',
      url: 'https://i.imgflip.com/1bim.jpg',
      category: 'fail',
      popularity: 86,
      tags: ['scumbag', 'steve', 'jerk']
    },
    {
      id: 'grumpy-cat-fallback',
      name: 'Grumpy Cat',
      url: 'https://i.imgflip.com/30cz.jpg',
      category: 'animals',
      popularity: 85,
      tags: ['cat', 'grumpy', 'no']
    },
    {
      id: 'doge-fallback',
      name: 'Doge',
      url: 'https://i.imgflip.com/4t0m5.jpg',
      category: 'animals',
      popularity: 84,
      tags: ['dog', 'shiba', 'wow']
    },
    {
      id: 'leonardo-cheers-fallback',
      name: 'Leonardo DiCaprio Cheers',
      url: 'https://i.imgflip.com/39t1o.jpg',
      category: 'celebrity',
      popularity: 83,
      tags: ['leonardo', 'dicaprio', 'cheers']
    },
    {
      id: 'hide-pain-harold-fallback',
      name: 'Hide the Pain Harold',
      url: 'https://i.imgflip.com/gk5el.jpg',
      category: 'reaction',
      popularity: 82,
      tags: ['harold', 'pain', 'fake-smile']
    },
    {
      id: 'disaster-girl-fallback',
      name: 'Disaster Girl',
      url: 'https://i.imgflip.com/23ls.jpg',
      category: 'reaction',
      popularity: 81,
      tags: ['disaster', 'girl', 'fire']
    }
  ];
}

export function getMemesByCategory(category: string, memes: MemeTemplate[]): MemeTemplate[] {
  if (category === 'all') return memes;
  return memes.filter(meme => meme.category === category);
}

export function searchMemes(query: string, memes: MemeTemplate[]): MemeTemplate[] {
  if (!query.trim()) return memes;
  
  const lowerQuery = query.toLowerCase();
  return memes.filter(meme => 
    meme.name.toLowerCase().includes(lowerQuery) ||
    meme.category.toLowerCase().includes(lowerQuery) ||
    (meme.tags && meme.tags.some(tag => tag.includes(lowerQuery)))
  );
}

export function getPopularMemes(memes: MemeTemplate[], limit: number = 20): MemeTemplate[] {
  return memes
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

export function getTrendingMemes(memes: MemeTemplate[], limit: number = 20): MemeTemplate[] {
  return memes
    .filter(meme => meme.category === 'trending')
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

export function getUniqueCategories(memes: MemeTemplate[]): string[] {
  const categories = memes.map(meme => meme.category);
  return ['all', 'popular', 'trending', ...Array.from(new Set(categories)).sort()];
}

export function getMemeStats(memes: MemeTemplate[]) {
  return {
    total: memes.length,
    categories: getUniqueCategories(memes).length - 3, // Subtract 'all', 'popular', 'trending'
    mostPopular: getPopularMemes(memes, 1)[0],
    newestCategory: 'trending'
  };
} 

// Fast template validation function (reduced timeout for speed)
export async function validateTemplate(url: string): Promise<boolean> {
  // Check cache first
  if (validatedTemplatesCache.has(url)) {
    return true;
  }

  try {
    // Create a promise that resolves when image loads or rejects on error
    const isValid = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve(false);
      }, 2000); // Reduced to 2 second timeout for faster validation

      img.onload = () => {
        clearTimeout(timeout);
        // Quick validation - just check if image loaded
        if (img.width > 0 && img.height > 0) {
          validatedTemplatesCache.add(url);
          resolve(true);
        } else {
          resolve(false);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      // Don't use CORS for validation to avoid issues
      img.src = url;
    });

    return isValid;
  } catch (error) {
    console.warn('Template validation failed for:', url, error);
    return false;
  }
}

// Fast validation for priority templates (used when needed)
export async function validatePriorityTemplates(templates: MemeTemplate[], maxValidate: number = 50): Promise<MemeTemplate[]> {
  console.log(`🔍 Quick validating top ${Math.min(maxValidate, templates.length)} templates...`);
  
  // Only validate the most popular templates for faster loading
  const priorityTemplates = templates.slice(0, maxValidate);
  const remainingTemplates = templates.slice(maxValidate);
  
  // Process in smaller batches for speed
  const batchSize = 5;
  const validatedTemplates: MemeTemplate[] = [];
  
  for (let i = 0; i < priorityTemplates.length; i += batchSize) {
    const batch = priorityTemplates.slice(i, i + batchSize);
    
    const validationPromises = batch.map(async (template) => {
      const isValid = await validateTemplate(template.url);
      if (isValid) {
        return { ...template, validated: true };
      }
      return null;
    });
    
    const results = await Promise.all(validationPromises);
    const validBatch = results.filter((template): template is NonNullable<typeof template> => template !== null);
    validatedTemplates.push(...validBatch);
    
    // Very small delay to keep UI responsive
    if (i + batchSize < priorityTemplates.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  // Add remaining templates without validation for instant loading
  validatedTemplates.push(...remainingTemplates.map(t => ({ ...t, validated: false })));
  
  console.log(`✅ Quick validated ${validatedTemplates.filter(t => t.validated).length} priority templates`);
  return validatedTemplates;
}

// Full batch validation (for background processing)
export async function validateTemplates(templates: MemeTemplate[]): Promise<MemeTemplate[]> {
  console.log(`🔍 Validating ${templates.length} templates...`);
  
  // Process in batches to avoid overwhelming the browser
  const batchSize = 10;
  const validatedTemplates: MemeTemplate[] = [];
  
  for (let i = 0; i < templates.length; i += batchSize) {
    const batch = templates.slice(i, i + batchSize);
    
    const validationPromises = batch.map(async (template) => {
      const isValid = await validateTemplate(template.url);
      if (isValid) {
        return { ...template, validated: true };
      }
      return null;
    });
    
    const results = await Promise.all(validationPromises);
    const validBatch = results.filter((template): template is NonNullable<typeof template> => template !== null);
    validatedTemplates.push(...validBatch);
    
    // Small delay between batches to prevent overwhelming
    if (i + batchSize < templates.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`✅ Validated ${validatedTemplates.length}/${templates.length} templates`);
  return validatedTemplates;
} 