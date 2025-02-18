import { RouteContext } from "gadget-server";
import { modifyAppMetafield, parseImageSrc, getProductFeaturedImage } from "../../helpers/shopifyAppMetafieldFunctions"
/**
 * Route handler for bunnyVideoStatus webhooks
 *
 * @param { RouteContext } route context - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 *
 */
export default async function route({ request, reply, api, logger, connections }) {

  const { VideoGuid, Status } = request.body
  const videoRecord = await api.productVideos.maybeFindFirst({
    filter: { bunnyGUID: { equals: VideoGuid } },
    select: {
      id: true,
      product: {
        id: true,
        shopId: true,
        handle: true,
      }
    }
  })

  if (Status == 2 && videoRecord.id) {
    const updateResponse = await api.productVideos.update(videoRecord.id, {
      status: "encoding"
    })
    logger.info(updateResponse, "Video status updated")
  } else if (Status == 3 && videoRecord.id) {

    const updateResponse = await api.productVideos.update(videoRecord.id, {
      status: "active"
    })

    const featuredImageResponse = await getProductFeaturedImage(connections, videoRecord.product.shopId, videoRecord.product.id)
    logger.info(featuredImageResponse, "Featured image response in webhook")
    // Initial app metafield value write.
    const appMetafieldValue = {
      "id": videoRecord.product.id,
      "streamLink": `https://vz-8ddc4969-aac.b-cdn.net/${VideoGuid}/play_720p.mp4`,
      "srcImage": parseImageSrc(featuredImageResponse.product.featuredImage.url),
      "handle": videoRecord.product.handle
    }

    await api.enqueue(
      api.postToShopifyAppMetafield,
      {
        appMetafieldValue,
        operation: "add",
        shopId: videoRecord.product.shopId
      },
      {
        queue: "videoUploadQue",
        maxConcurrency: 1
      }
    )

    
  }

  await reply.code(200).send({ message: "ok" })
  
}
