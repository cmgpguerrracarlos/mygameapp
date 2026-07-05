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

declare interface R2ObjectBody {
  body: ReadableStream | null;
  httpMetadata?: {
    contentType?: string;
  };
}

declare interface R2Object {
  key: string;
}

declare interface R2ListResult {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

declare interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<R2ListResult>;
}

declare interface CloudflareEnv {
  TOURNAMENT_SESSIONS_KV: KVNamespace;
  TOURNAMENT_UPLOADS: R2Bucket;
}
