/**
 * seeders/001_blog_seeds.js
 *
 * Seeds the 5 solar blog posts from the frontend mock data.
 * Run: npx sequelize-cli db:seed --seed 001_blog_seeds.js
 *
 * NOTE: This seeder inserts raw rows without the Sequelize model hooks,
 * so read_time_minutes and published_at are computed manually here.
 */

const { v4: uuidv4 } = require('uuid');

// ── Utility: strip HTML → word count → read time ────────────────────────────
const calcReadTime = (html = '') => {
  const plain = html.replace(/<[^>]+>/g, ' ').trim();
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

// ── Seed data (mirrors frontend mockData.js exactly) ─────────────────────────
const NOW = new Date();

const BLOGS = [
  {
    id: uuidv4(),
    title: 'How Solar Panels Work: A Complete Guide for Homeowners',
    slug: 'how-solar-panels-work-complete-guide',
    excerpt:
      'Everything you need to know about photovoltaic technology, from silicon cells to your home energy bill — explained simply.',
    content: `<h2>The Science Behind Solar Energy</h2><p>At the heart of every solar panel is the photovoltaic (PV) cell — a thin slice of silicon that converts sunlight directly into electricity through the photoelectric effect.</p><p>When photons from the sun strike the silicon, they knock electrons loose, creating a flow of direct current (DC) electricity.</p><h3>Key Components</h3><ul><li><strong>Solar Panels</strong> — Capture sunlight and generate DC electricity</li><li><strong>Inverter</strong> — Converts DC to AC power</li><li><strong>Net Meter</strong> — Tracks energy sent to the grid</li><li><strong>Battery Storage</strong> — Optional backup</li></ul><blockquote>A typical residential solar installation generates 10,000–14,000 kWh per year.</blockquote>`,
    status: 'published',
    featured_image_url:
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
    author_name: 'Maya Thornton',
    is_featured: true,
    tags: ['solar', 'education', 'homeowners', 'photovoltaic'],
    created_at: new Date('2025-01-10T09:00:00Z'),
    published_at: new Date('2025-01-10T09:00:00Z'),
  },
  {
    id: uuidv4(),
    title: 'Battery Storage Systems: Is the Tesla Powerwall Worth It in 2025?',
    slug: 'battery-storage-tesla-powerwall-2025',
    excerpt:
      "We break down the real costs, savings, and scenarios where home battery storage makes financial sense — and when it doesn't.",
    content: `<h2>The Battery Storage Revolution</h2><p>Home battery storage has crossed a major threshold: for many homeowners, it now pays for itself within 7–10 years.</p><h3>Powerwall 3 Specs</h3><ul><li>13.5 kWh usable capacity</li><li>11.5 kW continuous power output</li><li>97% round-trip efficiency</li><li>10-year warranty</li></ul><blockquote>In California, homeowners with Powerwall + solar are seeing effective electricity costs as low as $0.03/kWh.</blockquote>`,
    status: 'published',
    featured_image_url:
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
    author_name: 'Diego Vásquez',
    is_featured: false,
    tags: ['battery', 'powerwall', 'storage', 'tesla'],
    created_at: new Date('2025-01-22T11:00:00Z'),
    published_at: new Date('2025-01-22T11:00:00Z'),
  },
  {
    id: uuidv4(),
    title: "The True Cost of Solar Installation: What Quotes Don't Tell You",
    slug: 'true-cost-solar-installation-hidden-fees',
    excerpt:
      'Permits, roof reinforcement, utility interconnection fees — the real numbers behind going solar in 2025.',
    content: `<h2>Beyond the Panel Price Tag</h2><p>The sticker price of solar panels is only part of the story.</p><h3>The Hidden Cost Breakdown</h3><ol><li><strong>Permits & Inspections</strong> — $500–$1,500</li><li><strong>Roof Assessment</strong> — $0–$8,000</li><li><strong>Utility Interconnection Fee</strong> — $100–$400</li><li><strong>Main Panel Upgrade</strong> — $1,500–$3,500</li></ol>`,
    status: 'draft',
    featured_image_url:
      'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&q=80',
    author_name: 'Priya Mehta',
    is_featured: false,
    tags: ['cost', 'installation', 'financing', 'ITC'],
    created_at: new Date('2025-02-05T13:00:00Z'),
    published_at: null,
  },
  {
    id: uuidv4(),
    title: 'Community Solar: Going Solar Without Rooftop Panels',
    slug: 'community-solar-guide-renters-apartments',
    excerpt:
      'Renters, condo owners, and those with shaded roofs can still access solar savings through community solar programs.',
    content: `<h2>What Is Community Solar?</h2><p>Community solar allows subscribers to benefit from a solar array located off-site.</p><h3>Who Benefits Most</h3><ul><li>Renters and apartment dwellers</li><li>Homeowners with shaded roofs</li><li>Those planning to move within 5 years</li></ul><blockquote>By 2024, community solar capacity in the US surpassed 10 GW.</blockquote>`,
    status: 'draft',
    featured_image_url: null,
    author_name: 'Maya Thornton',
    is_featured: false,
    tags: ['community-solar', 'renters', 'shared-solar'],
    created_at: new Date('2025-02-12T08:00:00Z'),
    published_at: null,
  },
  {
    id: uuidv4(),
    title: 'Solar + EV Charging: Designing the Perfect Home Energy System',
    slug: 'solar-ev-charging-home-energy-system',
    excerpt:
      'Pair your solar installation with an EV charger to drive on sunshine — and eliminate both your electricity and fuel bills.',
    content: `<h2>The Solar-EV Synergy</h2><p>An electric vehicle changes the economics of solar dramatically. A typical EV adds 3,000–5,000 kWh of annual electricity demand.</p><h3>Smart Charging Strategies</h3><ul><li><strong>Solar-direct charging</strong> — Charge during peak solar hours (10am–3pm)</li><li><strong>Time-of-use optimization</strong> — Smart chargers shift to off-peak windows</li><li><strong>V2H (Vehicle-to-Home)</strong> — Use your EV as backup storage</li></ul>`,
    status: 'published',
    featured_image_url:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80',
    author_name: 'Diego Vásquez',
    is_featured: false,
    tags: ['EV', 'charging', 'solar', 'energy-system'],
    created_at: new Date('2025-02-20T10:00:00Z'),
    published_at: new Date('2025-02-20T10:00:00Z'),
  },
];

module.exports = {
  up: async (queryInterface) => {
    // ── 1. Collect all unique tag names ────────────────────────────────────────
    const allTagNames = [...new Set(BLOGS.flatMap((b) => b.tags))];

    const tagRows = allTagNames.map((name) => ({
      id: uuidv4(),
      name: name.toLowerCase().trim(),
      slug: name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      created_at: NOW,
      updated_at: NOW,
    }));

    for (const tag of tagRows) {
      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        { replacements: [tag.id, tag.name, tag.slug, tag.created_at, tag.updated_at] }
      );
    }

    const [dbTags] = await queryInterface.sequelize.query(
      `SELECT id, name FROM tags WHERE name IN (${allTagNames.map(() => '?').join(',')})`,
      { replacements: allTagNames.map((n) => n.toLowerCase().trim()) }
    );

    const tagMap = Object.fromEntries(dbTags.map((t) => [t.name, t.id]));

    // ── 2. Insert blog rows ────────────────────────────────────────────────────
    for (const blog of BLOGS) {
      const readTime = calcReadTime(blog.content);

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO blogs
          (id, title, slug, excerpt, content, status, published_at,
           featured_image_url, author_name, is_featured, read_time_minutes,
           view_count, created_at, updated_at, deleted_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?,NULL)`,
        {
          replacements: [
            blog.id,
            blog.title,
            blog.slug,
            blog.excerpt,
            blog.content,
            blog.status,
            blog.published_at,
            blog.featured_image_url,
            blog.author_name,
            blog.is_featured,
            readTime,
            blog.created_at,
            blog.created_at,
          ],
        }
      );

      // ── 3. Insert blog_tags junctions ───────────────────────────────────────
      for (const tagName of blog.tags) {
        const tagId = tagMap[tagName.toLowerCase().trim()];
        if (!tagId) continue;

        await queryInterface.sequelize.query(
          `INSERT IGNORE INTO blog_tags (blog_id, tag_id) VALUES (?, ?)`,
          { replacements: [blog.id, tagId] }
        );
      }
    }
  },

  down: async (queryInterface) => {
    const slugs = BLOGS.map((b) => b.slug);
    await queryInterface.sequelize.query(
      `DELETE FROM blogs WHERE slug IN (${slugs.map(() => '?').join(',')})`,
      { replacements: slugs }
    );
  },
};