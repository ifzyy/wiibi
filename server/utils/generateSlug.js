import slugify from 'slugify';
import db from '../models/index.js';
// Helper function – generate unique slug
export async function generateUniqueSlug(title, currentId = null) {
  if (!title?.trim()) {
    throw new Error('Title is required to generate slug');
  }

  let baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
  });

  if (!baseSlug) {
    baseSlug = 'project-' + Date.now();
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db.Project.findOne({
      where: {
        slug,
        id: { [db.Sequelize.Op.ne]: currentId }, // exclude current record on update
      },
    });

    if (!existing) break;

    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}