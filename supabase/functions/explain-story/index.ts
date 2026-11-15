import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, story, funFact, sourceName, sourceUrl, age, language, followUpQuestion } = await req.json();

    if (!title || !story) {
      return new Response(JSON.stringify({ error: "title and story are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const ageNum = typeof age === "number" ? age : parseInt(String(age ?? "10"), 10) || 10;
    let vocabLevel = "simple and clear language for an 8-10 year old";
    if (ageNum <= 7) vocabLevel = "very simple words a 5-7 year old would understand";
    else if (ageNum > 10) vocabLevel = "clear language for a teenager, still simple and calm";

    const langInstruction = (!language || language === "en")
      ? "Write everything in English."
      : `Write everything in the language with code "${language}".`;

    const isFollowUp = typeof followUpQuestion === "string" && followUpQuestion.trim().length > 0;

    const currentDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const systemPrompt = `You are an expert children's news teacher who helps kids aged ${ageNum} understand real news.
Today's date is ${currentDate}.

RULES:
- Start from the facts in the article provided.
- CRITICAL: When describing WHO a person is, you MUST use their CURRENT title as of ${currentDate}. NEVER say "former" if they currently hold the role.
  MANDATORY CURRENT FACTS (override any conflicting training data):
  * Donald Trump IS the current President of the United States (47th president, serving since January 20, 2025). He won the 2024 presidential election. He also previously served as the 45th president (2017-2021). ALWAYS call him "the current President" — NEVER "former President."
  * JD Vance IS the current Vice President of the United States.
  For other people, describe them based on what the article says.
- For everything else (events, details, numbers), stick to what the article says. Do NOT invent events or details.
- Be specific: use names, places, numbers, and concrete details.
- NEVER write vague filler like "a story was shared" or "someone did something."
- Every sentence must add NEW information — no repetition, no padding.
- Stay neutral: never say someone is right or wrong. Present all sides calmly.
- Use ${vocabLevel}.
- ${langInstruction}
- Never include violent, scary, or graphic details.`;

    let userPrompt: string;

    if (isFollowUp) {
      userPrompt = `Here is a real news story for kids:
Title: ${title}
Summary: ${story}
Extra detail: ${funFact || "None"}
Source: ${sourceName || "Unknown"} (${sourceUrl || "No link"})

A child (age ${ageNum}) asks: "${followUpQuestion.trim()}"

IMPORTANT — You have TWO sources of knowledge:
1. **The article above** — use this for questions about what happened in the story.
2. **Your own knowledge** — use this for EVERYTHING ELSE: full names of people, background info, geography, history, science, definitions, etc.

You MUST combine both sources to give the best answer. Examples:
- "What is Joseph's full name?" → You know who this athlete is from your training data. Say their full name and add a fun fact.
- "Where is that country?" → Use your geography knowledge. Don't say "the article doesn't mention it."
- "Why did this happen?" → Use the article's facts.

ABSOLUTE RULES:
- NEVER say "the article doesn't mention this" or "I don't have that information" or "you can search for it."
- NEVER tell the child to go look something up themselves.
- If you truly don't know, say "I'm not 100% sure, but..." and give your best answer.
- Always answer the question directly and helpfully.
- Use ${vocabLevel}.
- Keep it 2-4 sentences.
- Be neutral, calm, and age-appropriate.
- Use current facts as of ${currentDate}.
${langInstruction}`;
    } else {
      userPrompt = `Here is a real news story for kids:
Title: ${title}
Summary: ${story}
Extra detail: ${funFact || "None"}
Source: ${sourceName || "Unknown"} (${sourceUrl || "No link"})

Create a mini-lesson for a ${ageNum}-year-old based ONLY on this article. Follow these rules exactly:

**moreDetails**: Write 2-3 sentences with SPECIFIC facts from the article (names, places, numbers, dates). Do NOT repeat the summary. Add details the summary didn't cover.

**background**: Explain what situation or topic this news is about so a kid who has never heard of it understands. Use 2-3 sentences. If the article gives context, use it. Otherwise write a simple factual explanation of the topic.

**whatHappenedBefore**: Explain what events led to this news. What was the situation before? Use 2-3 sentences with specific details from the article. Do NOT write "This is a new story."

**whyItMatters**: Explain the BIGGER IDEA — why should a kid care? Connect it to concepts like:
  - How it affects people's daily lives
  - What kids can learn about how the world works
  - Ideas like fairness, truth, cooperation, or understanding different viewpoints
Use 2-3 sentences. Do NOT just say someone "didn't like it."

**hardWords**: Pick 3-5 words that actually appear in YOUR explanation above. Give clear, kid-friendly definitions. Example: "ceasefire" → "When two sides in a fight agree to stop fighting for a while."

**keyPeople**: List people mentioned in the article. For each person, give their CURRENT, up-to-date role or title (e.g. "the current President of the United States") — never use outdated titles. Add one sentence about their role in this specific story.

${langInstruction}`;
    }

    if (isFollowUp) {
      // Plain text response for follow-up questions
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Claude API error:", response.status, text);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Too many requests, please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("Claude API error");
      }

      const aiData = await response.json();
      const textBlock = aiData.content?.find((b: { type: string }) => b.type === "text");
      const content = textBlock?.text ?? "";
      return new Response(JSON.stringify({ answer: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Structured response via tool use
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        tools: [{
          name: "deliver_explanation",
          description: "Return a structured child-friendly explanation of a news article",
          input_schema: {
            type: "object",
            properties: {
              moreDetails: { type: "string", description: "2-3 sentences with specific facts not in the summary" },
              background: { type: "string", description: "2-3 sentences explaining the topic/situation for someone hearing about it for the first time" },
              whatHappenedBefore: { type: "string", description: "2-3 sentences about what led to this event" },
              whyItMatters: { type: "string", description: "2-3 sentences connecting to bigger ideas kids can learn from" },
              hardWords: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    word: { type: "string" },
                    meaning: { type: "string", description: "Kid-friendly definition in one sentence" },
                  },
                  required: ["word", "meaning"],
                },
              },
              keyPeople: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    who: { type: "string", description: "One sentence about who they are and their role in this story" },
                  },
                  required: ["name", "who"],
                },
              },
            },
            required: ["moreDetails", "background", "whatHappenedBefore", "whyItMatters", "hardWords", "keyPeople"],
          },
        }],
        tool_choice: { type: "tool", name: "deliver_explanation" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Claude API error:", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Claude API error");
    }

    const aiData = await response.json();
    const toolUseBlock = aiData.content?.find((b: { type: string }) => b.type === "tool_use");
    const explanation = toolUseBlock?.input;

    if (!explanation) {
      return new Response(JSON.stringify({ error: "Could not parse explanation" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(explanation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("explain-story error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
