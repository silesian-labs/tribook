import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { config } from "../config.js";
import type { VaultSnapshot } from "../domain.js";

type MoveFields = Record<string, unknown>;

export class ChainObserver {
  readonly client = new SuiJsonRpcClient({
    url: config.SUI_RPC_URL,
    network: config.SUI_NETWORK,
  });

  async vault(): Promise<VaultSnapshot> {
    const response = await this.client.getObject({
      id: config.VAULT_ID,
      options: { showContent: true },
    });
    if (response.error || !response.data)
      throw new Error(`Vault unavailable: ${JSON.stringify(response.error)}`);
    const content = response.data.content;
    if (!content || content.dataType !== "moveObject")
      throw new Error("Vault is not a Move object");
    const fields = content.fields as MoveFields;
    const scale = 10 ** config.USDC_DECIMALS;
    const idle =
      readNumeric(fields, ["usdc_balance", "balance", "value"]) / scale;
    const spot = readNumeric(fields, ["spot_allocated"]) / scale;
    const margin = readNumeric(fields, ["margin_allocated"]) / scale;
    return {
      observedAt: new Date().toISOString(),
      objectVersion: response.data.version,
      idleUsdc: idle,
      spotAllocatedUsdc: spot,
      marginAllocatedUsdc: margin,
      totalUsdc: idle + spot + margin,
      raw: fields,
    };
  }
}

function readNumeric(root: unknown, path: string[]): number {
  let value: unknown = root;
  for (const key of path) {
    if (typeof value === "number" || typeof value === "string")
      return Number(value);
    if (!isRecord(value) || !(key in value)) return 0;
    value = value[key];
    if (isRecord(value) && "fields" in value) value = value.fields;
  }
  if (typeof value === "number" || typeof value === "string")
    return Number(value);
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
