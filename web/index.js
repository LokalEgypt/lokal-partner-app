// @ts-check
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



app.get("/api/products/sync", async (_req, res) => {

  const webhook = new shopify.api.rest.Webhook({session: res.locals.shopify.session });
  webhook.address = 'https://87b1-196-132-38-98.ngrok-free.app/api/products/sync';
  webhook.topic = 'products/update';
  webhook.format = "json";

  await webhook.save({
    update: true,
  });

  const products = await shopify.api.rest.Product.all({
    session: res.locals.shopify.session,
  });


  res.status(200).send({ message: 'Product created successfully'});

  // await axios({ //Send to shopify
  //   method: 'post',
  //   url: 'https://87b1-196-132-38-98.ngrok-free.app/api/products/sync',
  //   data:  {
  //     shop: 'Shop Name',
  //     products: products 
  //   }
  // }).then(function (response) {
  //   res.status(200).send({ response: response ,message: 'Product created successfully'});
  // })
  // .catch(function (error) {
  //   res.status(500).send({ message: 'Create product failed', error: error.message });
  // });
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
