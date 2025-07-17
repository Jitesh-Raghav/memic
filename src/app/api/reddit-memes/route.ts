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

// List of meme template subreddits to fetch from (reduced for rate limiting)
const MEME_SUBREDDITS = [
  'MemeTemplatesOfficial',
  'memetemplates', 
  'MemeTemplate',
  'blanktemplate',
  'TemplateMemes',
  'dankmemes',
  'memes'
  // Reduced from 15 to 7 subreddits to avoid Reddit rate limits in production
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

function categorizeRedditMeme(title: string): string {
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
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=50&t=${timeframe}`;
    console.log(`🔍 Fetching from: r/${subreddit} (${timeframe})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Memic-App/1.0 (Template Fetcher)',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`❌ Failed to fetch from r/${subreddit}: HTTP ${response.status} - ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.data?.children) {
      console.warn(`⚠️ No data found for r/${subreddit}`);
      return [];
    }

    const posts = data.data.children
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
      .filter((post: RedditPost) => isImageUrl(post.url) && post.upvotes > 10); // Slightly higher threshold for quality

    console.log(`✅ Found ${posts.length} valid templates from r/${subreddit} (${timeframe})`);
    return posts;

  } catch (error) {
    console.error(`❌ Error fetching from r/${subreddit} (${timeframe}):`, error);
    return [];
  }
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check cache first
    if (redditCache.length > 0 && Date.now() - lastFetch < CACHE_DURATION) {
      console.log(`📦 Returning ${redditCache.length} cached Reddit templates`);
      return NextResponse.json({
        success: true,
        templates: redditCache,
        cached: true,
        count: redditCache.length,
        fetchTime: 0
      });
    }

    console.log('🔄 Fetching fresh Reddit meme templates...');
    console.log(`📊 Will fetch from ${MEME_SUBREDDITS.length} subreddits with reduced timeframes`);
    const allPosts: RedditPost[] = [];

    // Fetch from multiple subreddits and time periods with rate limiting
    const timeframes = ['month', 'week']; // Reduced timeframes to avoid rate limits
    const fetchPromises: Promise<RedditPost[]>[] = [];
    
    // Sequential fetching to avoid overwhelming Reddit API
    for (const subreddit of MEME_SUBREDDITS) {
      for (const timeframe of timeframes) {
        fetchPromises.push(fetchFromSubreddit(subreddit, timeframe));
        // Small delay between requests to avoid rate limiting
        if (fetchPromises.length < MEME_SUBREDDITS.length * timeframes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

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
      .slice(0, 150) // Reduced to 150 for better performance
      .map((post, index) => ({
        id: `reddit-${post.id}`,
        name: post.title.length > 50 ? `${post.title.substring(0, 50)}...` : post.title,
        url: post.url,
                    category: categorizeRedditMeme(post.title),
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

    const fetchTime = Date.now() - startTime;
    console.log(`🎭 Successfully fetched ${templates.length} unique Reddit meme templates in ${fetchTime}ms`);
    
    // Log breakdown by subreddit
    const subredditBreakdown = MEME_SUBREDDITS.map(sub => ({
      subreddit: sub,
      count: templates.filter(t => t.subreddit === sub).length
    }));
    console.log('📊 Templates by subreddit:', subredditBreakdown);

    return NextResponse.json({
      success: true,
      templates,
      cached: false,
      count: templates.length,
      subreddits: MEME_SUBREDDITS,
      fetchedAt: new Date().toISOString(),
      fetchTime,
      breakdown: subredditBreakdown
    });

  } catch (error) {
    const fetchTime = Date.now() - startTime;
    console.error('❌ Error in Reddit memes API:', error);
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fetchTime,
      subreddits: MEME_SUBREDDITS,
      cacheSize: redditCache.length
    });
    
    // Return cached data if available, even if stale
    if (redditCache.length > 0) {
      console.log(`📦 Returning ${redditCache.length} stale cached templates due to error`);
      return NextResponse.json({
        success: true,
        templates: redditCache,
        cached: true,
        count: redditCache.length,
        error: 'Using cached data due to API error',
        fetchTime
      });
    }

    console.log('🆘 No cache available, returning empty result');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Reddit meme templates',
      templates: [],
      count: 0,
      fetchTime
    }, { status: 500 });
  }
} 