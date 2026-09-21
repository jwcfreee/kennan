/**
 * Cloudflare Worker for the CQS Growth Engine profile analyzer.
 *
 * Required secrets:
 *   REDDIT_CLIENT_ID
 *   REDDIT_CLIENT_SECRET
 *
 * Optional variable:
 *   ALLOWED_ORIGIN = https://kennanegloria.xyz
 *
 * Reddit API access must comply with Reddit's current Developer/Data API terms.
 */

const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API = "https://oauth.reddit.com";

function corsHeaders(env, request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowed === "*" ? "*" : (origin === allowed ? origin : allowed),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, env, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      ...corsHeaders(env, request)
    }
  });
}

function safeUsername(value) {
  const v = (value || "").trim();
  return /^[A-Za-z0-9_-]{3,20}$/.test(v) ? v : "";
}

async function getAppToken(env) {
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET) {
    throw new Error("Missing Reddit API credentials.");
  }

  const auth = btoa(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`);
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const res = await fetch(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "web:cqs-growth-engine:v1.0 (portfolio analyzer)"
    },
    body
  });

  if (!res.ok) {
    throw new Error(`Reddit token request failed (${res.status}).`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error("Reddit did not return an access token.");
  return data.access_token;
}

async function redditGet(path, token) {
  const res = await fetch(`${REDDIT_API}${path}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "User-Agent": "web:cqs-growth-engine:v1.0 (portfolio analyzer)"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit API request failed (${res.status}): ${text.slice(0,120)}`);
  }
  return res.json();
}

function children(listing) {
  return listing?.data?.children?.map(x => x.data).filter(Boolean) || [];
}

function daysSince(utc) {
  return Math.max(0, (Date.now()/1000 - utc) / 86400);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildAnalysis(profile, rawPosts, rawComments) {
  const posts = rawPosts.map(x => ({
    subreddit: x.subreddit || "",
    score: Number(x.score || 0),
    createdUtc: Number(x.created_utc || 0),
    title: x.title || ""
  }));

  const comments = rawComments.map(x => ({
    subreddit: x.subreddit || "",
    score: Number(x.score || 0),
    createdUtc: Number(x.created_utc || 0),
    body: x.body || ""
  }));

  const all = [...posts, ...comments];
  const ageYears = Math.max(0, (Date.now()/1000 - Number(profile.created_utc || 0)) / (365.25*86400));
  const avgPost = posts.length ? posts.reduce((s,x)=>s+x.score,0)/posts.length : 0;
  const avgComment = comments.length ? comments.reduce((s,x)=>s+x.score,0)/comments.length : 0;
  const communities = new Set(all.map(x=>x.subreddit).filter(Boolean)).size;
  const activity30 = all.filter(x=>daysSince(x.createdUtc) <= 30);
  const activeDays = new Set(activity30.map(x => Math.floor((Date.now()/1000 - x.createdUtc)/86400))).size;
  const consistency30 = Math.round(clamp((activeDays / 15) * 100, 0, 100));

  // Transparent portfolio score — NOT Reddit CQS.
  const ageScore = clamp(ageYears / 3, 0, 1) * 20;
  const karma = Number(profile.link_karma||0) + Number(profile.comment_karma||0);
  const karmaScore = clamp(Math.log10(Math.max(karma,1)) / 5, 0, 1) * 25;
  const balance = posts.length && comments.length ? Math.min(posts.length,comments.length)/Math.max(posts.length,comments.length) : 0;
  const balanceScore = balance * 15;
  const consistencyScore = (consistency30/100) * 20;
  const engagementScore = clamp((avgPost + avgComment) / 80, 0, 1) * 20;
  const qualityScore = Math.round(clamp(ageScore+karmaScore+balanceScore+consistencyScore+engagementScore,0,100));

  const recommendations = [];
  if (ageYears < .5) recommendations.push("Account is relatively new; prioritize steady, authentic participation over rapid volume.");
  if (consistency30 < 45) recommendations.push("Recent activity is inconsistent; a steadier participation pattern may improve account quality.");
  if (balance < .2) recommendations.push("Activity is heavily weighted toward either posts or comments; a more balanced contribution pattern may look healthier.");
  if (communities < 3) recommendations.push("Recent activity is concentrated in very few communities; participate only where genuinely relevant, but avoid over-concentration.");
  if (avgPost < 5 && avgComment < 3) recommendations.push("Recent engagement is modest; focus on content relevance and community fit rather than posting frequency.");
  if (qualityScore >= 80) recommendations.push("Public account signals look strong; maintain consistency and avoid abrupt changes in activity volume.");
  if (!recommendations.length) recommendations.push("Public activity looks reasonably balanced. Continue monitoring consistency, relevance, and engagement quality.");

  return {
    profile: {
      name: profile.name,
      linkKarma: Number(profile.link_karma || 0),
      commentKarma: Number(profile.comment_karma || 0),
      createdUtc: Number(profile.created_utc || 0)
    },
    summary: {
      accountAgeYears: round1(ageYears),
      sampledActivity: all.length,
      posts: posts.length,
      comments: comments.length,
      avgPostScore: round1(avgPost),
      avgCommentScore: round1(avgComment),
      communities,
      consistency30,
      qualityScore
    },
    recommendations,
    posts,
    comments
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true }, 200, env, request);
    }

    if (url.pathname !== "/analyze") {
      return json({ error: "Not found" }, 404, env, request);
    }

    const username = safeUsername(url.searchParams.get("username"));
    if (!username) {
      return json({ error: "Invalid Reddit username." }, 400, env, request);
    }

    try {
      const token = await getAppToken(env);

      const [profile, submitted, comments] = await Promise.all([
        redditGet(`/user/${encodeURIComponent(username)}/about`, token),
        redditGet(`/user/${encodeURIComponent(username)}/submitted?limit=50&sort=new`, token),
        redditGet(`/user/${encodeURIComponent(username)}/comments?limit=50&sort=new`, token)
      ]);

      if (!profile?.data?.name) {
        return json({ error: "Profile not found or unavailable." }, 404, env, request);
      }

      const analysis = buildAnalysis(profile.data, children(submitted), children(comments));
      return json(analysis, 200, env, request);

    } catch (err) {
      return json({ error: err.message || "Analysis failed." }, 500, env, request);
    }
  }
};