import type { Address } from "viem";

export const MAX_TRACK_LENGTH = 42;
export const MAX_ARTIST_LENGTH = 36;
export const MAX_VIBE_LENGTH = 18;
export const MAX_NOTE_LENGTH = 160;

export const vinylLogAbi = [
  {
    type: "event",
    name: "LogCreated",
    inputs: [
      { name: "logId", type: "uint256", indexed: true },
      { name: "listener", type: "address", indexed: true },
      { name: "track", type: "string", indexed: false },
      { name: "artist", type: "string", indexed: false },
      { name: "vibe", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "createLog",
    stateMutability: "nonpayable",
    inputs: [
      { name: "track", type: "string" },
      { name: "artist", type: "string" },
      { name: "vibe", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "logId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getLog",
    stateMutability: "view",
    inputs: [{ name: "logId", type: "uint256" }],
    outputs: [
      { name: "listener", type: "address" },
      { name: "track", type: "string" },
      { name: "artist", type: "string" },
      { name: "vibe", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextLogId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredVinylLogContractAddress =
  process.env.NEXT_PUBLIC_VINYL_LOG_CONTRACT_ADDRESS?.trim();

export const vinylLogContractAddress = isAddressLike(
  configuredVinylLogContractAddress,
)
  ? (configuredVinylLogContractAddress as Address)
  : undefined;
