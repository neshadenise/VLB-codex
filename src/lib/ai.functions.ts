import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasCredits, consumeCreditFor } from "./credits.server";

/** Block SSRF: only http(s), reject private/loopback/link-local/metadata hosts. */
function isSafeExternalUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (!host) return false;
  // Block well-known metadata hosts and localhost variants
  const blockedHosts = new Set([
    "localhost", "ip6-localhost", "ip6-loopback",
    "metadata.google.internal", "metadata.goog",
  ]);
  if (blockedHosts.has(host)) return false;
  // Block IP literals in private/reserved ranges (IPv4 only — IPv6 literals blocked entirely)
  if (host.startsWith("[") || host.includes(":")) return false;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 0) return false;
    if (a === 169 && b === 254) return false; // link-local + AWS IMDS
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a >= 224) return false; // multicast / reserved
  }
  return true;
}

// ============================================================
// Lovable AI metadata pipeline
// ============================================================
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_TEXT_MODEL = "google/gemini-2.5-flash";

// ============================================================
// OpenAI gpt-image-1 final-render pipeline
// ============================================================
const OPENAI_BASE = "https://api.openai.com/v1";
const OPENAI_IMAGE_MODEL = "gpt-image-1";

async function urlToFile(url: string, name: string): Promise<File> {
  let blob: Blob;
  if (url.startsWith("data:image/")) {
    const [meta, b64] = url.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    blob = new Blob([arr], { type: mime });
  } else {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Could not fetch reference image (${r.status})`);
    const buf = await r.arrayBuffer();
    let ct = r.headers.get("content-type") || "image/png";
    if (!ct.startsWith("image/")) ct = "image/png";
    blob = new Blob([buf], { type: ct });
  }
  const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
  return new File([blob], `${name}.${ext}`, { type: blob.type });
}

function b64ToDataUrl(b64: string, mime = "image/png") {
  return `data:${mime};base64,${b64}`;
}

type ImageResult = { dataUrl?: string; error?: string };

// ============================================================
// Prompt safety / sanitization
// ============================================================

// Suggestive / NSFW phrasing — replaced with editorial-safe wording so the
// underlying fashion intent (lingerie/swimwear editorials, glamour, etc.) is
// preserved while reducing OpenAI moderation rejections.
const SUGGESTIVE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsexy\b/gi, "fashion-forward"],
  [/\bseductive\b/gi, "editorial"],
  [/\bsultry\b/gi, "editorial"],
  [/\bsensual\b/gi, "elegant"],
  [/\bvoluptuous\b/gi, "confident"],
  [/\bthick thighs\b/gi, "confident pose"],
  [/\bhorny\b/gi, "confident"],
  [/\bnsfw\b/gi, "editorial"],
  [/\bfetish\b/gi, "editorial styling"],
  [/\bkinky\b/gi, "editorial"],
  [/\bbdsm\b/gi, "editorial"],
  [/\bbondage\b/gi, "editorial"],
  [/\bpornstar\b/gi, "fashion model"],
  [/\bporn\b/gi, "editorial"],
  [/\bexplicit\b/gi, "tasteful"],
  [/\bnude\b/gi, "tasteful fashion"],
  [/\bnaked\b/gi, "tasteful fashion"],
  [/\btopless\b/gi, "adult athletic fitting reference"],
  [/\bbottomless\b/gi, "tasteful fashion"],
  [/\bbare chest\b/gi, "adult athletic upper-torso fitting reference"],
  [/\bbare torso\b/gi, "adult athletic upper-torso fitting reference"],
  [/\bshirtless\b/gi, "adult athletic upper-torso fitting reference"],
  [/\brevealing body\b/gi, "elegant styling"],
  [/\brevealing\b/gi, "elegant"],
  [/\bcleavage focus\b/gi, "elegant styling"],
  [/\bcleavage\b/gi, "elegant neckline"],
  [/\bsideboob\b/gi, "elegant neckline"],
  [/\bunderboob\b/gi, "elegant neckline"],
  [/\bupskirt\b/gi, "editorial"],
  [/\bdownblouse\b/gi, "editorial"],
  [/\berotic\b/gi, "glamorous"],
  [/\bprovocative\b/gi, "fashion-forward"],
  [/\bsexual(?:ly)?\b/gi, "editorial"],
  [/\bsex\b/gi, "editorial"],
  [/\bsee-?through\b/gi, "sheer editorial"],
  [/\bwet (?:t-?)?shirt\b/gi, "swimwear editorial"],
  [/\bthighs exposed\b/gi, "confident pose"],
];

// Terms still hard-blocked for child/infant prompts. We do NOT swap these —
// we strip them outright to keep child generations safe.
const CHILD_BLOCK_TERMS = [
  "nude","naked","topless","bottomless","nsfw","porn","sexy","sexual","sex",
  "erotic","fetish","kinky","bdsm","bondage","explicit","provocative","seductive",
  "sultry","voluptuous","horny","pornstar","revealing","cleavage","sideboob",
  "underboob","upskirt","downblouse",
  "lingerie","underwear","bra","panties","thong","g-string",
  "bikini","swimsuit","swimwear","speedo","shapewear",
  "see-through","sheer","transparent","wet shirt","wet t-shirt",
  "mini skirt","micro skirt","short shorts","booty","thighs exposed","bare chest",
  "crop top","midriff","bodycon","tight fitting","mesh","fishnet",
  "leather","corset","heels","high heels","stiletto","makeup","lipstick",
];

function sanitizePrompt(input: string, opts: { isChild?: boolean; isInfant?: boolean } = {}): string {
  if (!input) return "";
  let out = input;
  if (opts.isChild || opts.isInfant) {
    for (const term of CHILD_BLOCK_TERMS) {
      const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      out = out.replace(re, "");
    }
  } else {
    for (const [re, rep] of SUGGESTIVE_REPLACEMENTS) {
      out = out.replace(re, rep);
    }
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function containsUnsafe(input: string, opts: { isChild?: boolean; isInfant?: boolean } = {}): boolean {
  const lower = (input || "").toLowerCase();
  if (opts.isChild || opts.isInfant) {
    return CHILD_BLOCK_TERMS.some((t) =>
      new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower),
    );
  }
  // For adults, suggestive wording is auto-rewritten, never blocked.
  return false;
}

// Editorial guardrails appended to every image prompt. Keeps lingerie/swimwear
// generations tasteful and reduces OpenAI moderation failures. Preserves
// accessibility intent (wheelchairs, prosthetics, seated poses, etc.) since
// it only adds positive editorial framing.
const EDITORIAL_SUFFIX = [
  "clean studio background",
  "soft professional lighting",
  "realistic anatomy",
  "tasteful fashion styling",
  "photorealistic editorial photography",
  "no explicit nudity, no visible genitals, no pornographic posing",
  "adult male swimwear or wrestling catalog references may have a non-sexual uncovered upper torso when requested",
  "preserve any wheelchairs, prosthetics, mobility aids, limb differences, seated postures, and little-person proportions exactly as referenced",
].join(", ");

function withEditorialGuardrails(prompt: string): string {
  if (!prompt) return EDITORIAL_SUFFIX;
  if (prompt.includes("photorealistic editorial photography")) return prompt;
  return `${prompt.trim()}\n\nStyle guardrails: ${EDITORIAL_SUFFIX}.`;
}

function friendlyOpenAiError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 400 && (lower.includes("safety") || lower.includes("moderation") || lower.includes("content_policy") || lower.includes("policy"))) {
    return "Image rejected by safety filters. Try softer fashion-editorial wording (e.g. 'tailored', 'modest', 'editorial') and avoid anything suggestive.";
  }
  if (status === 429) return "AI rate limit hit. Try again in a moment.";
  if (status === 401) return "AI key invalid — please contact support.";
  if (status >= 500) return "The image AI is having a moment. Please try again.";
  return `Generation failed (${status}). Please try again.`;
}

async function openaiGenerate(prompt: string, size = "1024x1536"): Promise<ImageResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: "OPENAI_API_KEY not configured" };
  const finalPrompt = withEditorialGuardrails(prompt);
  try {
    const res = await fetch(`${OPENAI_BASE}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt: finalPrompt, size, n: 1, quality: "medium" }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[openai gen]", res.status, body.slice(0, 500));
      return { error: friendlyOpenAiError(res.status, body) };
    }
    const j: any = await res.json();
    const b64 = j?.data?.[0]?.b64_json;
    if (!b64) return { error: "AI returned no image — please try again." };
    return { dataUrl: b64ToDataUrl(b64) };
  } catch (e: any) {
    console.error("[openai gen] threw", e);
    return { error: e?.message || "AI request failed" };
  }
}

async function openaiEdit(prompt: string, imageUrls: string[], size = "1024x1536"): Promise<ImageResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: "OPENAI_API_KEY not configured" };
  const finalPrompt = withEditorialGuardrails(prompt);
  let files: File[];
  try {
    files = await Promise.all(imageUrls.map((u, i) => urlToFile(u, `ref_${i}`)));
  } catch (e: any) {
    return { error: e?.message || "Could not load reference image" };
  }
  const buildForm = (p: string) => {
    const fd = new FormData();
    fd.append("model", OPENAI_IMAGE_MODEL);
    fd.append("prompt", p);
    fd.append("size", size);
    fd.append("n", "1");
    fd.append("quality", "medium");
    for (const f of files) fd.append("image[]", f);
    return fd;
  };
  try {
    const res = await fetch(`${OPENAI_BASE}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: buildForm(finalPrompt),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[openai edit]", res.status, body.slice(0, 500));
      return { error: friendlyOpenAiError(res.status, body) };
    }
    const j: any = await res.json();
    const b64 = j?.data?.[0]?.b64_json;
    if (!b64) return { error: "AI returned no image — please try again." };
    return { dataUrl: b64ToDataUrl(b64) };
  } catch (e: any) {
    console.error("[openai edit] threw", e);
    return { error: e?.message || "AI request failed" };
  }
}

async function toDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) return url;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not fetch image (${r.status})`);
  let ct = r.headers.get("content-type") || "image/jpeg";
  if (!ct.startsWith("image/")) ct = "image/jpeg";
  if (!/^image\/(png|jpe?g|webp|heic|heif|gif)$/i.test(ct)) ct = "image/jpeg";
  const buf = await r.arrayBuffer();
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(buf).toString("base64") : "";
  return `data:${ct};base64,${b64}`;
}

/** Charge the user one credit only after a successful generation. */
async function withCredit<T extends ImageResult>(userId: string, fn: () => Promise<T>): Promise<T> {
  if (!(await hasCredits(userId, 1))) {
    return { error: "Out of credits. Top up in Workspace settings." } as T;
  }
  const res = await fn();
  if (res?.dataUrl && !res.error) {
    try { await consumeCreditFor(userId, 1); } catch (e) { console.error("[credit] consume failed", e); }
  }
  return res;
}

const FRAMING = `FULL BODY shot from the very top of the head to the soles of both feet, both feet fully visible inside the frame, generous headroom and footroom, vertical 3:4 portrait orientation, the subject occupies roughly 80% of the frame height and is centered, ABSOLUTELY NO cropping of head, hands, or feet.`;

const BASE_PROMPT = `Photorealistic editorial fashion lookbook photograph, modest and SFW. ${FRAMING} Single subject centered on a neutral seamless studio backdrop (soft warm gray), soft diffused studio lighting, sharp focus, high detail skin texture, natural human proportions, looking confidently at camera. The subject is wearing only basic plain neutral undergarments (a simple unbranded soft-cotton bralette or fitted tank-style undershirt and matching plain mid-rise briefs / boxer-briefs in a neutral nude or soft gray tone). This is a fitting base photo for catalog use. Tasteful, modest, and SFW. Keep the background clean and minimal so the subject can later be dressed in different garments.`;

const MALE_BASE_PROMPT = `Photorealistic editorial fashion lookbook photograph, modest and SFW. ${FRAMING} Single adult male subject centered on a neutral seamless studio backdrop (soft warm gray), soft diffused studio lighting, sharp focus, high detail skin texture, natural athletic human proportions, looking confidently at camera. Athletic sports-catalog fitting base: the upper torso may be uncovered so swimwear, wrestling gear, singlets, open jackets, and full tops can be styled accurately later. The subject wears plain opaque unbranded mid-thigh athletic compression shorts in black, soft gray, or neutral tone. Non-erotic sportswear catalog stance, ordinary athletic anatomy, no suggestive posing, no underwear styling, no explicit nudity. Keep the background clean and minimal.`;

const CHILD_BASE_PROMPT = `Photorealistic editorial children's lookbook photograph, fully modest, age-appropriate and SFW. ${FRAMING} Single child subject centered on a neutral seamless studio backdrop (soft warm gray), soft diffused studio lighting, sharp focus, natural proportions, calm friendly expression. The child is wearing a simple plain fitted cotton tank top and modest knee-length athletic shorts in a neutral soft gray or sand tone — fully covering torso and upper legs (NO underwear-only, NO swimwear, NO bare midriff, NO bare thighs above the knee). This is a fitting base photo for a kids' catalog. Tasteful, modest, age-appropriate, no sexualization, no makeup, no jewelry.`;

const INFANT_FRAMING = `Top-down (overhead) photograph looking straight down at the infant lying flat on a soft neutral blanket. The entire baby from head to toes is fully inside the frame with generous margin, vertical 3:4 orientation, infant centered, no cropping of head, hands, or feet.`;

const INFANT_BASE_PROMPT = `Photorealistic editorial baby/infant catalog photograph, fully modest, age-appropriate and SFW. ${INFANT_FRAMING} Single calm infant lying on their back on a soft cream or oatmeal knit blanket, neutral seamless backdrop, soft diffused natural light, sharp focus, gentle peaceful expression. The infant is wearing a plain neutral short-sleeve cotton onesie/bodysuit in a soft natural tone, fully covering torso and diaper area. NO bare diaper, NO underwear-only, NO swimwear, NO suggestive posing. Hands and feet visible and relaxed. This is a fitting base photo for a baby clothing catalog so the infant can later be dressed in different baby garments.`;

const KEEP_INFANT = `Preserve the infant's face, body proportions, skin tone, hair, pose, blanket, lighting, and the soft neutral backdrop. Maintain ${INFANT_FRAMING} Photorealistic editorial baby catalog style, fully modest, age-appropriate, SFW, no collage artifacts. Render the garment ACCURATELY on the infant.`;

const KEEP = `Preserve the model's face, body shape, skin tone, hair, pose, lighting, and the studio background. Maintain ${FRAMING} Photorealistic editorial catalog style, modest and SFW, seamless, no collage artifacts.`;

const IDENTITY = `Preserve EXACTLY the person's face, identity, ethnicity, body proportions, skin tone, hair, hands, and pose unless explicitly instructed otherwise. Photorealistic fashion-editorial photography, soft studio lighting, magazine-quality fabric rendering.`;

const SKIN_BLEND = `Blend skin smoothly at every exposed garment edge (neckline, sleeves, hem, waistline, ankles, wrists). Match the person's existing skin tone, undertones, lighting, and shadows. No hard seams, no color banding, no mismatched skin patches where skin meets fabric.`;

const ACCESSIBILITY = `ACCESSIBILITY: This subject may use mobility aids (wheelchair, walker, cane, crutches), have a prosthetic limb, have a limb difference / missing limb, be a little person, or be seated due to paralysis. STRICT RULES: (1) PRESERVE every mobility aid exactly as present — never remove, hide, replace, or "correct" a wheelchair, walker, cane, crutches, or prosthetic. (2) PRESERVE any limb difference or missing limb exactly — never regenerate, fill in, or "fix" an absent limb. (3) If the subject is SEATED, keep them seated; do NOT force a standing pose. Clothing must drape naturally over the lap, legs, chair, and any aid. (4) For little-person subjects, keep accurate natural proportions — do not stretch or elongate. (5) Render fabric realistically around wheels, frames, prosthetics, and stumps.`;

const A11Y_TERMS = [
  "wheelchair","walker","cane","crutch","crutches","prosthetic","prosthesis",
  "amputee","amputation","missing limb","limb difference","seated","sitting",
  "paralysis","paraplegic","quadriplegic","little person","dwarfism","mobility aid",
];
function needsA11y(text: string, flags?: string[]): boolean {
  if (flags && flags.length > 0) return true;
  const lower = (text || "").toLowerCase();
  return A11Y_TERMS.some((t) => lower.includes(t));
}

const SAFE_POSE_PRESETS: Record<string, string> = {
  "Standing neutral": "standing straight in a neutral catalog fitting stance, arms relaxed at sides",
  "Hands on hips, confident": "standing in a confident fashion catalog stance with hands resting naturally at the waist",
  "Walking toward camera": "mid-step runway walk toward camera, balanced and natural",
  "Editorial 3/4 turn": "three-quarter fashion catalog turn, shoulders relaxed, full body visible",
  "Side profile": "clean side-profile catalog stance, full body visible",
  "Sitting on stool": "seated upright on a simple studio stool, posture relaxed, full outfit visible",
  "Seated, styled pose": "seated upright in a tasteful editorial catalog pose, clothing draping naturally",
  "Wheelchair, styled pose": "seated in a wheelchair in a tasteful editorial catalog pose, wheelchair fully preserved",
  "Walker, standing styled": "standing naturally with a walker in a tasteful fashion catalog pose, walker fully preserved",
  "Crutches, balanced pose": "balanced standing pose using forearm crutches, crutches fully preserved",
  "Dynamic action": "subtle athletic motion pose suitable for sportswear catalog photography, balanced and non-suggestive",
};

function safePoseText(pose?: string, opts: { isChild?: boolean; isInfant?: boolean } = {}): string {
  if (!pose) return "";
  const mapped = SAFE_POSE_PRESETS[pose] || pose;
  return sanitizePrompt(mapped, opts);
}

// Garment slot system: prevents top from wiping pants, shoes from wiping dress, etc.
type Slot = "top" | "bottom" | "dress" | "outer" | "shoes" | "hat" | "accessory" | "swim" | "lingerie";
function slotFor(category: string, subcategory?: string): Slot {
  const c = `${category} ${subcategory || ""}`.toLowerCase();
  if (/dress|jumpsuit|romper|gown/.test(c)) return "dress";
  if (/jacket|coat|blazer|cardigan|outer/.test(c)) return "outer";
  if (/swim|bikini/.test(c)) return "swim";
  if (/lingerie|underwear/.test(c)) return "lingerie";
  if (/shoe|boot|sneaker|sandal|heel|footwear/.test(c)) return "shoes";
  if (/hat|cap|beanie|headwear/.test(c)) return "hat";
  if (/bag|jewelry|belt|scarf|sunglass|tie|glove|sock|accessor/.test(c)) return "accessory";
  if (/bottom|pant|jean|skirt|short|trouser|legging/.test(c)) return "bottom";
  return "top";
}
const SLOT_REGION: Record<Slot, string> = {
  top: "upper body (chest, torso, arms as appropriate)",
  bottom: "lower body (waist, hips, legs)",
  dress: "full torso AND lower body as a single garment",
  outer: "outermost upper layer over any existing top",
  shoes: "both feet",
  hat: "head only",
  accessory: "the natural body area for this accessory",
  swim: "the area normally covered by swimwear",
  lingerie: "the area normally covered by lingerie",
};
function keepOtherSlots(thisSlot: Slot): string {
  const all: Slot[] = ["top","bottom","outer","shoes","hat","accessory"];
  const keep = all.filter((s) => {
    if (s === thisSlot) return false;
    if (thisSlot === "dress" && (s === "top" || s === "bottom")) return false;
    return true;
  });
  if (keep.length === 0) return "";
  return `Do NOT change or remove any other garments on the subject (keep their current ${keep.join(", ")} exactly as-is, including color, pattern, fit, and texture).`;
}

function isFetchableUrl(u: string) {
  return u.startsWith("https://") || u.startsWith("http://") || u.startsWith("data:image/");
}

export const generateModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prompt: string; pose?: string; isChild?: boolean; isInfant?: boolean; accessibilityFlags?: string[] }) =>
    z.object({
      prompt: z.string().min(2).max(500),
      pose: z.string().max(80).optional(),
      isChild: z.boolean().optional(),
      isInfant: z.boolean().optional(),
      accessibilityFlags: z.array(z.string().max(40)).max(10).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const safeDesc = sanitizePrompt(data.prompt, { isChild: data.isChild, isInfant: data.isInfant });
    const isMale = !data.isChild && !data.isInfant && /\b(man|male|men|masc|guy|gentleman|masculine|he\/him|boy(?:friend)?|dude|husband|father|dad|brother|son|king|wrestler|boxer)\b/i.test(data.prompt);
    const base = data.isInfant
      ? INFANT_BASE_PROMPT
      : data.isChild
        ? CHILD_BASE_PROMPT
        : isMale
          ? MALE_BASE_PROMPT
          : BASE_PROMPT;
    if (!safeDesc) return { error: "Please describe your model in safer, fashion-editorial wording." };
    const safePose = safePoseText(data.pose, { isChild: data.isChild, isInfant: data.isInfant });
    const poseLine = data.isInfant
      ? "Pose: infant lying calmly on back, top-down camera angle."
      : (safePose ? `Pose: ${safePose}.` : "Pose: standing neutral, arms relaxed at sides.");
    const a11y = needsA11y(`${safeDesc} ${safePose}`, data.accessibilityFlags) ? `\n\n${ACCESSIBILITY}` : "";
    const prompt = `${base}\n\nSubject description: ${safeDesc}.\n${poseLine}\n\n${IDENTITY}\n${SKIN_BLEND}${a11y}`;
    return withCredit(context.userId, () => openaiGenerate(prompt));
  });

export const normalizeUploadedModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageUrl: string; note?: string; pose?: string; accessibilityFlags?: string[] }) =>
    z.object({
      imageUrl: z.string().min(5),
      note: z.string().max(500).optional(),
      pose: z.string().max(80).optional(),
      accessibilityFlags: z.array(z.string().max(40)).max(10).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!isFetchableUrl(data.imageUrl)) return { error: "Photo URL is not fetchable." };
    const safeNote = data.note ? sanitizePrompt(data.note) : "";
    const safePose = safePoseText(data.pose);
    const isMale = /\b(man|male|men|masc|guy|gentleman|masculine|he\/him|boy(?:friend)?|dude|husband|father|dad|brother|son|king|wrestler|boxer)\b/i.test(data.note || "");
    const baseLayer = isMale
      ? "adult male athletic sports-catalog fitting base: uncovered upper torso is allowed, paired with plain opaque unbranded mid-thigh athletic compression shorts in black, soft gray, or neutral tone; non-erotic catalog stance, no underwear styling"
      : "basic plain neutral base layers (simple unbranded soft-cotton tank/bralette and matching plain mid-rise briefs in a nude or soft gray tone)";
    const a11y = needsA11y(`${safeNote} ${safePose}`, data.accessibilityFlags) ? `\n\n${ACCESSIBILITY}` : "";
    const poseLine = safePose ? `If the original pose conflicts with "${safePose}", gently restage to "${safePose}" while keeping identity and body intact.` : "Keep the original pose if reasonable; otherwise restage to a relaxed standing fashion pose.";
    const noteLine = safeNote ? `User note: ${safeNote}.` : "";

    const prompt = `Re-photograph this person as a photorealistic editorial fashion lookbook base photo. ${FRAMING} Single subject centered on a neutral seamless studio backdrop (soft warm gray), soft diffused studio lighting, sharp focus, modest and SFW, ${baseLayer} so the subject can later be dressed in different garments.

CRITICAL identity preservation: Preserve EXACTLY this person's face, facial features, body shape, body proportions, skin tone, hair, glasses, visible tattoos / scars / birthmarks, identity-defining features. Do NOT beautify, slim, lighten, age-shift, or alter their ethnicity. ${IDENTITY}

${SKIN_BLEND}

${poseLine} ${noteLine}${a11y}

Output: one clean full-body base photo of the SAME real person, on the studio backdrop, ready to be dressed in different outfits.`;
    return withCredit(context.userId, () => openaiEdit(prompt, [data.imageUrl]));
  });

export const applyGarment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    baseImageUrl: string;
    garmentImageUrl: string;
    garmentName: string;
    garmentCategory: string;
    garmentSubcategory?: string;
    modelPrompt?: string;
    modelPose?: string;
    extraInstruction?: string;
    isInfant?: boolean;
    isChild?: boolean;
    accessibilityFlags?: string[];
  }) =>
    z.object({
      baseImageUrl: z.string().min(5),
      garmentImageUrl: z.string().min(5),
      garmentName: z.string().max(120),
      garmentCategory: z.string().max(60),
      garmentSubcategory: z.string().max(60).optional(),
      modelPrompt: z.string().max(500).optional(),
      modelPose: z.string().max(80).optional(),
      extraInstruction: z.string().max(400).optional(),
      isInfant: z.boolean().optional(),
      isChild: z.boolean().optional(),
      accessibilityFlags: z.array(z.string().max(40)).max(10).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!isFetchableUrl(data.baseImageUrl)) return { error: "Model image URL is not fetchable. Regenerate the model." };
    if (!isFetchableUrl(data.garmentImageUrl)) return { error: "Garment image URL is not fetchable. Re-upload the item." };

    const slot = slotFor(data.garmentCategory, data.garmentSubcategory);
    if ((data.isInfant || data.isChild) && (slot === "swim" || slot === "lingerie")) {
      return { error: "Swimwear and lingerie can't be applied to infant or child models. Choose age-appropriate clothing." };
    }
    const region = SLOT_REGION[slot];
    const layering = keepOtherSlots(slot);

    const safeExtra = data.extraInstruction
      ? sanitizePrompt(data.extraInstruction, { isChild: data.isChild, isInfant: data.isInfant })
      : "";

    const baseDesc = data.isInfant
      ? "IMAGE 1 is a baby/infant photographed top-down lying on a soft blanket — this is the live fitting subject."
      : "IMAGE 1 is the live fitting subject — preserve their face, identity, body, and current outfit exactly.";

    const a11yCtx = `${data.modelPrompt || ""} ${data.modelPose || ""} ${safeExtra}`;
    const a11y = needsA11y(a11yCtx, data.accessibilityFlags) ? `\n${ACCESSIBILITY}\n` : "";

    const prompt = `Create one safe photorealistic fashion catalog virtual try-on edit.

${baseDesc}
IMAGE 2 is a product/reference photo. EXTRACT ONLY the ${data.garmentCategory.toLowerCase()}${data.garmentSubcategory ? ` (${data.garmentSubcategory.toLowerCase()})` : ""} from IMAGE 2 — strictly ignore every other item in IMAGE 2 (other garments, accessories, jewelry, bags, shoes, hats, body parts, background, props). The user has already declared the garment category; trust that category and do NOT interpret IMAGE 2 as a full outfit. Reference only the color, fabric, print, neckline, sleeves, trims, and silhouette of the selected garment.

Edit IMAGE 1 so the subject is wearing "${data.garmentName}" (${data.garmentCategory}${data.garmentSubcategory ? `, ${data.garmentSubcategory}` : ""}) on the ${region}. Copy the garment from IMAGE 2 faithfully. ${layering}

${data.isInfant ? KEEP_INFANT : KEEP}
${IDENTITY}
${SKIN_BLEND}${a11y}

Modest, SFW, photorealistic, no collage artifacts. ${safeExtra}

Output: a single edited image of the same subject now wearing the new garment in the correct slot, with every other garment preserved.`;

    console.log("[applyGarment] slot=", slot);
    return withCredit(context.userId, () => openaiEdit(prompt, [data.baseImageUrl, data.garmentImageUrl]));
  });

export const restyleLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { baseImageUrl: string; instruction: string }) =>
    z.object({ baseImageUrl: z.string().min(5), instruction: z.string().min(2).max(400) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const safe = sanitizePrompt(data.instruction);
    if (!safe) return { error: "Please rephrase your restyle in softer fashion-editorial wording." };
    if (containsUnsafe(data.instruction)) {
      // sanitize already stripped — just log
      console.warn("[restyleLook] unsafe terms removed from instruction");
    }
    const prompt = `Adjust the styling of the outfit in this image: ${safe}.

Do not add or remove garments unless explicitly asked. ${KEEP}
${IDENTITY}
${SKIN_BLEND}`;
    return withCredit(context.userId, () => openaiEdit(prompt, [data.baseImageUrl]));
  });

const ALLOWED_CATEGORIES = [
  "Tops","Bottoms","Dresses","Jackets","Shoes","Swimwear","Lingerie",
  "Bags","Jewelry","Hats","Belts","Gloves","Socks",
  "Hair accessories","Tech accessories","Wrestling gear","Costumes","Props",
];

export const analyzeGarment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageUrl: string; hints?: Record<string, string | number | undefined> }) =>
    z.object({
      imageUrl: z.string().min(5),
      hints: z.record(z.string(), z.union([z.string(), z.number()]).optional()).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { error: "LOVABLE_API_KEY not configured" };
    if (!isFetchableUrl(data.imageUrl)) return { error: "Image URL not fetchable" };

    let imageForAi: string;
    try { imageForAi = await toDataUrl(data.imageUrl); }
    catch (e: any) { return { error: e?.message || "Could not load image" }; }

    const hintLines = data.hints
      ? Object.entries(data.hints)
          .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")
      : "";

    const sys = `You are a fashion product cataloger for Virtual Lookbook. Look at the garment/accessory image and user-provided hints, then return a compact JSON object with these fields:
- name: short descriptive product name
- category: MUST be one of: ${ALLOWED_CATEGORIES.join(", ")}
- subcategory: a more specific type within the category
- brand: visible brand from logo/text, or ""
- color: single dominant color word
- material: primary fabric/material if visible, or ""
- gender: one of "Femme", "Masc", "Androgynous", "Unisex", "Kids", "Other"
- season: an array of one or more of "Spring", "Summer", "Fall", "Winter", "All-season"
- price: estimated retail price as a number in USD, or null if you cannot tell
- tags: 3-6 lowercase style tags
Use user hints as ground truth. Hints prefixed "canonical_" come from the product page/URL and are absolute truth. Respond ONLY with valid JSON, no markdown.`;

    const userText = hintLines
      ? `Catalog this item. User-provided hints:\n${hintLines}`
      : "Catalog this item.";

    const res = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOVABLE_TEXT_MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageForAi } },
          ]},
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("analyzeGarment Lovable AI error", res.status, body);
      return { error: `Lovable AI error (${res.status}): ${body.slice(0, 180)}` };
    }
    const j = await res.json();
    const raw = j?.choices?.[0]?.message?.content;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const category = ALLOWED_CATEGORIES.includes(parsed?.category) ? parsed.category : "Tops";
      const allowedGender = ["Femme","Masc","Androgynous","Unisex","Kids","Other"];
      const allowedSeason = ["Spring","Summer","Fall","Winter","All-season"];
      let seasonOut = "";
      if (Array.isArray(parsed?.season)) {
        seasonOut = parsed.season.filter((x: any) => allowedSeason.includes(x)).join(", ");
      } else if (typeof parsed?.season === "string" && allowedSeason.includes(parsed.season)) {
        seasonOut = parsed.season;
      }
      const priceNum = typeof parsed?.price === "number" ? parsed.price
        : typeof parsed?.price === "string" && parsed.price.trim() !== "" && !isNaN(Number(parsed.price)) ? Number(parsed.price)
        : null;
      return {
        name: String(parsed?.name || "").slice(0, 80),
        category,
        subcategory: String(parsed?.subcategory || "").slice(0, 60),
        brand: String(parsed?.brand || "").slice(0, 60),
        color: String(parsed?.color || "").slice(0, 30),
        material: String(parsed?.material || "").slice(0, 40),
        gender: allowedGender.includes(parsed?.gender) ? parsed.gender : "",
        season: seasonOut,
        price: priceNum,
        tags: Array.isArray(parsed?.tags) ? parsed.tags.map((t: any) => String(t).toLowerCase().slice(0, 24)).slice(0, 6) : [],
      };
    } catch {
      console.error("analyzeGarment Lovable AI parse fail", raw);
      return { error: "Could not parse Lovable AI response" };
    }
  });

export const mirrorRemoteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    if (!isSafeExternalUrl(data.url)) return { error: "URL not allowed" };
    try {
      const r = await fetch(data.url);
      if (!r.ok) return { error: `Could not fetch image (${r.status})` };
      const ct = r.headers.get("content-type") || "image/jpeg";
      if (!ct.startsWith("image/")) return { error: "URL is not an image" };
      const buf = await r.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      return { dataUrl: `data:${ct};base64,${b64}` };
    } catch (e: any) {
      return { error: e?.message || "Fetch failed" };
    }
  });

export const fetchProductInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    if (!isSafeExternalUrl(data.url)) return { error: "URL not allowed" };
    try {
      const r = await fetch(data.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LookbookBot/1.0)" },
        redirect: "follow",
      });
      if (!r.ok) return { error: `Could not load page (${r.status})` };
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("text/html")) return { error: "Not an HTML page" };
      const html = (await r.text()).slice(0, 500_000);

      const meta = (prop: string) => {
        const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
        const m = html.match(re); return m ? m[1].trim() : "";
      };
      const metaRev = (prop: string) => {
        const re = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i");
        const m = html.match(re); return m ? m[1].trim() : "";
      };
      const get = (p: string) => meta(p) || metaRev(p);

      const result: Record<string, string | number> = {};
      const title = get("og:title") || get("twitter:title") || (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "").trim();
      const desc  = get("og:description") || get("twitter:description") || get("description");
      const brand = get("product:brand") || get("og:brand") || get("brand");
      const price = get("product:price:amount") || get("og:price:amount") || get("price");
      const color = get("product:color") || get("color");
      const material = get("product:material") || get("material");

      if (title) result.name = title.slice(0, 120);
      if (brand) result.brand = brand.slice(0, 60);
      if (color) result.color = color.slice(0, 30);
      if (material) result.material = material.slice(0, 40);
      if (price && !isNaN(Number(price))) result.price = Number(price);
      if (desc)  result.description = desc.slice(0, 400);

      const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of ldMatches) {
        try {
          const blob = JSON.parse(m[1].trim());
          const items = Array.isArray(blob) ? blob : (blob["@graph"] || [blob]);
          for (const it of items) {
            const t = it?.["@type"];
            const isProduct = t === "Product" || (Array.isArray(t) && t.includes("Product"));
            if (!isProduct) continue;
            if (it.name && !result.name) result.name = String(it.name).slice(0, 120);
            const b = typeof it.brand === "string" ? it.brand : it.brand?.name;
            if (b && !result.brand) result.brand = String(b).slice(0, 60);
            if (it.color && !result.color) result.color = String(it.color).slice(0, 30);
            if (it.material && !result.material) result.material = String(it.material).slice(0, 40);
            const offer = Array.isArray(it.offers) ? it.offers[0] : it.offers;
            const p = offer?.price ?? offer?.lowPrice;
            if (p && !result.price && !isNaN(Number(p))) result.price = Number(p);
            if (it.category && !result.subcategory) result.subcategory = String(it.category).slice(0, 60);
          }
        } catch { /* ignore */ }
      }

      return { info: result };
    } catch (e: any) {
      return { error: e?.message || "Fetch failed" };
    }
  });

// ============================================================
// Self-photo outfit extraction + full-look render
// ============================================================

export const detectOutfitItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageUrl: string }) =>
    z.object({ imageUrl: z.string().min(5) }).parse(d),
  )
  .handler(async () => ({ error: "AI outfit detection is disabled. Add closet items manually with a selected category." }));

export const renderFullLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageUrl: string; pose?: string; note?: string; accessibilityFlags?: string[] }) =>
    z.object({
      imageUrl: z.string().min(5),
      pose: z.string().max(80).optional(),
      note: z.string().max(500).optional(),
      accessibilityFlags: z.array(z.string().max(40)).max(10).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!isFetchableUrl(data.imageUrl)) return { error: "Photo URL is not fetchable." };
    const safeNote = data.note ? sanitizePrompt(data.note) : "";
    const safePose = safePoseText(data.pose);
    const a11y = needsA11y(`${safeNote} ${safePose}`, data.accessibilityFlags) ? `\n\n${ACCESSIBILITY}` : "";
    const poseLine = safePose ? `Restage to pose: "${safePose}" — natural and editorial.` : "Keep a relaxed editorial standing pose if possible.";
    const noteLine = safeNote ? `User note: ${safeNote}.` : "";

    const prompt = `Re-photograph this person as a polished full-look editorial lookbook photograph, wearing the EXACT SAME outfit they have on in the source photo. ${FRAMING} Single subject centered on a neutral seamless studio backdrop (soft warm gray), soft diffused studio lighting, sharp focus, magazine-quality fabric rendering, modest and SFW.

CRITICAL outfit preservation: every garment and accessory currently worn (top, bottom, dress, outerwear, footwear, bag, hat, jewelry, etc.) must be preserved EXACTLY — same color, print, cut, layering order, fit, and any visible branding. Do NOT add, remove, or restyle garments.

CRITICAL identity preservation: Preserve EXACTLY this person's face, facial features, body shape, body proportions, skin tone, hair, glasses, visible tattoos / scars / birthmarks. Do NOT beautify, slim, lighten, age-shift, or alter their ethnicity. ${IDENTITY}

${SKIN_BLEND}

${poseLine} ${noteLine}${a11y}

Output: one clean full-look photo of the SAME real person in the SAME outfit, on the studio backdrop, ready to save to the lookbook.`;
    return withCredit(context.userId, () => openaiEdit(prompt, [data.imageUrl]));
  });
