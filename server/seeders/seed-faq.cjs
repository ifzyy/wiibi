'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const faqs = [
      {
        id: 'faq-1',
        question: 'How long do solar panels last?',
        answer: 'Most high-quality panels come with 25–30 year performance warranties.',
        display_order: 10,
        is_visible: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-2',
        question: 'Do solar systems work during rainy season?',
        answer: 'Yes, though production is lower. Batteries and grid/hybrid systems ensure power availability.',
        display_order: 20,
        is_visible: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-3',
        question: 'What is the payback period in Nigeria?',
        answer: 'Typically 5–7 years depending on system size and usage.',
        display_order: 30,
        is_visible: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-4',
        question: 'Can I start small and expand later?',
        answer: 'Yes – our systems are modular and can be expanded easily.',
        display_order: 40,
        is_visible: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('faqs', faqs, {
      updateOnDuplicate: ['question', 'answer', 'display_order', 'is_visible', 'updated_at'],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('faqs', null, {});
  },
};