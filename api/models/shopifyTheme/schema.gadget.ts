import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyTheme" model, go to https://preview-product.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Theme",
  fields: {
    roleBackup: {
      type: "string",
      storageKey:
        "ModelField-DataModel-Shopify-Theme-role::FieldStorageEpoch-DataModel-Shopify-Theme-role-initial",
    },
  },
  shopify: {
    fields: [
      "name",
      "prefix",
      "previewable",
      "processing",
      "processingFailed",
      "role",
      "shop",
      "shopifyCreatedAt",
      "shopifyUpdatedAt",
      "themeStoreId",
    ],
  },
};
