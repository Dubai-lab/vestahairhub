import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer@6.9.14"
import { getEmailHtml, type EmailData } from "./templates.ts"

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

function createTransporter() {
  return nodemailer.createTransport({
    host:   Deno.env.get("SMTP_HOST") ?? "mail.spacemail.com",
    port:   Number(Deno.env.get("SMTP_PORT") ?? "465"),
    secure: true, // SSL on port 465
    auth: {
      user: Deno.env.get("SMTP_USER") ?? "",
      pass: Deno.env.get("SMTP_PASS") ?? "",
    },
    tls: {
      rejectUnauthorized: false, // tolerate self-signed certs on shared hosting
    },
  })
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from:    `"VestaHairHub" <${Deno.env.get("SMTP_USER") ?? ""}>`,
    to,
    subject,
    html,
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405)

  try {
    // ── Validate caller JWT ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401)

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return respond({ error: "Invalid token" }, 401)

    // ── Parse payload ────────────────────────────────────────────────────────
    const payload = (await req.json()) as Record<string, unknown>
    const { type } = payload

    const toInsert: {
      user_id: string
      type: string
      title: string
      body: string
      data: Record<string, unknown>
    }[] = []

    const toEmail: { to: string; subject: string; html: string }[] = []

    // ── welcome ──────────────────────────────────────────────────────────────
    if (type === "welcome") {
      const email_to  = String(payload.email_to  ?? "")
      const user_name = String(payload.user_name ?? "")
      const role      = String(payload.role      ?? "buyer")

      toInsert.push({
        user_id: user.id,
        type: "welcome",
        title: "Welcome to VestaHairHub! 🎉",
        body: role === "seller"
          ? "Your seller account is ready. Set up your shop and start selling!"
          : "Welcome! Explore thousands of African beauty products.",
        data: { role },
      })

      if (email_to) {
        toEmail.push({
          to: email_to,
          subject: "Welcome to VestaHairHub! 🎉",
          html: getEmailHtml("welcome", { user_name, role } as EmailData),
        })
      }
    }

    // ── order_placed ─────────────────────────────────────────────────────────
    else if (type === "order_placed") {
      const order_id     = String(payload.order_id    ?? "")
      const shop_id      = String(payload.shop_id     ?? "")
      const total_amount = Number(payload.total_amount ?? 0)
      const buyer_name   = String(payload.buyer_name  ?? "Customer")

      const { data: shop } = await adminClient
        .from("shops")
        .select("name, seller_id, currency")
        .eq("id", shop_id)
        .single()

      const currency = String(shop?.currency ?? "USD")

      if (shop?.seller_id) {
        const { data: sellerAuth } = await adminClient.auth.admin.getUserById(shop.seller_id)
        const sellerEmail = sellerAuth?.user?.email ?? ""

        const { data: sellerProfile } = await adminClient
          .from("profiles")
          .select("full_name")
          .eq("id", shop.seller_id)
          .maybeSingle()
        const sellerName = sellerProfile?.full_name ?? "Seller"

        toInsert.push({
          user_id: shop.seller_id,
          type: "order_placed",
          title: "New order received! 🎊",
          body: `${buyer_name} placed an order for ${currency} ${total_amount.toLocaleString()}`,
          data: { order_id, shop_id, total_amount, currency, buyer_name },
        })

        if (sellerEmail) {
          toEmail.push({
            to: sellerEmail,
            subject: `New Order from ${buyer_name} — VestaHairHub`,
            html: getEmailHtml("order_placed_seller", {
              seller_name: sellerName,
              buyer_name,
              order_id,
              total_amount,
              currency,
              shop_name: shop.name,
            } as EmailData),
          })
        }
      }

      // Buyer confirmation
      const { data: buyerAuth } = await adminClient.auth.admin.getUserById(user.id)
      const buyerEmail = buyerAuth?.user?.email ?? ""

      toInsert.push({
        user_id: user.id,
        type: "order_confirmed",
        title: "Order submitted! ✅",
        body: "Your order has been submitted. The seller will confirm your payment shortly.",
        data: { order_id, total_amount, currency },
      })

      if (buyerEmail) {
        toEmail.push({
          to: buyerEmail,
          subject: "Order Submitted — VestaHairHub",
          html: getEmailHtml("order_placed_buyer", {
            buyer_name,
            order_id,
            total_amount,
            currency,
          } as EmailData),
        })
      }
    }

    // ── order_status_changed ─────────────────────────────────────────────────
    else if (type === "order_status_changed") {
      const order_id   = String(payload.order_id   ?? "")
      const new_status = String(payload.new_status ?? "")
      const buyer_id   = String(payload.buyer_id   ?? "")
      const buyer_name = String(payload.buyer_name ?? "Customer")

      if (!buyer_id || buyer_id === user.id) {
        return respond({ success: true })
      }

      const statusMessages: Record<string, { title: string; body: string }> = {
        payment_confirmed: {
          title: "Payment confirmed! ✅",
          body:  "Your payment has been confirmed. The seller is now preparing your order.",
        },
        processing: {
          title: "Order is being prepared ⚙️",
          body:  "Your order is now being processed and packed by the seller.",
        },
        shipped: {
          title: "Your order is on the way! 🚚",
          body:  "The seller has shipped your order. It's on its way to you!",
        },
        delivered: {
          title: "Order delivered! 🎉",
          body:  "Your order has been marked as delivered. We hope you love it!",
        },
        cancelled: {
          title: "Order cancelled",
          body:  "Your order has been cancelled. Contact the seller if this was unexpected.",
        },
      }

      const msg = statusMessages[new_status]
      if (msg) {
        toInsert.push({
          user_id: buyer_id,
          type: `order_${new_status}`,
          title: msg.title,
          body:  msg.body,
          data:  { order_id, status: new_status },
        })

        const { data: buyerAuth } = await adminClient.auth.admin.getUserById(buyer_id)
        const buyerEmail = buyerAuth?.user?.email ?? ""

        if (buyerEmail) {
          toEmail.push({
            to: buyerEmail,
            subject: `${msg.title} — VestaHairHub`,
            html: getEmailHtml("order_status", {
              buyer_name,
              order_id,
              status: new_status,
              title:  msg.title,
              body:   msg.body,
            } as EmailData),
          })
        }
      }
    }

    // ── message_received ─────────────────────────────────────────────────────
    else if (type === "message_received") {
      const seller_id       = String(payload.seller_id       ?? "")
      const sender_name     = String(payload.sender_name     ?? "Someone")
      const preview         = String(payload.preview         ?? "")
      const conversation_id = String(payload.conversation_id ?? "")

      if (!seller_id || seller_id === user.id) {
        return respond({ success: true })
      }

      const truncated = preview.length > 100 ? preview.slice(0, 97) + "…" : preview

      toInsert.push({
        user_id: seller_id,
        type: "message_received",
        title: `New message from ${sender_name}`,
        body: truncated,
        data: { sender_id: user.id, sender_name, conversation_id },
      })
    }

    else {
      return respond({ error: `Unknown notification type: ${type}` }, 400)
    }

    // ── Persist notifications ────────────────────────────────────────────────
    if (toInsert.length > 0) {
      const { error: insertErr } = await adminClient.from("notifications").insert(toInsert)
      if (insertErr) console.error("Insert error:", insertErr.message)
    }

    // ── Send emails (each fails independently) ───────────────────────────────
    await Promise.allSettled(
      toEmail.map(async (e) => {
        try {
          await sendEmail(e.to, e.subject, e.html)
        } catch (err) {
          console.error(`Email failed → ${e.to}:`, err instanceof Error ? err.message : err)
        }
      }),
    )

    return respond({ success: true })
  } catch (err) {
    console.error("notify error:", err instanceof Error ? err.message : err)
    return respond({ error: "Internal server error" }, 500)
  }
})
