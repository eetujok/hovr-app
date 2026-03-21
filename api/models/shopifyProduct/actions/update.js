import { applyParams, preventCrossShopDataAccess, save, ActionOptions, UpdateShopifyProductActionContext } from "gadget-server";

/**
 * @param { UpdateShopifyProductActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * @param { UpdateShopifyProductActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {

};

/** @type { ActionOptions } */
export const options = {
  actionType: "update",
  triggers: {
    api: true,
    shopify: { 
      includeFields: ["id", "title", "handle", "featuredMedia", "media"]  
    },
  },
};
