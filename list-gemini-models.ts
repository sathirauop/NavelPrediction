/**
 * List available Gemini models
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBQ6zopKRlpG9TWA7S09GgRpa7pK9ibRYQ";

  if (!apiKey) {
    console.log("❌ GEMINI_API_KEY not found");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("🔍 Fetching available Gemini models...\n");

    // Try to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      process.exit(1);
    }

    const data = await response.json();

    if (data.models && data.models.length > 0) {
      console.log(`✅ Found ${data.models.length} models:\n`);

      data.models.forEach((model: any) => {
        console.log(`📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName || "N/A"}`);
        console.log(`   Description: ${model.description || "N/A"}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
        console.log();
      });

      // Find models that support generateContent
      const contentGenModels = data.models.filter((m: any) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      console.log(`\n✅ Models that support generateContent (${contentGenModels.length}):`);
      contentGenModels.forEach((m: any) => {
        console.log(`   - ${m.name.replace("models/", "")}`);
      });

    } else {
      console.log("⚠️  No models found");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

listModels();
