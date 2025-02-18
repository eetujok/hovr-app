import { deleteRecord, ActionOptions, DeleteProductVideosActionContext } from "gadget-server";
import { deleteVideoInBunnyCDN } from "../../../helpers/bunnyFunctions.js"
import { getAppMetafields, modifyAppMetafield, getStreamLinksObject } from "../../../helpers/shopifyAppMetafieldFunctions"
/**
 * @param { DeleteProductVideosActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  await deleteRecord(record);

  const deleteObjectFromArray = (objectsArray, targetId) => {
    return objectsArray.filter(obj => obj.id !== targetId);
  }


  const product = await api.shopifyProduct.maybeFindFirst({
    filter: {
      id: {equals: record.productId}
    },
    select: {
      shopId: true,
    }
  })

  const metafieldsResp = await getAppMetafields(connections, product.shopId);
  logger.info(metafieldsResp, "Metafield response from delete")

  const valueJson = getStreamLinksObject(metafieldsResp)
  const previousValues = valueJson

  const newValues = deleteObjectFromArray(previousValues.links, record.productId);

  const deleteResp = await modifyAppMetafield(newValues, "delete", connections, product.shopId, logger)

};

/**
 * @param { DeleteProductVideosActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {

  const guid = record.bunnyGUID;
  const deleteResponse = await deleteVideoInBunnyCDN(guid);

  const productResponse = await api.shopifyProduct.update(record.productId, {
    videoSet: false,
  })

};

/** @type { ActionOptions } */
export const options = {
  actionType: "delete",
  transactional: false,
};
