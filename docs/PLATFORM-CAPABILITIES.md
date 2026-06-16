# Wiibi Energy — Platform Capabilities

_A short brief for framing the recent work. These aren't "extra features" bolted
onto a website — together they turn the site into an operating platform: a
storefront, a back-office, a customer-service desk, and a business-intelligence
layer, all integrated and owned in-house._

---

## The one-line pitch

> We didn't just add a store. We built the system that **runs the store** — orders,
> money, customers, and the data to make decisions — the kind of stack a company
> would normally buy as three separate SaaS products (Shopify + Zendesk + GA) and
> pay for monthly, forever.

---

## 1. Order Management System (the operations spine)

Not a "list of orders" — a full lifecycle engine.

- End-to-end order lifecycle: placed → processing → shipped → in-transit →
  delivered, with a customer-facing tracking timeline.
- **Money handled correctly:** real payment processing (Paystack), Pay-on-Delivery,
  delivery-fee rules, promo codes, and **refunds** — all transactional, so an order
  and its payment can never disagree.
- Guest **and** account checkout, with ownership enforced server-side (a stranger
  can't open someone else's order link).
- **Automated transactional emails** at every step (confirmation, payment receipt,
  shipped, delivered, cancelled, returns) — branded, multipart, industry-standard
  deliverability.

**Why it's heavy:** this is the part that, done wrong, loses money or double-charges
customers. It's built to not do that.

## 2. Support Desk (the customer-service layer)

A real two-way ticketing system, not a contact form.

- Customers open tickets and get a private inbox; staff reply from an admin desk.
- Two-way email threading — replies reach the right person automatically.
- Internal notes staff can see but customers can't.
- **Returns are first-class:** a customer "request a return" flows into the same
  system and connects to the actual refund.

**Why it's heavy:** this is Zendesk-shaped functionality. Most teams pay per-agent
for it.

## 3. Analytics & Business Intelligence (the decision layer)

- Dashboard: revenue, orders by status, traffic, unique visitors, top pages,
  customer stats — in one view.
- Built to scale: a nightly aggregation job means dashboards stay fast even as data
  grows (it doesn't re-count millions of rows on every load).
- **Privacy-compliant by design:** IPs are hashed, and a real cookie-consent system
  means a visitor who opts out of analytics is genuinely not tracked — front-end and
  back-end both enforce it. (This is the part that keeps the business out of trouble.)

## 4. The platform underneath

Things that don't show up as a "feature" but are why the above is solid:

- Payment-provider and file-storage **abstractions** (swap Paystack or move to cloud
  storage without rewrites).
- CMS-editable pages (marketing can change the site without a developer).
- Promotions / promo codes, cookie-consent compliance, role-based admin access.

---

## Perception: give it a home of its own

The admin is being moved to **admin.wiibienergy.com** — its own subdomain.

That's not cosmetic. It reframes what was perceived as "a settings tab" into what it
actually is: **an operations console**, a back-office product staff log into to run
the business. Same code, but it now *reads* as a platform — which is exactly the
point when explaining its value.

---

## How to present this

1. **Lead with the buy-vs-build framing.** "To get this off-the-shelf we'd run
   Shopify + Zendesk + an analytics tool — recurring cost, per-seat, and none of them
   talk to each other. We own this, it's integrated, and there's no monthly bill that
   scales with us."
2. **Anchor on risk, not just features.** The OMS and refunds are the difference
   between "we took an order" and "we took the money correctly and can prove it."
3. **Fill in your specifics:** hours/week saved on manual order/refund handling,
   support response time, decisions now made from the dashboard. (Numbers land harder
   than feature lists — add the ones you have.)
4. **Show, don't tell:** demo the admin subdomain live — place an order on the public
   site, watch it appear in the OMS, move it through statuses (emails fire), open a
   support ticket, then show the dashboard reflecting it. One continuous story.
