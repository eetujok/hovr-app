import { applyParams, save, ActionOptions, UpdateProductVideosActionContext } from "gadget-server";

/**
 * @param { UpdateProductVideosActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await save(record);
};

/**
 * @param { UpdateProductVideosActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {
};

/** @type { ActionOptions } */
export const options = {
  actionType: "update"
};
