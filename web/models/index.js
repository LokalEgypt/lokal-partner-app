//const fs = require('fs');
import fs from 'fs';
import path from 'path';
import { join } from 'path';
import Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';


import rootConfig from '../../config/config.json' assert { type: 'json' };

const config = rootConfig[env];

const db = {};

let sequelize;

if (config.use_env_variable) {
  if (process.env[config.use_env_variable]) {
    sequelize = new Sequelize(process.env[config.use_env_variable]);
  } else {
    sequelize = new Sequelize(config);
  }
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

const sessionModule = await import('./session.cjs');
const session = sessionModule.default(sequelize, DataTypes);
db[session.name] = session;

const shopModule = await import('./shop.cjs');
const shop = shopModule.default(sequelize, DataTypes);
db[shop.name] = shop;


Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

