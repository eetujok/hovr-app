import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.3.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2025-07",
        enabledModels: [
          "shopifyAppSubscription",
          "shopifyFile",
          "shopifyProduct",
          "shopifyProductMedia",
          "shopifyProductVariant",
          "shopifyProductVariantMedia",
          "shopifyTheme",
        ],
        type: "partner",
        scopes: [
          "read_products",
          "read_themes",
          "unauthenticated_read_product_listings",
          "write_files",
        ],
      },
    },
  },
};
