'use strict';

/**
 * seeders/seed-support-system.cjs
 *
 * Realistic support tickets for a Nigerian solar energy company.
 * Creates:
 *  - 25 tickets across different statuses, types and priorities
 *  - Thread messages on each ticket
 *  - Tags on each ticket
 *
 * Run: npx sequelize-cli db:seed --seed seed-support-system.cjs
 */

const { v4: uuidv4 } = require('uuid');

// ── Fake customers ────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: 'Chidi Okafor',     email: 'chidi.okafor@gmail.com',     phone: '+2348012345678' },
  { name: 'Amaka Eze',        email: 'amaka.eze@yahoo.com',         phone: '+2348023456789' },
  { name: 'Emeka Nwosu',      email: 'emeka.nwosu@gmail.com',       phone: '+2348034567890' },
  { name: 'Ngozi Adeyemi',    email: 'ngozi.adeyemi@gmail.com',     phone: '+2348045678901' },
  { name: 'Tunde Bakare',     email: 'tunde.bakare@hotmail.com',    phone: '+2348056789012' },
  { name: 'Ifeanyi Okeke',    email: 'ifeanyi.okeke@gmail.com',     phone: '+2348067890123' },
  { name: 'Blessing Osei',    email: 'blessing.osei@gmail.com',     phone: '+2348078901234' },
  { name: 'Kemi Adebayo',     email: 'kemi.adebayo@gmail.com',      phone: '+2348089012345' },
  { name: 'Uche Okonkwo',     email: 'uche.okonkwo@gmail.com',      phone: '+2348090123456' },
  { name: 'Funmi Ajayi',      email: 'funmi.ajayi@yahoo.com',       phone: '+2348001234567' },
];

// ── Ticket templates ──────────────────────────────────────────────────────────
const TICKET_TEMPLATES = [
  {
    subject:  'My inverter is making a strange noise after 3 days',
    body:     'Good afternoon, I purchased the 2KVA inverter last week and it started making a humming/buzzing noise yesterday evening. The noise is quite loud especially at night. The system is still working but I am concerned. Please advise.',
    type:     'complaint',
    priority: 'high',
    tags:     ['inverter', 'noise', 'warranty'],
    status:   'open',
    messages: [
      { senderType: 'admin', body: 'Thank you for reaching out. A humming noise from an inverter can sometimes indicate a loose component or an issue with the battery connection. Can you confirm — is the noise constant or does it vary with load? Also, what appliances are currently connected?', isInternal: false },
      { senderType: 'customer', body: 'The noise is constant even when nothing is plugged in. I have the 200AH battery connected. The noise started after there was a power surge in my area.', isInternal: false },
      { senderType: 'admin', body: 'Internal note: Likely surge-related transformer vibration. Check if under warranty — purchased last week so should be covered. Escalate to technical team for home visit.', isInternal: true },
    ],
  },
  {
    subject:  'Order not delivered after 2 weeks — ORD-LQ8K-XP9Z',
    body:     'I placed an order for the 5KW solar package over two weeks ago and I was told delivery would be within 5-7 business days. I have not received anything and nobody is picking my calls. My order number is ORD-LQ8K-XP9Z. This is very frustrating as I paid in full.',
    type:     'complaint',
    priority: 'urgent',
    tags:     ['delivery', 'late', 'payment-confirmed'],
    status:   'in_progress',
    messages: [
      { senderType: 'admin', body: 'We sincerely apologise for this delay. I have escalated your order to our logistics team and marked it as priority. You will receive a call within 2 hours with a confirmed delivery date. We will also add a ₦5,000 credit to your account for the inconvenience.', isInternal: false },
      { senderType: 'admin', body: 'Internal: Logistics confirmed order was stuck at Warri depot. Rescheduled for tomorrow AM delivery. Called customer and left voicemail.', isInternal: true },
      { senderType: 'customer', body: 'Thank you for the response. I received a call from your driver just now. He says delivery is tomorrow between 10am and 2pm. I hope this is correct.', isInternal: false },
    ],
  },
  {
    subject:  'Request for quote — office solar installation (Lagos Island)',
    body:     'Hello, I run a small office on Lagos Island with about 15 computers, 4 ACs and general lighting. We experience power cuts for about 8 hours daily. I would like a quote for a solar system that can power everything during those hours. Budget is flexible but I want quality products.',
    type:     'request',
    priority: 'medium',
    tags:     ['quote', 'commercial', 'lagos'],
    status:   'waiting_customer',
    messages: [
      { senderType: 'admin', body: 'Thank you for your inquiry. Based on your description, you are looking at approximately a 10KW system with 20KWh battery storage to comfortably run 15 computers, 4 ACs (assuming 1.5HP each) and lighting for 8 hours. Our quote for this would be in the range of ₦4.5M – ₦5.2M depending on panel brand. Could you confirm the AC tonnage and whether you need installation included?', isInternal: false },
      { senderType: 'customer', body: 'The ACs are all 1.5HP. Yes please include installation. Also do you offer financing?', isInternal: false },
      { senderType: 'admin', body: 'We do offer 6-month installment payment through our partner Renmoney. I am preparing a detailed quote document now — would you prefer I send it to this email or WhatsApp?', isInternal: false },
    ],
  },
  {
    subject:  'How long does the 200AH lithium battery last on a full charge?',
    body:     'Hi, I am considering buying the 200AH lithium battery. I want to know how long it will last powering a refrigerator, 2 fans and 6 LED bulbs. I live in Abuja and AEDC gives us about 4 hours of light per day.',
    type:     'inquiry',
    priority: 'low',
    tags:     ['battery', 'inquiry', 'abuja'],
    status:   'resolved',
    messages: [
      { senderType: 'admin', body: 'Great question! A 200AH lithium battery at 48V gives you about 9.6KWh of usable capacity. Your load estimate: fridge (150W) + 2 fans (120W) + 6 LED bulbs (36W) = approx 306W total. At that consumption, you will get roughly 28-30 hours of runtime on a full charge. With 4 hours of AEDC supply + solar panels, you should be very comfortable. Would you like a full system recommendation?', isInternal: false },
      { senderType: 'customer', body: 'That is perfect, thank you! Yes please send me a full system recommendation.', isInternal: false },
      { senderType: 'admin', body: 'I have sent you a full system recommendation to your email including a 300W solar panel + charge controller + 200AH lithium battery package at ₦385,000. Let us know if you have any questions!', isInternal: false },
    ],
  },
  {
    subject:  'Refund request — wrong item delivered',
    body:     'I ordered the 150AH AGM battery but you delivered a 100AH battery instead. I have photos to prove this. I want either the correct item delivered or a full refund of ₦85,000. This is unacceptable.',
    type:     'refund_request',
    priority: 'urgent',
    tags:     ['wrong-item', 'refund', 'battery'],
    status:   'in_progress',
    messages: [
      { senderType: 'admin', body: 'We are very sorry about this error. This is completely our fault. Please send the photos to this ticket and we will arrange an immediate exchange — our driver will bring the correct 150AH battery and collect the 100AH. No need for you to do anything except be available. Alternatively if you prefer a refund we can process that within 3-5 business days.', isInternal: false },
      { senderType: 'customer', body: 'I prefer the exchange. When can your driver come?', isInternal: false },
      { senderType: 'admin', body: 'Internal: Confirmed with warehouse — 150AH in stock. Scheduling driver for tomorrow. Update customer.', isInternal: true },
      { senderType: 'admin', body: 'Our driver will be with you tomorrow between 9am and 12pm. You will receive an SMS with the driver\'s name and phone number tonight. Again, we sincerely apologise for the inconvenience.', isInternal: false },
    ],
  },
  {
    subject:  'Solar panels not generating expected output',
    body:     'I installed the 400W panels 3 months ago but I am only getting about 250W maximum output even on a clear sunny day. My installer says the panels are fine but the output does not match what was advertised. What should I do?',
    type:     'technical',
    priority: 'high',
    tags:     ['solar-panels', 'output', 'technical'],
    status:   'open',
    messages: [
      { senderType: 'admin', body: 'Thank you for raising this. A 250W reading on a 400W panel on a clear day suggests one of a few issues: panel angle/shading, charge controller settings, or wiring losses. Can you share: (1) the angle your panels are tilted, (2) whether there is any shading at any time of day, and (3) what charge controller you are using?', isInternal: false },
    ],
  },
  {
    subject:  'Need help choosing between 3KW and 5KW system for my home',
    body:     'Hello, I have a 3-bedroom flat in Port Harcourt. I have a fridge, washing machine, 3 ACs (1HP each), TV, decoder, laptop and general lighting. I want a system that can run everything at once. What do you recommend?',
    type:     'inquiry',
    priority: 'medium',
    tags:     ['inquiry', 'sizing', 'port-harcourt'],
    status:   'resolved',
    messages: [
      { senderType: 'admin', body: 'For your load profile in Port Harcourt, I would strongly recommend the 5KW system. Here is why: your 3 ACs alone at startup draw about 4.5KW, and with the washing machine, fridge and other loads you are looking at peak loads of 6-7KW. The 3KW system would struggle and trip frequently. The 5KW system gives you comfortable headroom. Shall I prepare a full quote?', isInternal: false },
      { senderType: 'customer', body: 'Yes please prepare the quote. How long does installation take?', isInternal: false },
      { senderType: 'admin', body: 'Installation typically takes 1 full day for a standard 5KW residential system. I have emailed the quote to you — total comes to ₦1.85M including installation, 2-year warranty on all components and 25-year panel performance warranty.', isInternal: false },
      { senderType: 'customer', body: 'Thank you, I have seen the quote. I will discuss with my wife and get back to you.', isInternal: false },
    ],
  },
  {
    subject:  'Battery swelling — urgent safety concern',
    body:     'One of my AGM batteries is visibly swollen/bloated. I am scared to touch it. I bought it 8 months ago. Is this dangerous? What should I do immediately?',
    type:     'complaint',
    priority: 'urgent',
    tags:     ['battery', 'safety', 'warranty', 'urgent'],
    status:   'in_progress',
    messages: [
      { senderType: 'admin', body: 'IMPORTANT: Please do not charge the battery or use it. A swollen battery is a safety hazard. Immediately disconnect it from your system — turn off the inverter first, then disconnect the battery terminals (negative first). Keep it in a well-ventilated area away from heat sources. We are arranging an emergency replacement under warranty. Can you confirm your address so we can dispatch today?', isInternal: false },
      { senderType: 'customer', body: 'I have disconnected it. My address is 14 Rumuola Road, Port Harcourt. Please come quickly, I am worried.', isInternal: false },
      { senderType: 'admin', body: 'Internal: Escalate to field team. Swollen AGM within 8 months — possible overcharging by their charge controller settings. Send tech + replacement battery today. Log as warranty claim.', isInternal: true },
      { senderType: 'admin', body: 'Our technician and a replacement battery are on the way. ETA 2-3 hours. The technician will also inspect your charge controller settings to prevent this from happening again. You are safe as long as the battery is disconnected and in open air.', isInternal: false },
    ],
  },
  {
    subject:  'Do you offer installation services in Enugu?',
    body:     'I live in Enugu and I want to buy a complete solar system from you. Do you have installers in Enugu or will I need to arrange my own? If you have partners in Enugu please share their contact.',
    type:     'inquiry',
    priority: 'low',
    tags:     ['installation', 'enugu', 'inquiry'],
    status:   'closed',
    messages: [
      { senderType: 'admin', body: 'Yes! We have certified installation partners in Enugu. Our partner there is SolarTech Enugu — you can reach them at 08033456789. They are fully trained on our products and the installation is covered under the same warranty. Alternatively, if you purchase a full package from us, we can coordinate the installation directly and you pay one invoice. Which do you prefer?', isInternal: false },
      { senderType: 'customer', body: 'Please coordinate directly, that is much easier. I will place the order on your website.', isInternal: false },
    ],
  },
  {
    subject:  'Payment made but order still shows as unpaid',
    body:     'I made a bank transfer of ₦285,000 for my order yesterday afternoon. My order shows as unpaid on the website. I have attached my bank receipt. Please confirm payment so my order can be processed. I am in a hurry as I have no power.',
    type:     'complaint',
    priority: 'high',
    tags:     ['payment', 'bank-transfer', 'order'],
    status:   'open',
    messages: [
      { senderType: 'admin', body: 'Thank you for contacting us. Bank transfers can take 24-48 hours to reflect on our system. Could you please provide your order number and the transfer reference number so our accounts team can confirm manually and update your order immediately?', isInternal: false },
    ],
  },
  // -- A few simpler/shorter tickets --
  {
    subject:  'Request for bulk pricing — 20 units inverters',
    body:     'We are a construction company looking to buy 20 units of the 1KVA inverter for our site offices. Do you offer bulk pricing? Please send your best price to procurement@buildfast.ng',
    type:     'request',
    priority: 'medium',
    tags:     ['bulk', 'commercial', 'inverter'],
    status:   'waiting_customer',
    messages: [
      { senderType: 'admin', body: 'Thank you for your inquiry. For 20 units we can offer a 12% discount off our standard price, bringing the unit cost to ₦44,000 (from ₦50,000). Total would be ₦880,000 with free delivery to any Lagos address. I have sent a formal quotation to procurement@buildfast.ng. Valid for 14 days.', isInternal: false },
    ],
  },
  {
    subject:  'Website showing wrong price for 5KW package',
    body:     'The website shows ₦1.2M for the 5KW package but your sales rep told me it is ₦1.85M. Which is correct? I want to make sure before I order.',
    type:     'inquiry',
    priority: 'medium',
    tags:     ['pricing', 'website'],
    status:   'resolved',
    messages: [
      { senderType: 'admin', body: 'Thank you for flagging this. The correct current price is ₦1.85M — the ₦1.2M on the website was an outdated price that has not been updated yet. We apologise for the confusion. Our web team has been notified. The price your sales rep quoted is correct.', isInternal: false },
      { senderType: 'admin', body: 'Internal: Update product price on website. Tag for marketing team.', isInternal: true },
    ],
  },
  {
    subject:  'How do I monitor my system output?',
    body:     'I recently bought the solar system and it is working great. I want to know if there is an app or way to monitor how much power I am generating and consuming daily.',
    type:     'inquiry',
    priority: 'low',
    tags:     ['monitoring', 'app', 'inquiry'],
    status:   'resolved',
    messages: [
      { senderType: 'admin', body: 'Great to hear your system is working well! For monitoring, the charge controller you have (MPPT 60A) is compatible with the SolarmanPV app on Android and iOS. You will need the logger device (we sell it for ₦8,500) which connects via WiFi. Alternatively, your inverter display shows real-time generation. Would you like to order the logger?', isInternal: false },
      { senderType: 'customer', body: 'Yes please, add it to my next order. Thank you!', isInternal: false },
    ],
  },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAfter(date, h) {
  return new Date(date.getTime() + h * 3600 * 1000);
}

function padSeq(n) {
  return String(n).padStart(4, '0');
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ticketRows  = [];
    const messageRows = [];
    const tagRows     = [];

    TICKET_TEMPLATES.forEach((tpl, idx) => {
      const ticketId    = uuidv4();
      const customer    = CUSTOMERS[idx % CUSTOMERS.length];
      const createdAt   = daysAgo(60 - idx * 4);   // spread over last 60 days
      const dateStr     = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
      const ticketNum   = `TKT-${dateStr}-${padSeq(idx + 1)}`;

      const isResolved  = ['resolved', 'closed'].includes(tpl.status);
      const resolvedAt  = isResolved ? hoursAfter(createdAt, 48) : null;

      // First admin message timestamp
      const firstAdminMsg = tpl.messages?.find(m => m.senderType === 'admin');
      const firstResponseAt = firstAdminMsg ? hoursAfter(createdAt, 2) : null;

      ticketRows.push({
        id:               ticketId,
        ticket_number:    ticketNum,
        user_id:          null,   // guests — no user account required
        requester_name:   customer.name,
        requester_email:  customer.email,
        requester_phone:  customer.phone,
        order_id:         null,
        subject:          tpl.subject,
        body:             tpl.body,
        type:             tpl.type,
        priority:         tpl.priority,
        status:           tpl.status,
        assigned_to:      null,
        resolved_at:      resolvedAt,
        first_response_at: firstResponseAt,
        channel:          'web_form',
        created_at:       createdAt,
        updated_at:       new Date(),
      });

      // Messages
      (tpl.messages ?? []).forEach((msg, mIdx) => {
        messageRows.push({
          id:          uuidv4(),
          ticket_id:   ticketId,
          sender_id:   null,
          sender_type: msg.senderType,
          body:        msg.body,
          is_internal: msg.isInternal ? 1 : 0,
          attachments: null,
          created_at:  hoursAfter(createdAt, (mIdx + 1) * 3),
        });
      });

      // Tags
      (tpl.tags ?? []).forEach(tag => {
        tagRows.push({
          ticket_id: ticketId,
          tag,
        });
      });
    });

    await queryInterface.bulkInsert('support_tickets',  ticketRows);
    await queryInterface.bulkInsert('ticket_messages',  messageRows);
    await queryInterface.bulkInsert('ticket_tags',      tagRows);

    console.log(`[Seed] Inserted ${ticketRows.length} tickets, ${messageRows.length} messages, ${tagRows.length} tags`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ticket_tags',     null, {});
    await queryInterface.bulkDelete('ticket_messages', null, {});
    await queryInterface.bulkDelete('support_tickets', null, {});
  },
};
