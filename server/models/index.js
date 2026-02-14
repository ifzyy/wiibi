// models/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Sequelize from 'sequelize';

import sequelize from '../config/db.js'; // ← your Sequelize instance

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basename = path.basename(__filename);

const db = {};

// 1. Dynamically load all model files in this folder
const modelFiles = fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

for (const file of modelFiles) {
  const modelDef = await import(path.join(__dirname, file));
  const model = modelDef.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// 2. Run all .associate() methods to define relationships
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

// 3. Attach sequelize instance & Sequelize class for convenience
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;