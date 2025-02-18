import { ThemeExtensionCheckGlobalActionContext } from "gadget-server";

export const params = {
  shopId: {
    type: "string"
  }
}

/*

  Global action for checking the theme extension status on main/published theme.

*/ 

/**
 * @param { ThemeExtensionCheckGlobalActionContext } context
*/


export async function run({ params, logger, api, connections }) {
  
  const themeType = await api.shopifyTheme.findMany({
      filter: {
        shopId: { equals: params.shopId }
      },
      select: {
        id: true,
        role: true
      }
  })

  const mainTheme = themeType.find(theme => theme.role === 'main' || theme.role === 'development')

  
  if (mainTheme && mainTheme.id && mainTheme.role) {

    try {
      const assetResponse = await shopify.asset.get(
        mainTheme.id,
        {
          asset: {
            "key": "config/settings_data.json"
          }
        }
      );

      logger.info(assetResponse, "Asset response");

      const themeStatus = assetResponse.value.includes("previewVideoBlock");

      return { data: themeStatus };
      
    } catch (error) {
      logger.error(error, "Error fetching asset. Returning true as fallback.");
      return { data: true };
    }
  }
  
  return { data: false }
  
};
