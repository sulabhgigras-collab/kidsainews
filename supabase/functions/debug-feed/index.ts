import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Fetch just BBC world
    const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml", {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/rss+xml, */*" },
    });
    const xml = await res.text();
    const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];
    
    const parsed = items.slice(0, 3).map(entry => {
      const block = entry[0];
      const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const pubDateMatch = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const linkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      
      const rawTitle = titleMatch?.[1] || "";
      const rawDate = pubDateMatch?.[1] || "";
      const rawLink = linkMatch?.[1] || "";
      
      // Apply same cleaning as readTag/stripHtml
      const cleanStr = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      
      const title = cleanStr(rawTitle).replace(/\s+-\s+[^-]+$/, "").trim();
      const pubDate = cleanStr(rawDate);
      const link = cleanStr(rawLink);
      
      const timestamp = Date.parse(pubDate);
      const RECENT_WINDOW_HOURS = 36;
      const isRecent = !Number.isNaN(timestamp) && (Date.now() - timestamp <= RECENT_WINDOW_HOURS * 60 * 60 * 1000);
      
      return { title: title.slice(0, 80), pubDate, link: link.slice(0, 80), timestamp, now: Date.now(), diffHours: (Date.now() - timestamp) / 3600000, isRecent };
    });
    
    return new Response(JSON.stringify({ feedStatus: res.status, totalItems: items.length, parsed }, null, 2), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
