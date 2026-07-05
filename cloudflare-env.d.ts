declare type KvStoredValueType = "text" | "json" | "arrayBuffer" | "stream";

declare interface KVListResult {
  keys: Array<{ name: string }>;
  list_complete: boolean;
  cursor?: string;
}

declare interface KVNamespace {
  get<T = string>(key: string, type?: KvStoredValueType): Promise<T | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<KVListResult>;
}

declare interface CloudflareEnv {
  TOURNAMENT_SESSIONS_KV: KVNamespace;
}
