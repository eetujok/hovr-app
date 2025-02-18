import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "productVideos" model, go to https://preview-product.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "RqDayejqz6bB",
  fields: {
    batchUrl: { type: "string", storageKey: "mkcQsBvs5FKx" },
    bunnyGUID: { type: "string", storageKey: "mttgsE63B5XL" },
    product: {
      type: "belongsTo",
      parent: { model: "shopifyProduct" },
      storageKey: "LnaQowV39BuW",
    },
    status: {
      type: "enum",
      default: "none",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "active",
        "uploading",
        "uploadFailed",
        "none",
        "encoding",
      ],
      storageKey: "o2UJ-dkLeHYf",
    },
    thumbnail: {
      type: "file",
      allowPublicAccess: false,
      storageKey: "FK9q_xHfSmID",
    },
    video: {
      type: "file",
      allowPublicAccess: false,
      storageKey: "iu4UEH-TJWmn",
    },
  },
};
