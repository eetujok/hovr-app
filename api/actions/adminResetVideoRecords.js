import { modifyAppMetafield } from "../helpers/shopifyAppMetafieldFunctions"

export const params = {
  shopId: { type: "string" }
}

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {

  
  const shopId = params.shopId

  // Bulk delete

  // use allRecords to store all records
  const allRecords = [];
  let records = await api.productVideos.findMany({
    first: 250,
    select: {
      id: true,
    },
    filter: {
      product: {
        shopId: { equals: shopId}
      }
    }
  });
  
  allRecords.push(...records);
  
  // loop through additional pages to get all protected orders
  while (records.hasNextPage) {
    // paginate
    records = await records.nextPage();
    allRecords.push(...records);
  }

  for (const record of allRecords) {
    const id = record.id;
    await api.enqueue(
      api.productVideos.delete,
      {
       id
      },
      {
        queue: "videoDeleteQue",
        maxConcurrency: 1
      }
    )
  }
    
};

