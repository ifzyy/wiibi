# Wiibi Energy — Platform Overview

**What was built is not a set of pages. It is an operating platform for running a solar-energy retail business — storefront, payments, fulfilment, customer service, marketing, and a full operations console — built on production-grade foundations.**

This document explains the systems that now power the business, what each one does for you commercially, and why they constitute real infrastructure rather than surface-level features.

---

## 1. The platform at a glance

Wiibi Energy is now made up of **seven integrated systems**, each backed by its own data, business rules, and admin tooling:

| System | What it does for the business |
|---|---|
| **Orders & Payments** | Takes money safely, reserves stock, and runs every order through a controlled lifecycle from checkout to delivery. |
| **Customer Communications** | Automatically emails customers at every meaningful moment — payment, shipping, delivery, support replies. |
| **Support & Service Desk** | A two-way conversation system between customers and your team, with returns and refunds flowing through it. |
| **Promotions & Marketing** | An editable site-wide announcement banner and a discount-code engine applied at checkout. |
| **Analytics & Business Intelligence** | Live revenue, orders, traffic, and customer insight in one dashboard. |
| **Lead Generation (Solar CRM)** | The solar calculator captures qualified leads and feeds them into a sales pipeline. |
| **Admin Operations Console** | A single secure dashboard from which the entire business is run. |

These are not isolated widgets. They share one customer record, one order record, one authentication system, and one notification pipeline — which is precisely what makes it a *platform*.

---

## 2. The systems in depth

### Orders & Payments — the financial backbone
Every purchase moves through a strict, validated lifecycle: *pending → processing → shipped → in transit → delivered*, with cancellation and return paths. This is enforced by the system, not left to manual discipline.

What makes it infrastructure:
- **No overselling, ever.** When two customers try to buy the last item at the same moment, the system locks inventory at the database level and serves them in order — one succeeds, the other is told it's out of stock. There is no scenario where you sell stock you don't have.
- **Payments are tamper-proof and duplicate-proof.** The system independently verifies that the correct amount in the correct currency was actually collected before marking an order paid, and a repeated or replayed payment notification can never charge or fulfil twice.
- **Stock is reserved the instant an order is placed** and automatically returned if payment fails — so inventory always reflects reality.
- **Refunds are handled end to end**, including automatic gateway refunds and a managed queue for manual bank transfers, with a cap that prevents refunding more than was paid.

**Commercial value:** you can trust the numbers. Money in, stock out, and order state are always consistent — the foundation everything else is sold on top of.

---

### Customer Communications — an automated email pipeline
A dedicated transactional email system sends branded, professional emails automatically at each step: payment received, order shipped (with tracking), in transit, delivered, cancelled, returns, and support replies.

What makes it infrastructure:
- **A reusable email engine**, not one-off messages — every email shares branded templates with your logo, the customer's order summary, product images, totals, and shipping details.
- **Failure-isolated by design.** If the email provider is ever down, orders and payments still succeed — communications can never break a sale.
- **Provider-agnostic.** It runs on standard email infrastructure and can move from a basic account to an enterprise sending service (for high volume and deliverability) by changing configuration only — no rebuild.

**Commercial value:** customers are kept informed automatically, which reduces "where is my order?" support load and builds trust — and the business never has to send these emails by hand.

---

### Support & Service Desk — a real two-way service channel
Customers and staff hold actual conversations on tickets. Customers can open requests from anywhere on the site, see your replies, and respond — and your team manages everything from a unified desk.

What makes it infrastructure:
- **A complete ticketing system** with statuses, assignment, priorities, tags, internal staff-only notes, and a full message history.
- **A customer-facing inbox** where signed-in customers track and continue their conversations.
- **A site-wide support launcher** that lets customers reach you from any page — and, when their question is about an order, attaches the exact order automatically so your team has full context.
- **Returns flow through this system**: a customer requests a return on a delivered order, it arrives as a service request with the order attached, and your team processes the refund through the managed refund tools.
- **Email notifications** keep both sides moving without anyone having to refresh a page.

**Commercial value:** organised, accountable customer service that scales beyond a personal inbox — every request is tracked, nothing is lost, and returns are controlled.

---

### Promotions & Marketing — a discounting engine
An editable announcement banner runs across the site, and a promo-code system applies discounts at checkout.

What makes it infrastructure:
- **The banner is content-managed** — text, link, colours, and on/off — with a live preview, with no developer involvement.
- **A genuine discount engine**: percentage or fixed-amount codes, with minimum-order thresholds, maximum-discount caps, total usage limits, and expiry dates.
- **Discounts are calculated and enforced on the server**, so a code can never be forged or abused, and a limited-use code can't be over-redeemed even under heavy simultaneous traffic.
- Every order **records the discount and code used**, so promotional performance is fully auditable.

**Commercial value:** the business can run real campaigns and sales on demand — and measure them — without touching code.

---

### Analytics & Business Intelligence
A live dashboard shows revenue over time, order and payment breakdowns, traffic and top pages, and customer metrics (new, returning, active), with date-range and preset filtering.

**Commercial value:** decisions are made on current data, in one place, rather than guesswork or spreadsheets.

---

### Lead Generation — the solar calculator as a sales funnel
The solar calculator doesn't just size a system; it captures qualified leads — both explicit quote requests and interest signals when a recommended system is added to cart — into a CRM with the full calculation attached.

**Commercial value:** every serious enquiry becomes a tracked sales opportunity with the technical context your team needs to follow up and close.

---

### Admin Operations Console
All of the above is operated from a single, consistent, secure admin dashboard — inventory, orders, payments, refunds, customers, leads, support, promotions, analytics, and full content/page editing — with live counts and real-time notifications.

**Commercial value:** the whole business runs from one screen, by one or many staff, with a unified look and workflow.

---

## 3. Why this is infrastructure, not features

A "feature" is a button. **Infrastructure is the system behind the button that makes it safe, repeatable, and ready to scale.** This platform was built on foundations that apply across everything above:

- **Data integrity.** Money, stock, and order state are changed inside controlled database transactions — operations either fully succeed or fully roll back, never half-done. This is the difference between software you can run a business on and software that quietly corrupts your numbers.

- **Built for concurrency.** The system is designed for many customers acting at the same time — simultaneous checkouts, simultaneous promo redemptions — without overselling stock or over-issuing discounts.

- **Security by design.** Admin tools are role-protected, payments are independently verified, customer data is access-controlled so people can only see their own orders and tickets, and all discounting and pricing is enforced on the server where it can't be manipulated.

- **Auditability.** Orders carry a full timeline, refunds and promotions are recorded, and support conversations are logged — so there is always a defensible record of what happened.

- **Resilience.** Non-critical systems (like email) are isolated so they can never take down critical ones (like checkout).

- **Extensibility.** Each system is cleanly separated, so new capabilities slot in without rebuilding what exists. The platform is a foundation to grow on, not a ceiling.

---

## 4. What this positions the business for

Because the foundations are in place, the next stage is expansion rather than reconstruction. Natural extensions this platform is already built to support include:

- **Scaling to volume** — moving to enterprise-grade email sending and multi-process serving as traffic grows, by configuration rather than rewrite.
- **Richer marketing** — scheduled campaigns, customer-segment targeting, abandoned-cart recovery, and site-wide sale pricing, all building on the existing promotions and customer systems.
- **Deeper service** — live chat, knowledge base, and SLA tracking on top of the existing support desk.
- **Advanced analytics** — product-level performance, conversion funnels, and cohort retention on top of the existing data.
- **Operational automation** — supplier/restock workflows, delivery-partner integration, and automated reconciliation.

Each of these is an addition to a solid platform — which is exactly why the foundational work carries the value it does.

---

*Prepared as an overview of the Wiibi Energy platform and the systems now operating behind it.*
