import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const PUBLIC_LIST_LIMITS = {
  public_trades: 100,
  public_equity_history: 400,
  public_runs: 50,
};
const PUBLIC_COLLECTIONS = ["public_snapshot", ...Object.keys(PUBLIC_LIST_LIMITS)];
const PRIVATE_COLLECTIONS = ["control", "runs", "mcp_logs", "order_counts", "unlisted"];

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-trading-rules",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const name of [...PUBLIC_COLLECTIONS, ...PRIVATE_COLLECTIONS]) {
      await setDoc(doc(db, name, "seed"), { value: 1 });
    }
  });
});

const clients = () => [
  ["anonymous", env.unauthenticatedContext().firestore()],
  ["signed-in", env.authenticatedContext("someone").firestore()],
];

describe("public collections", () => {
  for (const name of PUBLIC_COLLECTIONS) {
    test(`${name}: anyone can get a document`, async () => {
      for (const [, db] of clients()) {
        await assertSucceeds(getDoc(doc(db, name, "seed")));
      }
    });

    test(`${name}: nobody can create, update or delete`, async () => {
      for (const [, db] of clients()) {
        await assertFails(setDoc(doc(db, name, "new"), { value: 2 }));
        await assertFails(updateDoc(doc(db, name, "seed"), { value: 2 }));
        await assertFails(deleteDoc(doc(db, name, "seed")));
      }
    });
  }

  test("public_snapshot: list is denied even with a limit", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDocs(query(collection(db, "public_snapshot"), limit(1))));
  });

  for (const [name, max] of Object.entries(PUBLIC_LIST_LIMITS)) {
    test(`${name}: list at the limit (${max}) is allowed`, async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertSucceeds(getDocs(query(collection(db, name), limit(max))));
    });

    test(`${name}: list over the limit is denied`, async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(getDocs(query(collection(db, name), limit(max + 1))));
    });

    test(`${name}: list without a limit is denied`, async () => {
      const db = env.unauthenticatedContext().firestore();
      await assertFails(getDocs(collection(db, name)));
    });
  }
});

describe("private collections", () => {
  for (const name of PRIVATE_COLLECTIONS) {
    test(`${name}: get, list and write are all denied`, async () => {
      for (const [, db] of clients()) {
        await assertFails(getDoc(doc(db, name, "seed")));
        await assertFails(getDocs(query(collection(db, name), limit(1))));
        await assertFails(setDoc(doc(db, name, "new"), { value: 2 }));
        await assertFails(updateDoc(doc(db, name, "seed"), { value: 2 }));
        await assertFails(deleteDoc(doc(db, name, "seed")));
      }
    });
  }

  test("subcollections under a public document are denied", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "public_snapshot", "seed", "nested", "x")));
  });
});
