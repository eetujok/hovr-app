import { applyParams, save, ActionOptions, UploadCsvShopifyShopActionContext } from "gadget-server";
import got from "got";
import { parse } from 'csv-parse';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param { UploadCsvShopifyShopActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await save(record);
}

export async function onSuccess({ params, record, logger, api, connections }) {
  try {
    const csvData = await got(record.batchCsv.url).buffer();

    const parser = parse({
      delimiter: ",",
      columns: (header) => header.map((col) => col.trim()),
      trim: true,
      skip_empty_lines: true,
    });

    parser.write(csvData);
    parser.end();

    const rows = []; // Store rows for batch processing
    let recordCount = 0;
    let skippedCount = 0;

    // Collect rows
    parser.on("readable", () => {
      let row;
      while ((row = parser.read())) {
        rows.push(row);
      }
    });

    parser.on("error", (err) => {
      logger.error(`Error parsing CSV: ${err.message}`);
    });

    parser.on("end", async () => {
      logger.info(`CSV parsing completed. Total rows read: ${rows.length}`);

      for (const row of rows) {
        const { id, videoLink } = row;

        // Validation
        if (!id || !videoLink) {
          logger.error(`Validation failed: Missing required fields. Row: ${JSON.stringify(row)}`);
          skippedCount++;
          continue; // Skip processing this row
        }

        if (typeof id !== "string" || !/^\d+$/.test(id)) {
          logger.error(`Validation failed: Invalid ID format. ID=${id}`);
          skippedCount++;
          continue; // Skip processing this row
        }

        if (typeof videoLink !== "string" || !/^https?:\/\/[^\s]+$/.test(videoLink)) {
          logger.error(`Validation failed: Invalid VideoLink format. VideoLink=${videoLink}`);
          skippedCount++;
          continue; // Skip processing this row
        }

        try {
          // API call
          await api.productVideos.csvCreate({
            product: {
              _link: id,
            },
            batchUrl: videoLink,
          });

          recordCount++;

          // Batch processing delay
          if (recordCount % 40 === 0) {
            logger.info(`Processed ${recordCount} records. Pausing for 30 seconds...`);
            await delay(30000);
            logger.info("Resuming processing...");
          }
        } catch (error) {
          logger.error(`Error processing row with ID=${id}: ${error.message}`);
        }
      }

      logger.info(`Processing completed. Total processed: ${recordCount}, Skipped: ${skippedCount}`);
    });
  } catch (error) {
    logger.error(`Error in onSuccess function: ${error.message}`);
  }
}


/** @type { ActionOptions } */
export const options = {
  actionType: "update",
  triggers: {
    api: true,
  },
  timeoutMS: 600000,
};
