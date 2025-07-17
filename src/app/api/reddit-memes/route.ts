import { NextResponse } from 'next/server';

export interface RedditPost {
  title: string;
  url: string;
  thumbnail: string;
  upvotes: number;
  id: string;
  author: string;
  created_utc: number;
  permalink: string;
  subreddit: string;
}

export interface RedditMemeTemplate {
  id: string;
  name: string;
  url: string;
  category: string;
  popularity: number;
  tags: string[];
  source: 'reddit';
  subreddit: string;
  upvotes: number;
  author: string;
  permalink: string;
  mediaType: 'image' | 'video';
  thumbnail?: string;
}

// List of meme template subreddits to fetch from
const MEME_SUBREDDITS = [
  'MemeTemplatesOfficial',
  'memetemplates', 
  'MemeTemplate',
  'blanktemplate',
  'TemplateMemes',
  'dankmemes',
  'memes',
  'wholesomememes',
  'PrequelMemes',
  'HistoryMemes',
  'ProgrammerHumor',
  'ReactionMemes',
  'AdviceAnimals',
  'MemeEconomy',
  'InsiderMemeTrading'
];

// Cache for Reddit API responses
let redditCache: RedditMemeTemplate[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function isImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for direct image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasImageExt = imageExtensions.some(ext => url.toLowerCase().includes(ext));
  
  // Check for common image hosting domains
  const imageHosts = ['i.redd.it', 'i.imgur.com', 'imgur.com', 'i.imgflip.com'];
  const isImageHost = imageHosts.some(host => url.includes(host));
  
  // Include video extensions and hosts
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const hasVideoExt = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  // Check for video hosting domains
  const videoHosts = ['v.redd.it', 'gfycat.com', 'redgifs.com'];
  const isVideoHost = videoHosts.some(host => url.includes(host));
  
  // Exclude non-media content
  const excludePatterns = ['reddit.com/gallery', 'youtu.be', 'youtube.com', 'twitter.com', 'tiktok.com'];
  const hasExcluded = excludePatterns.some(pattern => url.includes(pattern));
  
  return (hasImageExt || isImageHost || hasVideoExt || isVideoHost) && !hasExcluded;
}

function getMediaType(url: string): 'image' | 'video' {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const videoHosts = ['v.redd.it', 'gfycat.com', 'redgifs.com'];
  
  const hasVideoExt = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  const isVideoHost = videoHosts.some(host => url.includes(host));
  
  return (hasVideoExt || isVideoHost) ? 'video' : 'image';
}

function categorizeRedditMeme(title: string, _subreddit: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Category mapping based on title keywords
  if (lowerTitle.includes('drake') || lowerTitle.includes('pointing')) return 'drake';
  if (lowerTitle.includes('distracted') || lowerTitle.includes('boyfriend')) return 'distracted';
  if (lowerTitle.includes('brain') || lowerTitle.includes('expanding')) return 'expanding';
  if (lowerTitle.includes('button') || lowerTitle.includes('choice')) return 'choice';
  if (lowerTitle.includes('pikachu') || lowerTitle.includes('surprised')) return 'reaction';
  if (lowerTitle.includes('cat') || lowerTitle.includes('yelling')) return 'reaction';
  if (lowerTitle.includes('stonks') || lowerTitle.includes('money')) return 'money';
  if (lowerTitle.includes('success') || lowerTitle.includes('kid')) return 'success';
  if (lowerTitle.includes('dog') || lowerTitle.includes('fine')) return 'reaction';
  if (lowerTitle.includes('meme') || lowerTitle.includes('template')) return 'template';
  if (lowerTitle.includes('reaction')) return 'reaction';
  if (lowerTitle.includes('animal') || lowerTitle.includes('pet')) return 'animals';
  if (lowerTitle.includes('work') || lowerTitle.includes('office')) return 'work';
  if (lowerTitle.includes('school') || lowerTitle.includes('student')) return 'school';
  if (lowerTitle.includes('game') || lowerTitle.includes('gaming')) return 'gaming';
  if (lowerTitle.includes('food') || lowerTitle.includes('cooking')) return 'food';
  
  return 'template';
}

function generateTags(title: string, subreddit: string): string[] {
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'oil', 'sit', 'set'].includes(word));
  
  return [...new Set([...words, subreddit.toLowerCase(), 'reddit', 'template'])].slice(0, 8);
}

async function fetchFromSubreddit(subreddit: string, timeframe: string = 'month'): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=100&t=${timeframe}`;
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Memic-App/1.0 (Meme Template Fetcher)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch from r/${subreddit}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.data?.children) {
      console.warn(`No data found for r/${subreddit}`);
      return [];
    }

    return data.data.children
      .map((post: { data: { title: string; url: string; thumbnail: string; ups: number; id: string; author: string; created_utc: number; permalink: string; subreddit: string } }) => ({
        title: post.data.title,
        url: post.data.url,
        thumbnail: post.data.thumbnail,
        upvotes: post.data.ups,
        id: post.data.id,
        author: post.data.author,
        created_utc: post.data.created_utc,
        permalink: post.data.permalink,
        subreddit: post.data.subreddit,
      }))
      .filter((post: RedditPost) => isImageUrl(post.url) && post.upvotes > 5); // Lower threshold for more content

  } catch (error) {
    console.error(`Error fetching from r/${subreddit}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Check cache first
    if (redditCache.length > 0 && Date.now() - lastFetch < CACHE_DURATION) {
      console.log(`Returning ${redditCache.length} cached Reddit templates`);
      return NextResponse.json({
        success: true,
        templates: redditCache,
        cached: true,
        count: redditCache.length
      });
    }

    console.log('Fetching fresh Reddit meme templates...');
    const allPosts: RedditPost[] = [];

    // Fetch from multiple subreddits and time periods in parallel
    const timeframes = ['week', 'month', 'year'];
    const fetchPromises: Promise<RedditPost[]>[] = [];
    
    MEME_SUBREDDITS.forEach(subreddit => {
      timeframes.forEach(timeframe => {
        fetchPromises.push(fetchFromSubreddit(subreddit, timeframe));
      });
    });

    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      const subredditIndex = Math.floor(index / timeframes.length);
      const timeframeIndex = index % timeframes.length;
      const subreddit = MEME_SUBREDDITS[subredditIndex];
      const timeframe = timeframes[timeframeIndex];
      
      if (result.status === 'fulfilled') {
        allPosts.push(...result.value);
        console.log(`✅ Fetched ${result.value.length} templates from r/${subreddit} (${timeframe})`);
      } else {
        console.warn(`❌ Failed to fetch from r/${subreddit} (${timeframe}):`, result.reason);
      }
    });

    // Remove duplicates based on URL
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.url === post.url)
    );

    // Convert to our template format
    const templates: RedditMemeTemplate[] = uniquePosts
      .sort((a, b) => b.upvotes - a.upvotes) // Sort by popularity
      .slice(0, 200) // Increased limit to 200
      .map((post, index) => ({
        id: `reddit-${post.id}`,
        name: post.title.length > 50 ? `${post.title.substring(0, 50)}...` : post.title,
        url: post.url,
        category: categorizeRedditMeme(post.title, post.subreddit),
        popularity: Math.max(10, 100 - Math.floor(index / 2)), // Popularity based on ranking
        tags: generateTags(post.title, post.subreddit),
        source: 'reddit' as const,
        subreddit: post.subreddit,
        upvotes: post.upvotes,
        author: post.author,
        permalink: `https://reddit.com${post.permalink}`,
        mediaType: getMediaType(post.url),
        thumbnail: post.thumbnail
      }));

    // Update cache
    redditCache = templates;
    lastFetch = Date.now();

    console.log(`🎭 Successfully fetched ${templates.length} unique Reddit meme templates`);

    return NextResponse.json({
      success: true,
      templates,
      cached: false,
      count: templates.length,
      subreddits: MEME_SUBREDDITS,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Reddit memes API:', error);
    
    // Return cached data if available, even if stale
    if (redditCache.length > 0) {
      return NextResponse.json({
        success: true,
        templates: redditCache,
        cached: true,
        count: redditCache.length,
        error: 'Using cached data due to API error'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Reddit meme templates',
      templates: [],
      count: 0
    }, { status: 500 });
  }
} 