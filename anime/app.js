
const API='https://kenanime-api.egloriakennan11.workers.dev/api';
const ANILIST_API='https://graphql.anilist.co';

const qs=s=>document.querySelector(s);
const qsa=s=>[...document.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const CACHE_PREFIX='kenanime-api-v3:';
const CACHE_TTL=15*60*1000;

function cacheGet(key){
  try{
    const raw=localStorage.getItem(CACHE_PREFIX+key);
    if(!raw) return null;
    const item=JSON.parse(raw);
    if(!item || Date.now()-item.time>CACHE_TTL){
      localStorage.removeItem(CACHE_PREFIX+key);
      return null;
    }
    return item.data;
  }catch{
    return null;
  }
}

function cacheSet(key,data){
  try{
    localStorage.setItem(CACHE_PREFIX+key,JSON.stringify({
      time:Date.now(),
      data
    }));
  }catch{}
}

function retryable(status){
  return [408,429,500,502,503,504].includes(status);
}

async function fetchJSON(url, options={}, timeoutMs=12000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);

  try{
    const response=await fetch(url,{
      ...options,
      signal:controller.signal
    });

    const text=await response.text();
    let data=null;

    try{
      data=text?JSON.parse(text):null;
    }catch{
      data={error:text||`HTTP ${response.status}`};
    }

    return {response,data};
  }finally{
    clearTimeout(timer);
  }
}

/* ---------- AniList browser fallback ---------- */

function mapAniListFormat(format){
  const m={
    TV:'TV',
    TV_SHORT:'TV',
    MOVIE:'Movie',
    SPECIAL:'Special',
    OVA:'OVA',
    ONA:'ONA',
    MUSIC:'Music'
  };
  return m[format]||'Anime';
}

function mapAniListStatus(status){
  const m={
    FINISHED:'Finished Airing',
    RELEASING:'Currently Airing',
    NOT_YET_RELEASED:'Not yet aired',
    CANCELLED:'Cancelled',
    HIATUS:'Hiatus'
  };
  return m[status]||status||'';
}

function stripHtml(text=''){
  return String(text)
    .replace(/<br\s*\/?>/gi,' ')
    .replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/g,' ')
    .trim();
}

function aniListToJikan(media){
  const title=
    media?.title?.english||
    media?.title?.romaji||
    media?.title?.native||
    'Untitled';

  const youtubeId=
    media?.trailer?.site==='youtube'
      ? media?.trailer?.id||null
      : null;

  return {
    mal_id: media?.idMal || media?.id,
    url: media?.siteUrl || '',
    images:{
      jpg:{
        image_url:media?.coverImage?.large||media?.coverImage?.extraLarge||'',
        small_image_url:media?.coverImage?.medium||media?.coverImage?.large||'',
        large_image_url:media?.coverImage?.extraLarge||media?.coverImage?.large||''
      }
    },
    trailer:{
      youtube_id:youtubeId,
      url:youtubeId?`https://www.youtube.com/watch?v=${youtubeId}`:null,
      embed_url:youtubeId?`https://www.youtube.com/embed/${youtubeId}`:null
    },
    title,
    title_english:media?.title?.english||null,
    title_japanese:media?.title?.native||null,
    type:mapAniListFormat(media?.format),
    episodes:media?.episodes??null,
    status:mapAniListStatus(media?.status),
    airing:media?.status==='RELEASING',
    score:typeof media?.averageScore==='number'
      ? Math.round(media.averageScore)/10
      : null,
    popularity:media?.popularity||null,
    favorites:media?.favourites||null,
    synopsis:stripHtml(media?.description||''),
    year:media?.seasonYear||media?.startDate?.year||null,
    season:media?.season?String(media.season).toLowerCase():null,
    genres:(media?.genres||[]).map((name,i)=>({
      mal_id:i+1,
      type:'anime',
      name,
      url:''
    })),
    aired:{
      prop:{
        from:{
          day:media?.startDate?.day||null,
          month:media?.startDate?.month||null,
          year:media?.startDate?.year||null
        },
        to:{
          day:media?.endDate?.day||null,
          month:media?.endDate?.month||null,
          year:media?.endDate?.year||null
        }
      }
    }
  };
}

async function aniListSearch(search,page=1,perPage=24){
  const cacheKey=`anilist-search:${search}:${page}:${perPage}`;
  const cached=cacheGet(cacheKey);
  if(cached) return cached;

  const query=`
    query ($search:String!,$page:Int!,$perPage:Int!){
      Page(page:$page,perPage:$perPage){
        pageInfo{
          currentPage
          hasNextPage
          lastPage
          perPage
          total
        }
        media(search:$search,type:ANIME,isAdult:false){
          id
          idMal
          siteUrl
          title{romaji english native}
          description(asHtml:false)
          format
          status
          episodes
          averageScore
          popularity
          favourites
          genres
          season
          seasonYear
          startDate{year month day}
          endDate{year month day}
          coverImage{extraLarge large medium}
          trailer{id site thumbnail}
        }
      }
    }
  `;

  const {response,data}=await fetchJSON(
    ANILIST_API,
    {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body:JSON.stringify({
        query,
        variables:{
          search,
          page:Math.max(1,Number(page)||1),
          perPage:Math.min(24,Math.max(1,Number(perPage)||24))
        }
      })
    },
    12000
  );

  if(!response.ok){
    const msg=
      data?.errors?.[0]?.message||
      data?.error||
      `AniList returned ${response.status}`;
    throw new Error(msg);
  }

  if(data?.errors?.length){
    throw new Error(data.errors[0]?.message||'AniList search failed.');
  }

  const info=data?.data?.Page?.pageInfo||{};
  const media=data?.data?.Page?.media||[];

  const result={
    data:media.map(aniListToJikan),
    pagination:{
      last_visible_page:info.lastPage||1,
      has_next_page:Boolean(info.hasNextPage),
      current_page:info.currentPage||1,
      items:{
        count:media.length,
        total:info.total||media.length,
        per_page:info.perPage||perPage
      }
    },
    source:'AniList direct fallback'
  };

  cacheSet(cacheKey,result);
  return result;
}


/* ---------- Homepage feed (direct AniList) ---------- */
/*
  The homepage intentionally uses AniList directly instead of the
  Cloudflare/Jikan route because Jikan's /top/anime feed has been
  intermittently returning 504s. Search still uses the existing
  Cloudflare + AniList fallback system.
*/
async function aniListHomeFeed({kind='top',page=1,perPage=12}={}){
  const cacheKey=`home-feed:${kind}:${page}:${perPage}`;
  const cached=cacheGet(cacheKey);
  if(cached) return cached;

  const isAiring=kind==='airing';

  const query=`
    query ($page:Int!,$perPage:Int!,$status:MediaStatus){
      Page(page:$page,perPage:$perPage){
        pageInfo{
          currentPage
          hasNextPage
          lastPage
          perPage
          total
        }
        media(
          type:ANIME,
          isAdult:false,
          status:$status,
          sort:[SCORE_DESC,POPULARITY_DESC]
        ){
          id
          idMal
          siteUrl
          title{romaji english native}
          description(asHtml:false)
          format
          status
          episodes
          averageScore
          popularity
          favourites
          genres
          season
          seasonYear
          startDate{year month day}
          endDate{year month day}
          coverImage{extraLarge large medium}
          trailer{id site thumbnail}
        }
      }
    }
  `;

  const variables={
    page:Math.max(1,Number(page)||1),
    perPage:Math.min(24,Math.max(1,Number(perPage)||12)),
    status:isAiring?'RELEASING':null
  };

  const {response,data}=await fetchJSON(
    ANILIST_API,
    {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body:JSON.stringify({query,variables})
    },
    12000
  );

  if(!response.ok){
    throw new Error(
      data?.errors?.[0]?.message ||
      data?.error ||
      `AniList homepage feed returned ${response.status}`
    );
  }

  if(data?.errors?.length){
    throw new Error(data.errors[0]?.message || 'AniList homepage feed failed.');
  }

  const info=data?.data?.Page?.pageInfo||{};
  const media=data?.data?.Page?.media||[];

  const result={
    data:media.map(aniListToJikan),
    pagination:{
      last_visible_page:info.lastPage||1,
      has_next_page:Boolean(info.hasNextPage),
      current_page:info.currentPage||1,
      items:{
        count:media.length,
        total:info.total||media.length,
        per_page:info.perPage||perPage
      }
    },
    source:'AniList homepage'
  };

  cacheSet(cacheKey,result);
  return result;
}

/* ---------- Main API wrapper ---------- */

async function api(path,{retries=3,useCache=true}={}){
  const cacheKey=`worker:${path}`;

  if(useCache){
    const cached=cacheGet(cacheKey);
    if(cached) return cached;
  }

  const isAnimeSearch=
    path.startsWith('/anime?') &&
    new URLSearchParams(path.split('?')[1]||'').get('q');

  let lastError=new Error('Anime data service is temporarily unavailable.');

  for(let attempt=0;attempt<retries;attempt++){
    try{
      const {response,data}=await fetchJSON(
        API+path,
        {
          headers:{'Accept':'application/json'}
        },
        12000
      );

      if(response.ok){
        if(useCache) cacheSet(cacheKey,data);
        return data;
      }

      const message=
        data?.detail||
        data?.error||
        `Anime service returned ${response.status}`;

      lastError=new Error(message);

      if(!retryable(response.status)){
        break;
      }

    }catch(err){
      lastError=err;
    }

    if(attempt<retries-1){
      await sleep(Math.min(700*Math.pow(2,attempt),3000));
    }
  }

  /*
    Cloudflare-originated requests to AniList can receive 403.
    For title search only, fall back to AniList directly from
    the visitor's browser instead of routing through Cloudflare.
  */
  if(isAnimeSearch){
    const params=new URLSearchParams(path.split('?')[1]||'');
    const search=(params.get('q')||'').trim();
    const page=Number(params.get('page')||1);
    const limit=Number(params.get('limit')||24);

    if(search){
      return aniListSearch(search,page,limit);
    }
  }

  throw new Error(
    lastError?.message||
    'Anime data service is temporarily unavailable.'
  );
}

function titleOf(a){return a.title_english||a.title||'Untitled'}
function imgOf(a){return a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||''}

function cardHTML(a){
  const id=a.mal_id;

  return `<article class="card">
    <a href="anime.html?id=${id}">
      <div class="poster">
        <img
          src="${imgOf(a)}"
          alt="${titleOf(a).replace(/"/g,'&quot;')}"
          loading="lazy"
        >
        <span class="score">★ ${a.score??'—'}</span>
      </div>

      <div class="card-body">
        <div class="card-title">${titleOf(a)}</div>
        <div class="card-meta">
          ${a.type||'Anime'} · ${a.episodes??'?'} eps
        </div>
      </div>
    </a>
  </article>`;
}

function setGrid(el,data){
  el.innerHTML=data.length
    ? data.map(cardHTML).join('')
    : '<div class="empty">No titles found. Try a broader search.</div>';
}

function getWatchlist(){
  try{
    return JSON.parse(localStorage.getItem('kenanime-watchlist')||'[]');
  }catch{
    return [];
  }
}

function saveWatchlist(x){
  localStorage.setItem('kenanime-watchlist',JSON.stringify(x));
}

function toggleWatch(id){
  let list=getWatchlist();
  const has=list.includes(id);

  list=has
    ? list.filter(x=>x!==id)
    : [...list,id];

  saveWatchlist(list);
  return !has;
}

function trailerEmbed(a){
  return a.trailer?.embed_url ||
    (a.trailer?.youtube_id
      ? `https://www.youtube.com/embed/${a.trailer.youtube_id}`
      : '');
}

function setupSearch(){
  const form=qs('#globalSearch');
  if(!form)return;

  form.addEventListener('submit',e=>{
    e.preventDefault();

    const q=qs('#globalQ').value.trim();

    if(q){
      location.href=
        'browse.html?q='+encodeURIComponent(q);
    }
  });
}

setupSearch();
