import { applyParams, preventCrossShopDataAccess, save, ActionOptions, ReinstallShopifyShopActionContext } from "gadget-server";
import { identifyShop } from '../../../services/mantle'

/**
 * @param { ReinstallShopifyShopActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * @param { ReinstallShopifyShopActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {

  await identifyShop({
    shop: record,
    api,
  });

   await api.shopifySync.run({
    shopifySync: {
      domain: record.domain,
      shop: {
        _link: record.id,
      },
    },
  });
  
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
