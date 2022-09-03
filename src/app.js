/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SharedMap } from "fluid-framework";
import { TinyliciousClient } from "@fluidframework/tinylicious-client";
// import { AzureClient, LOCAL_MODE_TENANT_ID } from "@fluidframework/azure-client";
// import { getRandomName } from "@fluidframework/server-services-client";
// import { v4 as uuid } from "uuid";
// import { InsecureTokenProvider } from "@fluidframework/test-client-utils";

export const diceValueKey = "dice-value-key";

const dichHash = "dice-hash";

// Load container and render the app

const params = new URLSearchParams(document.location.search);
// const domain = params.get("domain") || "http://192.168.1.49";
const domain = params.get("domain") || "https://iakgoog.link";
const port = params.get("port") || "443";

const connectionConfig = { connection: { domain, port } };

// const userConfig = {
//     id: uuid(),
//     name: getRandomName(),
// };

// const localConnectionConfig = {
//     tenantId: LOCAL_MODE_TENANT_ID,
//     type: "remote",
//     tokenProvider: new InsecureTokenProvider("", userConfig),
//     endpoint: "http://localhost:7070",
// };

// const connectionConfig = {
//     connection: localConnectionConfig,
// };

const client = new TinyliciousClient(connectionConfig);
// const client = new AzureClient(connectionConfig);
const containerSchema = {
    initialObjects: { diceMap: SharedMap },
};
const root = document.getElementById("content");

const createNewDice = async () => {
    const { container } = await client.createContainer(containerSchema);
    container.initialObjects.diceMap.set(diceValueKey, 1);
    const id = await container.attach();
    renderDiceRoller(container.initialObjects.diceMap, root);
    return id;
};

const loadExistingDice = async (id) => {
    const { container } = await client.getContainer(id, containerSchema);
    renderDiceRoller(container.initialObjects.diceMap, root);
};

async function start() {
    // subscribeHashChange();
    if (location.hash) {
        await loadExistingDice(location.hash.substring(1));
    } else {
        const id = await createNewDice();
        location.hash = id;
    }
}

const subscribeHashChange = () => {
    window.addEventListener(
        "hashchange",
        (win, ev) => {
            console.log(win);
            console.log(window.location.hash.substring(1));
            if (window.location.hash.length > 0) {
                fetch("http://localhost:3031/", {
                    mode: "cors",
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ hash: window.location.hash }),
                });
            }
        },
        false
    );
};

start().catch((error) => console.error(error));

// Define the view

const template = document.createElement("template");

template.innerHTML = `
  <style>
    .wrapper { text-align: center }
    .dice { font-size: 200px }
    .roll { font-size: 50px;}
  </style>
  <div class="wrapper">
    <div class="dice"></div>
    <button class="roll"> Roll </button>
  </div>
`;

const renderDiceRoller = (diceMap, elem) => {
    elem.appendChild(template.content.cloneNode(true));

    const rollButton = elem.querySelector(".roll");
    const dice = elem.querySelector(".dice");

    // Set the value at our dataKey with a random number between 1 and 6.
    rollButton.onclick = () => diceMap.set(diceValueKey, Math.floor(Math.random() * 6) + 1);

    // Get the current value of the shared data to update the view whenever it changes.
    const updateDice = () => {
        const diceValue = diceMap.get(diceValueKey);
        // Unicode 0x2680-0x2685 are the sides of a dice (⚀⚁⚂⚃⚄⚅)
        dice.textContent = String.fromCodePoint(0x267f + diceValue);
        dice.style.color = `hsl(${diceValue * 60}, 70%, 30%)`;
    };
    updateDice();

    // Use the changed event to trigger the rerender whenever the value changes.
    diceMap.on("valueChanged", updateDice);
};
