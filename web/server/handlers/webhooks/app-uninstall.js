import { db } from '../../../models/index.js';

export const handleAppUninstall = async (domain) => {
  try {
    await db.Shop.destroy({
      where: {
        domain,
      },
    });
  } catch (err) {
    console.log('Error deleting the entry in the database: ', err);
  }
};
