import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "sliderVideo" model, go to https://preview-product.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "7aF201b3Jxm_",
  fields: {
    name: { type: "string", storageKey: "jjWfvHo8AoJC" },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "YVSrTgOOxur1",
    },
    src: { type: "string", storageKey: "NrLO_KvMbYk-" },
    status: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "active",
        "uploading",
        "uploadFailed",
        "none",
        "processing",
      ],
      storageKey: "7LuLf8FthTsD",
    },
    taggedProducts: {
      type: "hasMany",
      children: {
        model: "shopifyProduct",
        belongsToField: "sliderVideo",
      },
      storageKey: "w450ntmMZOV8",
    },
    thumbnail: { type: "string", storageKey: "I41kCPYKrhy3" },
    uploadType: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["direct", "shopifyFile", "instagram", "tiktok"],
      storageKey: "b1RHXoj9NqI_",
    },
    video: {
      type: "file",
      allowPublicAccess: false,
      storageKey: "Y2bLZTvCDSI0",
    },
    videoFeed: {
      type: "belongsTo",
      parent: { model: "videoFeed" },
      storageKey: "xGl7WGnIrhaA",
    },
  },
};
