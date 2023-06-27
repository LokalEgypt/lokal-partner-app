// @ts-check


import {ApolloServer} from 'apollo-server-express';

import {resolvers, schema} from './server/graphql/index.js';

//import {resolvers} from './server/graphql/resolvers.js'

import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";

import axios from 'axios';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;



//Registering a webhook for product update.


// Session is built by the OAuth process






const app = express();


const graphQLServer = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: async (ctx) => {

    console.log(ctx);
    const authHeader = ctx.req.headers.authorization;
    console.log(ctx);
    console.log(authHeader);
    const matches = authHeader?.match(/Bearer (.*)/);
    console.log(matches);
    let shop;
    if (matches) {
      const payload = shopify.api.utils.decodeSessionToken(matches[1]);
      shop = payload.dest.replace('https://', '');
      console.log(shop);
    }
    if (shop) {
      const session = await shopify.api.utils.loadOfflineSession(shop);
      if (session) {
        return {shop: {domain: shop, accessToken: session.accessToken}};
      }
    }

    return {};
  },
});
await graphQLServer.start();

graphQLServer.applyMiddleware({
  app,
});


// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});


app.get("/api/products/hooks", async (_req, res) => {
  const hook = await shopify.api.rest.Webhook.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(hook == 3);
});


app.get("/api/products/sync", async (_req, res) => {


  
  try{
  
    const existingHooks = await shopify.api.rest.Webhook.all({
      session: res.locals.shopify.session,
    });

    const hasProductUpdateHook = existingHooks.some(hook => hook.topic == 'products/update');

    const hasProductCreateHook = existingHooks.some(hook => hook.topic == 'products/create');


    if (!hasProductUpdateHook) {
      const webhook = new shopify.api.rest.Webhook({session: res.locals.shopify.session });
      webhook.format = "json";
      webhook.address = 'https://partner.lokaleg.com/api/products/sync';
      webhook.topic = 'products/update';
      await webhook.save({
        update: true,
      });
    }

    if (!hasProductCreateHook) {
      const webhook = new shopify.api.rest.Webhook({session: res.locals.shopify.session });
      webhook.format = "json";
      webhook.address = 'https://partner.lokaleg.com/api/products/sync';
      webhook.topic = 'products/create';
      await webhook.save({
        update: true,
      });
    }

    const products = await shopify.api.rest.Product.all({
       session: res.locals.shopify.session,
    });

     await axios({
       method: 'post',
       url: 'https://partner.lokaleg.com/api/products/syncproducts',
       data:  {
         products: products 
       }
     }).catch(function (err) {
       console.log(err);
       console.log(products.toString());
     });
     
    res.status(200).send({ message: 'Products Sent'});
    } catch (ex){
      console.log('Error saving webhook ' + ex);
      res.status(502).send({ error: ex.Message});
    }
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
