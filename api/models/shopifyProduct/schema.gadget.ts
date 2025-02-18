import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyProduct" model, go to https://preview-product.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Product",
  fields: {
    featuredImage: {
      type: "computed",
      sourceFile: "api/models/shopifyProduct/featuredImage.gelly",
      storageKey: "CvQYRRemBMpU",
    },
    productVideos: {
      type: "hasOne",
      child: { model: "productVideos", belongsToField: "product" },
      storageKey: "Rb0QgLmONCSr",
    },
    videoSet: {
      type: "boolean",
      default: false,
      storageKey: "Pb5E8OLuS81m",
    },
  },
  shopify: {
    fields: [
      "body",
      "category",
      "compareAtPriceRange",
      "handle",
      "images",
      "media",
      "productCategory",
      "productType",
      "publishedAt",
      "shop",
      "shopifyCreatedAt",
      "shopifyUpdatedAt",
      "status",
      "tags",
      "templateSuffix",
      "title",
      "variants",
      "vendor",
    ],
  },
};
