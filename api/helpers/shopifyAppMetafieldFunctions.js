/* 
Contains functions for adding and removing Bunny CDN stream links from Product Preview - app-owned metafield.
*/

const retrieveStreamLinksMetafieldMutation = `
  query AppInstallationMetafields {
    currentAppInstallation {
      metafields(first: 10) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
  }
`

const getAppInstallationId = async (connections, shopId) => {

  const shopify = await connections.shopify.forShopId(shopId)

  const response = await shopify.graphql(
    `query {
        currentAppInstallation {
          id
        }
      }
    `
  )

  return response.currentAppInstallation.id

}

const getAppMetafields = async (connections, shopId) => {

  const shopify = await connections.shopify.forShopId(shopId)

  const response = shopify.graphql(
    retrieveStreamLinksMetafieldMutation
  )

  return response

}

const getStreamLinksObject = (appMetafields) => {
  const metafields = appMetafields.currentAppInstallation.metafields.edges;

  // Find the metafield with the key "stream_links"
  const streamLinksMetafield = metafields.find(
    (metafield) => metafield.node.key === "stream_links"
  );

  // If found, return the parsed JSON value
  if (streamLinksMetafield) {
    return JSON.parse(streamLinksMetafield.node.value);
  }

  // Return an empty object if the metafield isn't found
  return { links: [] };
};


const modifyAppMetafield = async (value, op, connections, shopId, logger) => {


  const shopify = await connections.shopify.forShopId(shopId)
  const appId = await getAppInstallationId(connections, shopId)
  

  let newValues = []

  if (op == "add") {

    const metafieldsResp = await getAppMetafields(connections, shopId);
    logger.info(metafieldsResp, "App metafields from second call")
    const valueJson = getStreamLinksObject(metafieldsResp)
    const previousValues = valueJson
    logger.info(previousValues, "Parsed metafield value")

    previousValues.links.push(value)
    newValues = previousValues.links

  } else if (op == "delete") {
    newValues = value;
  } else if (op == "update") {
    newValues = value
    logger.info(newValues, "Update new values")
  }

  const response = shopify.graphql(`
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
          value: `{"links": ${JSON.stringify(newValues)}}`,
          ownerId: appId
        }
      ]
    }
  )

  return response

}

const modifyAppConditionMetafield = async (value, connections, shopId) => {

  const shopify = await connections.shopify.forShopId(shopId)
  const appId = await getAppInstallationId(connections, shopId)

  const response = shopify.graphql(`
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
            value: `${value}`,
            ownerId: appId
          }
        ]
      }
  );

  return response

}

const getProductFeaturedImage = async (connections, shopId, productId) => {

  const shopify = await connections.shopify.forShopId(shopId)

  const response = shopify.graphql(`
    query getProductFirstImage($productId: ID!) {
      product(id: $productId) {
        id
        featuredImage {
          id
          url
        }
      }
    }
  `, {
    productId: `gid://shopify/Product/${productId}`
  })

  return response

}

const parseImageSrc = (url) => {
    // Find the position of the last occurrence of 'files/'
    const lastFilesIndex = url.lastIndexOf('files/');
    
    // If 'files/' is found, extract the substring from that position to the end of the URL
    if (lastFilesIndex !== -1) {
        return url.substring(lastFilesIndex);
    } else {
        // If 'files/' is not found, return the original URL or handle accordingly
        return url.slice(-12);
    }
}


export { modifyAppMetafield, getAppMetafields, modifyAppConditionMetafield, getStreamLinksObject, parseImageSrc, getProductFeaturedImage }
