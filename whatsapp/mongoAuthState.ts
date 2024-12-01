/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-multi-assign */
/* eslint-disable no-undef */

import { Collection } from "mongodb";

/* eslint-disable no-empty */
const { proto } = require("@whiskeysockets/baileys/WAProto");
const { initAuthCreds } = require("@whiskeysockets/baileys/lib/Utils/auth-utils");
const {
  Curve,
  signedKeyPair,
} = require("@whiskeysockets/baileys/lib/Utils/crypto");
const {
  generateRegistrationId, BufferJSON
} = require("@whiskeysockets/baileys/lib/Utils/generics");
const { randomBytes } = require("crypto");

export async function useMongoDBAuthState(collection: Collection) {
  const writeData = (data: any, id: string) => {
    const informationToStore = JSON.parse(
      JSON.stringify(data, BufferJSON.replacer)
    );
    const update = {
      $set: {
        ...informationToStore,
      },
    };
    return collection.updateOne({ _id: id }, update, { upsert: true });
  };
  const readData = async (id) => {
    try {
      const data = JSON.stringify(await collection.findOne({ _id: id }));
      return JSON.parse(data, BufferJSON.reviver);
    } catch (error) {
      return null;
    }
  };
  const removeData = async (id) => {
    try {
      await collection.deleteOne({ _id: id });
    } catch (_a) {}
  };
  // const creds = (await readData("creds")) || initAuthCreds();
  const creds = (await readData("creds")) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id: string) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key") {
                value = proto.Message.AppStateSyncKeyData.fromObject(data);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: { [category: string]: { [id: string]: any } }) => {
          const tasks: Promise<any>[] = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key) as never);
              } else {
                tasks.push(removeData(key) as never);
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, "creds");
    },
    removeCreds: () => {
      return removeData("creds");
    }
  };
};