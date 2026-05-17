import { Op } from 'sequelize';

export const toSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const uniqueSlug = async (Model, baseSlug, excludeId = null) => {
  let slug    = baseSlug;
  let counter = 0;

  for (;;) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Model.findOne({ where });
    if (!existing) return slug;
    counter++;
    slug = baseSlug + '-' + counter;
  }
};