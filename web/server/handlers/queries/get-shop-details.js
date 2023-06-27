import {callShopifyGraphqlAPI} from '../client.js';

const SHOP_DETAILS = `
  {
    shop {
      name
      billingAddress {
        country
      }
    }
  }
`;

export const getShopDetails = async (shop, token) => {
  const resp = await callShopifyGraphqlAPI(shop, token, {
    query: SHOP_DETAILS,
  });

  return resp.body.data.shop;
};
