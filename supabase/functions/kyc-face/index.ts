import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405)

  try {
    const body = (await req.json()) as Record<string, unknown>
    const { action, token } = body

    if (!token || typeof token !== "string") return respond({ error: "Missing token" }, 400)

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Look up KYC record by face_token (service_role bypasses RLS)
    const { data: kyc } = await adminClient
      .from("kyc_verifications")
      .select("id, seller_id, face_captured_at, status")
      .eq("face_token", token)
      .maybeSingle()

    // ── validate ─────────────────────────────────────────────────────────────
    if (action === "validate") {
      if (!kyc) return respond({ valid: false })
      return respond({ valid: true, already_captured: !!kyc.face_captured_at })
    }

    // ── submit ────────────────────────────────────────────────────────────────
    if (action === "submit") {
      if (!kyc)                return respond({ error: "Invalid token" },   404)
      if (kyc.face_captured_at) return respond({ error: "Already captured" }, 409)

      const imageBase64 = body.imageBase64 as string | undefined
      if (!imageBase64) return respond({ error: "Missing image" }, 400)

      // Decode base64 → Uint8Array
      const b64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const path = `${kyc.seller_id}/selfie-${Date.now()}.jpg`

      const { error: uploadErr } = await adminClient.storage
        .from("kyc-selfies")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: true })

      if (uploadErr) {
        console.error("selfie upload error:", uploadErr.message)
        return respond({ error: "Upload failed" }, 500)
      }

      const now = new Date().toISOString()
      const { error: updateErr } = await adminClient
        .from("kyc_verifications")
        .update({ selfie_path: path, face_captured_at: now, current_step: 4, updated_at: now })
        .eq("id", kyc.id)

      if (updateErr) {
        console.error("kyc update error:", updateErr.message)
        return respond({ error: "Update failed" }, 500)
      }

      return respond({ success: true })
    }

    return respond({ error: "Unknown action" }, 400)
  } catch (err) {
    console.error("kyc-face error:", err instanceof Error ? err.message : err)
    return respond({ error: "Internal server error" }, 500)
  }
})
