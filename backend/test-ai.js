const OpenAI = require("openai");

async function testAi() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is missing in .env");
    return;
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log("Testing OpenAI connection...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'AI is working' if you hear me." }],
      temperature: 0.2,
    });
    console.log("Response from OpenAI:");
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("Error communicating with OpenAI:");
    console.error(err.message);
  }
}

testAi();
