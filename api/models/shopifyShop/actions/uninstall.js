import { applyParams, preventCrossShopDataAccess, save, ActionOptions, UninstallShopifyShopActionContext } from "gadget-server";

/**
 * @param { UninstallShopifyShopActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * @param { UninstallShopifyShopActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {
  
  await api.postUninstallToLoops({
    shopId: record.id
  });

};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
