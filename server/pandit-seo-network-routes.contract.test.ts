import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";

import { insertSiteSettingsSchema } from "@shared/schema";
import { storage } from "./storage";
import {
  getPanditSeoNetworkProjection,
  invalidatePanditSeoNetworkCache,
} from "./pandit-seo-network/cache";
import { registerPanditSeoNetworkAdminRoutes } from "./pandit-seo-network/admin-routes";
import { registerPanditSeoNetworkRoutes } from "./pandit-seo-network/public-api";

test("rollout gate and editorial route payloads follow the admin contract", async () => {
  assert.deepEqual(
    insertSiteSettingsSchema.parse({ panditSeoNetworkEnabled: true }),
    { panditSeoNetworkEnabled: true },
  );
  const original = {
    getSiteSettings: storage.getSiteSettings,
    upsertSiteSettings: storage.upsertSiteSettings,
    listPanditSeoEditorials: storage.listPanditSeoEditorials,
    getPanditSeoEditorial: storage.getPanditSeoEditorial,
    upsertPanditSeoEditorial: storage.upsertPanditSeoEditorial,
    logAdminAction: storage.logAdminAction,
  };
  let enabled = false;
  let editorial: any = null;

  (storage as any).getSiteSettings = async () => ({ panditSeoNetworkEnabled: enabled });
  (storage as any).upsertSiteSettings = async (value: { panditSeoNetworkEnabled: boolean }) => {
    enabled = value.panditSeoNetworkEnabled;
    return { panditSeoNetworkEnabled: enabled };
  };
  (storage as any).listPanditSeoEditorials = async () => editorial ? [editorial] : [];
  (storage as any).getPanditSeoEditorial = async (entityType: string, entityKey: string) =>
    editorial?.entityType === entityType && editorial?.entityKey === entityKey ? editorial : undefined;
  (storage as any).upsertPanditSeoEditorial = async (value: any) => {
    editorial = { ...value, revision: (editorial?.revision || 0) + 1 };
    return editorial;
  };
  (storage as any).logAdminAction = async () => ({});

  invalidatePanditSeoNetworkCache();
  await getPanditSeoNetworkProjection({
    dependencies: {
      getPandits: async () => [],
      getStates: async () => [{ id: 1, name: "Maharashtra", code: "MH" }],
      getCities: async () => [{ id: 10, stateId: 1, name: "Pune", slug: "pune" }],
      getStorefront: async () => null,
      getServices: async () => [],
    },
  });

  const app = express();
  app.use(express.json());
  registerPanditSeoNetworkAdminRoutes(app, (req: any, _res: any, next: any) => {
    req.adminUserId = 42;
    next();
  });
  registerPanditSeoNetworkRoutes(app);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  try {
    let response = await fetch(`${baseUrl}/api/pandit-seo-network/cities/pune`);
    assert.equal(response.status, 404);

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-network`);
    assert.equal(response.status, 200);
    const network = await response.json();
    assert.equal(network.enabled, false);
    assert.equal(network.cities[0].entityKey, "city:10");
    assert.deepEqual(network.summary, {
      profiles: 0,
      cities: 1,
      cityServices: 0,
      indexable: 0,
      noindex: 1,
      notFound: 0,
    });
    assert.deepEqual(network.editorials, []);
    assert.equal(typeof network.reasonCounts, "object");

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-editorial`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-network/rollout`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: true }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { enabled: true });

    await getPanditSeoNetworkProjection({
      dependencies: {
        getPandits: async () => [],
        getStates: async () => [{ id: 1, name: "Maharashtra", code: "MH" }],
        getCities: async () => [{ id: 10, stateId: 1, name: "Pune", slug: "pune" }],
        getStorefront: async () => null,
        getServices: async () => [],
      },
    });
    response = await fetch(`${baseUrl}/api/pandit-seo-network/cities/pune`);
    assert.equal(response.status, 200);

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-editorial/city/${encodeURIComponent("city:10")}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        introduction: "Local booking guidance.",
        faqs: [{ question: "How do I book?", answer: "" }],
      }),
    });
    assert.equal(response.status, 400);

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-editorial/city/${encodeURIComponent("city:10")}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        introduction: "Local booking guidance.",
        faqs: [{ question: "How do I book?", answer: "Choose an available Pandit." }],
      }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "draft");

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-editorial/city/${encodeURIComponent("city:10")}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    assert.equal(response.status, 409);

    for (const status of ["reviewed", "published"]) {
      response = await fetch(`${baseUrl}/api/admin/pandit-seo-editorial/city/${encodeURIComponent("city:10")}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, status);
    }

    response = await fetch(`${baseUrl}/api/admin/pandit-seo-editorial`);
    assert.equal(response.status, 200);
    assert.equal((await response.json())[0].status, "published");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    (storage as any).getSiteSettings = original.getSiteSettings;
    (storage as any).upsertSiteSettings = original.upsertSiteSettings;
    (storage as any).listPanditSeoEditorials = original.listPanditSeoEditorials;
    (storage as any).getPanditSeoEditorial = original.getPanditSeoEditorial;
    (storage as any).upsertPanditSeoEditorial = original.upsertPanditSeoEditorial;
    (storage as any).logAdminAction = original.logAdminAction;
    invalidatePanditSeoNetworkCache();
  }
});