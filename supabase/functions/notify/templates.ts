const BASE_URL = "https://vestahairhub.vercel.app"

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>VestaHairHub</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#07070f;color:#e2e8f0}
    .wrap{max-width:600px;margin:0 auto;background:#111118;border-radius:20px;overflow:hidden;border:1px solid #1e1e2e}
    .hd{background:linear-gradient(135deg,#1a0900 0%,#2d1200 100%);padding:36px 40px;text-align:center}
    .logo{font-size:22px;font-weight:800;color:#C8851A;letter-spacing:-0.5px}
    .tagline{color:#9ca3af;font-size:13px;margin:6px 0 0}
    .body{padding:40px}
    .h1{font-size:26px;font-weight:700;color:#fff;margin:0 0 14px;line-height:1.3}
    .p{color:#94a3b8;line-height:1.65;margin:0 0 18px;font-size:15px}
    .btn{display:inline-block;background:#C8851A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.01em}
    .card{background:#1a1a2e;border:1px solid #2a2a42;border-radius:14px;padding:22px;margin:22px 0}
    .lbl{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 5px}
    .val{color:#fff;font-size:17px;font-weight:600;margin:0}
    .gold{color:#C8851A}
    .em{color:#e2e8f0;font-weight:600}
    .ft{padding:24px 40px;text-align:center;border-top:1px solid #1a1a2e}
    .ft p{color:#475569;font-size:12px;margin:4px 0}
    .ft a{color:#C8851A;text-decoration:none}
    .ctr{text-align:center;margin:28px 0}
    .row{margin-top:14px}
  </style>
</head>
<body>
<div style="padding:24px 16px">
  <div class="wrap">
    <div class="hd">
      <div class="logo">✨ VestaHairHub</div>
      <p class="tagline">Africa's Premier Beauty Marketplace</p>
    </div>
    ${content}
    <div class="ft">
      <p>© 2025 VestaHairHub · Africa's #1 Hair &amp; Beauty Marketplace</p>
      <p><a href="${BASE_URL}">vestahairhub.vercel.app</a> · <a href="${BASE_URL}/support">Support</a></p>
    </div>
  </div>
</div>
</body>
</html>`
}

export type EmailData = Record<string, unknown>

export function getEmailHtml(type: string, data: EmailData): string {
  switch (type) {

    case "welcome":
      return baseLayout(`
        <div class="body">
          <h1 class="h1">Welcome, ${data.user_name}! 🎉</h1>
          <p class="p">
            You've joined Africa's #1 beauty marketplace.
            ${data.role === "seller"
              ? "Your seller account is ready. Set up your shop and start reaching customers across Africa — for free!"
              : "Browse thousands of authentic African beauty products from verified sellers and get them delivered to your door."}
          </p>
          <div class="ctr">
            <a href="${BASE_URL}/${data.role === "seller" ? "dashboard" : "marketplace"}" class="btn">
              ${data.role === "seller" ? "🏪 Set Up My Shop" : "🛍️ Browse Products"}
            </a>
          </div>
          <div class="card">
            <p class="lbl">Account type</p>
            <p class="val">${data.role === "seller" ? "💼 Seller Account" : "🛍️ Buyer Account"}</p>
          </div>
          <p class="p" style="font-size:13px;margin-bottom:0">
            Questions? <a href="${BASE_URL}/support" class="gold">Visit our support page</a> or reply to this email — we're here to help.
          </p>
        </div>`)

    case "order_placed_seller":
      return baseLayout(`
        <div class="body">
          <h1 class="h1">New Order! 🎊</h1>
          <p class="p">Hi <span class="em">${data.seller_name}</span>, you have a new order from <span class="gold">${data.buyer_name}</span>. Log in to confirm the payment and process it.</p>
          <div class="card">
            <p class="lbl">Order ID</p>
            <p class="val" style="font-family:monospace">#${String(data.order_id).slice(0,8).toUpperCase()}</p>
            <div class="row">
              <p class="lbl">Total</p>
              <p class="val gold">${data.currency}${Number(data.total_amount).toLocaleString()}</p>
            </div>
            <div class="row">
              <p class="lbl">Shop</p>
              <p class="val">${data.shop_name}</p>
            </div>
            <div class="row">
              <p class="lbl">Customer</p>
              <p class="val">${data.buyer_name}</p>
            </div>
          </div>
          <div class="ctr">
            <a href="${BASE_URL}/dashboard/orders" class="btn">📦 View Order</a>
          </div>
          <p class="p" style="font-size:13px;margin-bottom:0">
            Once you confirm the payment, the order will move to processing. Remember to ship promptly!
          </p>
        </div>`)

    case "order_placed_buyer":
      return baseLayout(`
        <div class="body">
          <h1 class="h1">Order Submitted! ✅</h1>
          <p class="p">Hi <span class="em">${data.buyer_name}</span>, your order has been submitted to the seller. They'll review your payment reference and confirm shortly.</p>
          <div class="card">
            <p class="lbl">Order ID</p>
            <p class="val" style="font-family:monospace">#${String(data.order_id).slice(0,8).toUpperCase()}</p>
            <div class="row">
              <p class="lbl">Total</p>
              <p class="val gold">${data.currency}${Number(data.total_amount).toLocaleString()}</p>
            </div>
          </div>
          <p class="p">You'll receive another email once the seller confirms your payment. In the meantime, you can track your order:</p>
          <div class="ctr">
            <a href="${BASE_URL}/account/orders" class="btn">📋 Track My Order</a>
          </div>
        </div>`)

    case "order_status": {
      const statusEmoji: Record<string, string> = {
        payment_confirmed: "✅", processing: "⚙️", shipped: "🚚", delivered: "🎉", cancelled: "❌"
      }
      const emoji = statusEmoji[String(data.status)] ?? "📦"
      return baseLayout(`
        <div class="body">
          <h1 class="h1">${emoji} ${data.title}</h1>
          <p class="p">Hi <span class="em">${data.buyer_name}</span>, here's the latest update on your order.</p>
          <div class="card">
            <p class="lbl">Order ID</p>
            <p class="val" style="font-family:monospace">#${String(data.order_id).slice(0,8).toUpperCase()}</p>
            <div class="row">
              <p class="lbl">New Status</p>
              <p class="val gold">${String(data.status).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
            </div>
          </div>
          <p class="p">${data.body}</p>
          <div class="ctr">
            <a href="${BASE_URL}/account/orders" class="btn">📋 View Order</a>
          </div>
        </div>`)
    }

    default:
      return baseLayout(`
        <div class="body">
          <h1 class="h1">You have a new notification</h1>
          <p class="p">Log in to VestaHairHub to see the latest updates on your account.</p>
          <div class="ctr">
            <a href="${BASE_URL}" class="btn">Go to VestaHairHub</a>
          </div>
        </div>`)
  }
}
