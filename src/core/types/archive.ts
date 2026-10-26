export type ArchiveFile = { name: string; url: URL; size: number; lastModified: Date };
export type ArchiveHandle = { createWritable: () => Promise<WritableStream<Uint8Array>> };
