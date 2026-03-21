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
  
  const themes = await api.shopifyTheme.findMany({
      filter: {
        shopId: { equals: params.shopId }
      },
      select: {
        id: true,
        role: true
      }
  })

  const shopifyClient = await connections.shopify.forShopId(params.shopId)

  var hasPreviewVideoBlock = false
  var hasHovrAutoplay = false

  // Organize themes to check main theme first, then others
  const mainThemes = themes.filter(theme => theme && theme.role === 'main');
  const otherThemes = themes.filter(theme => theme && theme.role !== 'main');
  const sortedThemes = [...mainThemes, ...otherThemes];

  for (const theme of sortedThemes) {

    if (theme && theme.id && theme.role) {
      try {
        const themeRoleLowercase = theme.role.toLowerCase()
        if (themeRoleLowercase === 'main' || themeRoleLowercase === 'development' || themeRoleLowercase === 'unpublished') {
          const assetResponse = await shopifyClient.asset.get(
            theme.id,
            {
              asset: {
                "key": "config/settings_data.json"
              }
            }
          );
    
          const themeStatus = assetResponse.value.includes("hovr-video-on-hover");
          const autoplayStatus = assetResponse.value.includes(`"hovr_autoplay": true`);

          if (themeStatus) {
            hasPreviewVideoBlock = true
            if (autoplayStatus) {
              hasHovrAutoplay = true
            }
            break
          }
        }
      } catch (error) {
        logger.error("Error fetching theme asset. Returning true as fallback.");
      }
      }
  }

  return { data: hasPreviewVideoBlock, autoplay: hasHovrAutoplay }
  
};
