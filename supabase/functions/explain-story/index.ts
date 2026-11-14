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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

There are TWO kinds of questions:
1. **Article questions** (e.g. "Why did this happen?", "What did they agree on?") — answer using facts from the article.
2. **Background questions** (e.g. "Who is [person]?", "What is [country/concept]?", "Where is [place]?") — answer using your general knowledge. Give a simple, accurate, up-to-date explanation. Do NOT say "the article doesn't mention this." Instead, provide a helpful factual answer.

Rules:
- Always answer the question. Never refuse or deflect.
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

    const requestBody: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    if (!isFollowUp) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "deliver_explanation",
            description: "Return a structured child-friendly explanation of a news article",
            parameters: {
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
                    additionalProperties: false,
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
                    additionalProperties: false,
                  },
                },
              },
              required: ["moreDetails", "background", "whatHappenedBefore", "whyItMatters", "hardWords", "keyPeople"],
              additionalProperties: false,
            },
          },
        },
      ];
      requestBody.tool_choice = { type: "function", function: { name: "deliver_explanation" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();

    if (isFollowUp) {
      const content = aiData.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ answer: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let explanation;
    if (toolCall?.function?.arguments) {
      explanation = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: "Could not parse explanation" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      explanation = JSON.parse(jsonMatch[0]);
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
