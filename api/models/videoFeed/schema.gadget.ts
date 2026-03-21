import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "videoFeed" model, go to https://preview-product.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "I5ImMaAqVa5J",
  fields: {
    name: { type: "string", storageKey: "87guFW-olnF-" },
    productCount: { type: "string", storageKey: "-FgoZCUkQvY5" },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "kc5Acz5rmRgE",
    },
    sliderVideos: {
      type: "hasMany",
      children: { model: "sliderVideo", belongsToField: "videoFeed" },
      storageKey: "gLNnvBawUnrD",
    },
    videoCount: { type: "string", storageKey: "sWBFYXkIlBhO" },
  },
};
