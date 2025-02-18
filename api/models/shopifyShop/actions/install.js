import { applyParams, save, ActionOptions, InstallShopifyShopActionContext } from "gadget-server";
import { identifyShop } from '../../../services/mantle'

/**
 * @param { InstallShopifyShopActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await save(record);
};

/**
 * @param { InstallShopifyShopActionContext } context
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
  
  const firstResponse = await connections.shopify.current.graphql(
    `query {
        currentAppInstallation {
          id
        }
      }
    `
  )

  //Create app stream links metafield, from installation id
  const secondResponse = await connections.shopify.current.graphql(`
    mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafieldsSetInput) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    metafieldsSetInput: [
      {
        namespace: "seetext",
        key: "stream_links",
        type: "json",
        value: `{"links": []}`,
        ownerId: firstResponse.currentAppInstallation.id
      }
    ]
  }
  )

  const thirdResponse = await connections.shopify.current.graphql(`
        mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafieldsSetInput) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        metafieldsSetInput: [
          {
            namespace: "seetext",
            key: "extension_enabled",
            type: "boolean",
            value: "false",
            ownerId: firstResponse.currentAppInstallation.id
          }
        ]
      }
  );

  logger.info(secondResponse, "Create app metafield response")

  const shopResponse = await api.internal.shopifyShop.update(record.id, {
    appInstallationId: firstResponse.currentAppInstallation.id
  })

  await api.postToLoops({
    shopId: record.id,
    shopOwner: record.shopOwner,
    shopEmail: record.email
  });

};

/** @type { ActionOptions } */
export const options = { actionType: "create" };
