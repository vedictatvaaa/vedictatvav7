import { db } from "../db";
import { storage } from "../storage";
import { indianCities, indianStates } from "@shared/schema";
import {
  buildPanditSeoNetworkProjection,
  type NetworkCity,
  type NetworkState,
  type PanditNetworkCandidate,
  type PanditSeoNetworkProjection,
} from "./project";

export type PanditSeoNetworkDependencies = {
  getPandits: () => Promise<any[]>;
  getStates: () => Promise<NetworkState[]>;
  getCities: () => Promise<NetworkCity[]>;
  getStorefront: (panditId: number) => Promise<any>;
  getServices: (panditId: number) => Promise<any[]>;
};

const defaultDependencies: PanditSeoNetworkDependencies = {
  getPandits: () => storage.getPandits(),
  getStates: () => db.select().from(indianStates),
  getCities: () => db.select().from(indianCities),
  getStorefront: (panditId) => storage.getPanditStorefrontByPanditId(panditId),
  getServices: (panditId) => storage.listPanditServicesWithMaster(panditId, true),
};

export async function resolvePanditSeoNetworkProjection(
  dependencies: PanditSeoNetworkDependencies = defaultDependencies,
): Promise<PanditSeoNetworkProjection> {
  const [pandits, states, cities] = await Promise.all([
    dependencies.getPandits(),
    dependencies.getStates(),
    dependencies.getCities(),
  ]);

  const candidates: PanditNetworkCandidate[] = await Promise.all(
    pandits.map(async (pandit) => {
      const [storefront, services] = await Promise.all([
        dependencies.getStorefront(pandit.id),
        dependencies.getServices(pandit.id),
      ]);
      return { pandit, storefront, services };
    }),
  );

  return buildPanditSeoNetworkProjection({ candidates, states, cities });
}