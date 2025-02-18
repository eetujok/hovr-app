import { applyParams, preventCrossShopDataAccess, save, ActionOptions, UpdateShopifyShopActionContext } from "gadget-server";
import { identifyShop } from '../../../services/mantle'

/**
 * @param { UpdateShopifyShopActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * @param { UpdateShopifyShopActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {
  await identifyShop({
    shop: record,
    api,
  });
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
