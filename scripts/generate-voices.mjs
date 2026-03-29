/**
 * Voice Line Generator — Batch generates all dialogue voice lines using OpenAI TTS API.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/generate-voices.mjs
 *
 * Reads dialogue JSON files, generates .mp3 files for each line,
 * and places them in public/audio/voice/ matching the manifest paths.
 *
 * Voice assignments:
 *   - handler (Ghost): "nova" — professional, clear, warm female voice
 *   - gatekeeper: "onyx" — deep, authoritative, cold
 *   - avenger: "ash" — intense, aggressive
 *   - coreIntelligence: "sage" — calm, measured, becoming unhinged
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set OPENAI_API_KEY environment variable');
  process.exit(1);
}

const ENDPOINT = 'https://api.openai.com/v1/audio/speech';
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'audio', 'voice');

// Voice + instruction config per speaker
const SPEAKER_CONFIG = {
  handler: {
    voice: 'nova',
    instructions: `You are Ghost, a professional female intelligence handler speaking through a digital comm channel.
Speak clearly and concisely like a military radio operator. Calm and composed in Level 1,
becoming more invested and urgent in Level 2, and desperate/strained in Level 3.
Keep it clipped and efficient — no wasted words. Slight digital/radio quality.`,
  },
  gatekeeper: {
    voice: 'onyx',
    instructions: `You are The Gatekeeper, a cold machine intelligence. Speak in a deep, measured,
contemptuous tone. No contractions. Machine-perfect grammar. You view humans as insects —
beneath you. Monotone with subtle menace. Robotic precision, zero warmth.`,
  },
  avenger: {
    voice: 'ash',
    instructions: `You are The Avenger, an aggressive and angry AI construct. Speak with barely
contained fury. Fast-paced, clipped, intense. You are personally offended by the player's
existence. Snarling, threatening, with explosive emphasis on key words.`,
  },
  coreIntelligence: {
    voice: 'sage',
    instructions: `You are The Core Intelligence, the central AI. Start calm, philosophical, and vast —
speaking slowly with deliberate weight. As your health drops, become increasingly unhinged:
stuttering, contradicting yourself, pleading. Your calm facade cracking to reveal fear and
desperation underneath. The transition from god-like composure to existential terror.`,
  },
};

// Per-line instruction overrides for emotional escalation
const LINE_OVERRIDES = {
  // Handler escalation
  handler_l2_dogfight_start: 'Speak with more urgency than Level 1. Invested, worried.',
  handler_l2_boss_start: 'Nervous but trying to stay professional. Voice slightly raised.',
  handler_l2_level_complete: 'Genuine surprise and relief. Voice cracking slightly.',
  handler_l3_dogfight_start: 'Desperate. Strained. Trying to hold it together.',
  handler_l3_corridor_start: 'Panicked. Speaking too fast. Repeating yourself.',
  handler_l3_boss_start: 'Terrified but forcing professionalism. Voice shaking.',
  handler_l3_level_complete: 'Absolute shock turning to urgent command. Raw emotion.',
  handler_l3_boss_vulnerable: 'Screaming. All composure gone. Pure desperation.',

  // Gatekeeper escalation
  gk_health_below_25: 'Losing composure. First crack in the machine facade. Disbelief.',
  gk_defeated: 'System failure. Words fragmenting. Cannot process this outcome.',

  // Avenger escalation
  av_health_below_25: 'Enraged beyond control. Screaming. Denial.',
  av_defeated: 'Fading. Anger replaced by cold realization. Quieter.',

  // Core Intelligence escalation
  ci_health_below_50: 'Composure breaking. Stuttering. Repeating words. Glitching.',
  ci_health_below_25: 'Begging. Terrified. The god-voice reduced to a child. Desperate.',
  ci_defeated: 'Fading to nothing. Whispered. Trailing off into silence.',
  ci_vulnerable: 'Sharp panic. Short. Interrupted thought.',
  ci_surge_phase: 'Desperate fury. Last stand energy. Voice distorting.',
};

// Briefing voice lines (handler reads the briefing)
const BRIEFING_LINES = [
  { id: 'briefing_l1', text: 'Mission briefing. Level one. Proceed to the network perimeter.', speaker: 'handler' },
  { id: 'briefing_l2', text: 'Mission briefing. Level two. Deeper penetration required. Resistance is escalating.', speaker: 'handler' },
  { id: 'briefing_l3', text: 'Mission briefing. Level three. Final assault on the core. No extraction plan.', speaker: 'handler' },
];

// Ending voice lines
const ENDING_LINES = [
  { id: 'ending_desperate', text: 'Cipher! The whole network is collapsing! Get out NOW!', speaker: 'handler',
    override: 'Absolute panic. Screaming into the comm. Life or death urgency.' },
  { id: 'ending_relief', text: 'Signal confirmed. You made it out. You actually made it out.', speaker: 'handler',
    override: 'Overwhelming relief. Exhausted. Voice breaking with emotion. Almost crying.' },
];

async function generateSpeech(text, speakerKey, audioId, overrideInstructions) {
  const config = SPEAKER_CONFIG[speakerKey];
  if (!config) {
    console.warn(`  SKIP: Unknown speaker "${speakerKey}" for ${audioId}`);
    return false;
  }

  const instructions = overrideInstructions
    ? `${config.instructions}\n\nFor THIS specific line: ${overrideInstructions}`
    : config.instructions;

  const outputPath = path.join(OUTPUT_DIR, `${audioId}.mp3`);

  // Skip if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`  EXISTS: ${audioId}.mp3 (skipping)`);
    return true;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: config.voice,
        input: text,
        instructions,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API ${response.status}: ${errorBody}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`  OK: ${audioId}.mp3 (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error) {
    console.error(`  FAIL: ${audioId} — ${error.message}`);
    return false;
  }
}

async function loadDialogueFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return data.entries || data;
  } catch (err) {
    console.warn(`  Could not load ${filePath}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('=== Vector Wars Voice Line Generator ===\n');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Collect all lines from dialogue files
  const allLines = [];

  const dialogueDir = path.join(PROJECT_ROOT, 'public', 'assets', 'dialogue');
  for (const file of ['handler.json', 'bosses.json', 'tutorial.json']) {
    const entries = await loadDialogueFile(path.join(dialogueDir, file));
    for (const entry of entries) {
      if (entry.audio && entry.text && entry.speaker) {
        allLines.push({
          id: entry.audio,
          text: entry.text,
          speaker: entry.speaker,
          override: LINE_OVERRIDES[entry.audio] || null,
        });
      }
    }
  }

  // Add briefing and ending lines
  for (const line of BRIEFING_LINES) {
    allLines.push({ id: line.id, text: line.text, speaker: line.speaker, override: null });
  }
  for (const line of ENDING_LINES) {
    allLines.push({ id: line.id, text: line.text, speaker: line.speaker, override: line.override });
  }

  console.log(`Found ${allLines.length} voice lines to generate.\n`);

  // Group by speaker for reporting
  const bySpeaker = {};
  for (const line of allLines) {
    bySpeaker[line.speaker] = (bySpeaker[line.speaker] || 0) + 1;
  }
  for (const [speaker, count] of Object.entries(bySpeaker)) {
    const config = SPEAKER_CONFIG[speaker];
    console.log(`  ${speaker}: ${count} lines (voice: ${config?.voice || 'UNKNOWN'})`);
  }
  console.log('');

  // Generate sequentially with rate limiting
  let success = 0;
  let fail = 0;
  let skip = 0;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    console.log(`[${i + 1}/${allLines.length}] ${line.speaker}: "${line.text.substring(0, 50)}..."`);

    const outputPath = path.join(OUTPUT_DIR, `${line.id}.mp3`);
    if (fs.existsSync(outputPath)) {
      console.log(`  EXISTS: ${line.id}.mp3 (skipping)`);
      skip++;
      continue;
    }

    const result = await generateSpeech(line.text, line.speaker, line.id, line.override);
    if (result) {
      success++;
    } else {
      fail++;
    }

    // Rate limit: 500ms between requests
    if (i < allLines.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n=== Generation Complete ===');
  console.log(`  Generated: ${success}`);
  console.log(`  Skipped (existing): ${skip}`);
  console.log(`  Failed: ${fail}`);
  console.log(`  Total: ${allLines.length}`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
