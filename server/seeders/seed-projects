'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const projects = [
      // Horse Bikes Case Study (detailed)
      {
        id: 'proj-horse-bikes',
        title: 'Horse Bikes Production Plant',
        slug: 'horse-bikes-production-plant',
        type: 'case_study',
        year: '2025',
        location: 'Lagos, Nigeria',
        overview: 'Wiibi Energy partnered with Horse Bikes, a fast-rising Nigerian production house known for creating innovative mobility concepts and multimedia content. The goal was to provide a dependable, solar-powered energy system that would eliminate their reliance on unstable grid electricity and expensive petrol generators.',
        problem: JSON.stringify([
          'Frequent power outages, voltage fluctuations, and irregular supply.',
          'Heavy reliance on generators: high fuel costs, repairs, noise pollution.',
        ]),
        solution: JSON.stringify([
          'High-efficiency solar panels for optimal exposure.',
          'Long-life battery backups for night/low-sun periods.',
          'Smart inverters with surge protection for sensitive equipment.',
          'Low-maintenance system designed for Nigerian conditions.',
          'Staff training for daily energy management.',
        ]),
        results: JSON.stringify([
          'Uninterrupted power during blackouts.',
          '60-70% reduction in energy costs.',
          'Zero generator fuel dependence.',
          'Cleaner, quieter working environment.',
          'Stronger eco-conscious brand image.',
        ]),
        conclusion: 'Wiibi Energy turned Horse Bikes into a fully solar-powered creative hub — proving clean energy unlocks productivity and sustainability for Nigerian businesses.',
        featured_image_id: 'media-project-horse-main', // replace with real media ID later
        gallery_image_ids: JSON.stringify([
          'media-project-horse-1',
          'media-project-horse-2',
          'media-project-horse-3',
        ]),
        is_featured: true,
        display_order: 10,
        is_visible: true,
        created_at: now,
        updated_at: now,
      },

      // Placeholder projects
      {
        id: 'proj-joes-bar',
        title: 'Joes Bar Solar Retrofit',
        slug: 'joes-bar-solar-retrofit',
        type: 'project',
        year: '2025',
        location: 'Lagos, Nigeria',
        overview: 'Complete solar upgrade for a popular Lagos bar to reduce generator dependency.',
        problem: JSON.stringify(['High diesel costs', 'Frequent power cuts during peak hours']),
        solution: JSON.stringify(['10kVA hybrid system', 'Lithium battery backup']),
        results: JSON.stringify(['80% energy cost savings', 'Silent nights']),
        conclusion: 'Reliable power for nightlife operations.',
        featured_image_id: 'media-project-joes-main',
        gallery_image_ids: JSON.stringify([]),
        is_featured: false,
        display_order: 20,
        is_visible: true,
        created_at: now,
        updated_at: now,
      },
      // Add 2–3 more placeholders if needed
    ];

    await queryInterface.bulkInsert('projects', projects, {
      updateOnDuplicate: [
        'title', 'slug', 'type', 'year', 'location', 'overview', 'problem',
        'solution', 'results', 'conclusion', 'featured_image_id',
        'gallery_image_ids', 'is_featured', 'display_order', 'is_visible',
        'updated_at',
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('projects', null, {});
  },
};