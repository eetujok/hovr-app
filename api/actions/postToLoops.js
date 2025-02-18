import { PostToLoopsGlobalActionContext } from "gadget-server";

/**
 * @param { PostToLoopsGlobalActionContext } context
 */

export const params = {
  shopId: {
    type: "string"
  },
  shopOwner: {
    type: "string"
  },
  shopEmail: {
    type: "string"
  }
}

export async function run({ params, logger, api, connections }) {

  const { shopId, shopOwner, shopEmail } = params;
  const parts = shopOwner.split(' ');

  let firstName, lastName;

  if (parts.length < 2) {
    firstName = lastName = shopOwner;
  } else {
    [firstName, lastName] = parts;
  }

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer c5ba0af2c777e3c77781585d42f5dfbf`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: shopEmail,
      firstName: firstName,
      lastName: lastName,
      userId: shopId
    })
  };

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonResponse = await response.json();
    logger.info(jsonResponse);
  } catch (err) {
    logger.error(err);
  }
};
