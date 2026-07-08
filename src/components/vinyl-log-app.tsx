"use client";

import {
  Disc3,
  Headphones,
  Loader2,
  Radio,
  Search,
  Sparkles,
  Wallet,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_ARTIST_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TRACK_LENGTH,
  MAX_VIBE_LENGTH,
  vinylLogAbi,
  vinylLogContractAddress,
} from "@/lib/vinyl-log";

const VIBES = ["Late night", "Warm", "Electric", "Dreamy"] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return "--";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid track")) return "Track needs 1 to 42 characters.";
  if (error.message.includes("Invalid artist")) return "Artist needs 1 to 36 characters.";
  if (error.message.includes("Invalid vibe")) return "Choose a short vibe.";
  if (error.message.includes("Invalid note")) return "Note must stay under 160 characters.";
  return error.message;
}

function VinylCard({
  track,
  artist,
  vibe,
  note,
  listener,
  createdAt,
}: {
  track: string;
  artist: string;
  vibe: string;
  note: string;
  listener?: Address;
  createdAt?: bigint;
}) {
  const accent =
    vibe === "Electric"
      ? "from-[#32f6ff] to-[#b36bff]"
      : vibe === "Warm"
        ? "from-[#ffb84d] to-[#ff4d7d]"
        : vibe === "Dreamy"
          ? "from-[#9b8cff] to-[#ff85d5]"
          : "from-[#19f7a1] to-[#32f6ff]";

  return (
    <article className="relative overflow-hidden rounded-[8px] border border-[#2c3558] bg-[#080b18] p-5 text-[#f6f3ff] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-7">
      <div className={`absolute right-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-gradient-to-br ${accent} opacity-25 blur-2xl`} />
      <div className="relative grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="grid place-items-center">
          <div className={`relative h-[320px] w-[320px] rounded-full bg-gradient-to-br ${accent} p-[14px] shadow-[0_0_70px_rgba(50,246,255,0.18)] sm:h-[390px] sm:w-[390px]`}>
            <div className="h-full w-full rounded-full bg-[repeating-radial-gradient(circle_at_center,#0d1022_0,#0d1022_10px,#151936_11px,#151936_13px)] p-24">
              <div className="grid h-full w-full place-items-center rounded-full border-4 border-[#f6f3ff] bg-[#080b18]">
                <Disc3 className="h-16 w-16" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[#32f6ff]">
              Vinyl Log
            </p>
            <h2 className="mt-4 break-words text-5xl font-black leading-none sm:text-7xl">
              {track || "Untitled track"}
            </h2>
            <p className="mt-4 break-words text-3xl font-black text-[#ff85d5]">
              {artist || "Unknown artist"}
            </p>
            <div className="mt-6 inline-flex rounded-full border border-[#2c3558] bg-[#11162c] px-4 py-2 text-sm font-black">
              {vibe}
            </div>
          </div>

          <p className="mt-8 min-h-[150px] rounded-[8px] border border-[#2c3558] bg-[#11162c] p-4 text-xl font-bold leading-8 text-[#d9ddff]">
            {note || "No listening note written yet."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[8px] border border-[#2c3558] bg-[#0b1024] p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#32f6ff]">
                Listener
              </p>
              <p className="mt-2 text-xl font-black">{shortAddress(listener)}</p>
            </div>
            <div className="rounded-[8px] border border-[#2c3558] bg-[#0b1024] p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#32f6ff]">
                Played
              </p>
              <p className="mt-2 text-xl font-black">{formatDate(createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function VinylLogApp() {
  const [logIdInput, setLogIdInput] = useState("1");
  const [track, setTrack] = useState("Midnight Relay");
  const [artist, setArtist] = useState("Neon Atlas");
  const [vibe, setVibe] = useState<(typeof VIBES)[number]>("Late night");
  const [note, setNote] = useState("A clean synth loop for shipping after everyone else has gone quiet.");
  const [status, setStatus] = useState("Log a song moment and save it on Base.");
  const [lastAction, setLastAction] = useState<"create" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContractAsync,
    isPending: writing,
  } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedLogId = BigInt(Math.max(1, Number(logIdInput || "1")));

  const logQuery = useReadContract({
    abi: vinylLogAbi,
    address: vinylLogContractAddress,
    functionName: "getLog",
    args: [parsedLogId],
    query: {
      enabled: Boolean(vinylLogContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: vinylLogAbi,
    address: vinylLogContractAddress,
    functionName: "nextLogId",
    query: {
      enabled: Boolean(vinylLogContractAddress),
      refetchInterval: 12000,
    },
  });

  const tuple = logQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const liveLog = useMemo(
    () =>
      tuple
        ? {
            listener: tuple[0],
            track: tuple[1],
            artist: tuple[2],
            vibe: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalLogs = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    track.trim().length > 0 &&
    track.trim().length <= MAX_TRACK_LENGTH &&
    artist.trim().length > 0 &&
    artist.trim().length <= MAX_ARTIST_LENGTH &&
    vibe.trim().length > 0 &&
    vibe.trim().length <= MAX_VIBE_LENGTH &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const createBlocker = !vinylLogContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_VINYL_LOG_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill track, artist, and vibe."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "create") return;

    void totalQuery.refetch();
    void logQuery.refetch();

    const logs = parseEventLogs({
      abi: vinylLogAbi,
      logs: receipt.logs,
      eventName: "LogCreated",
    });
    const logId = logs[0]?.args.logId;

    window.setTimeout(() => {
      if (logId) setLogIdInput(logId.toString());
      setStatus(
        logId
          ? `Vinyl Log #${logId.toString()} saved on Base.`
          : "Vinyl Log saved on Base. Load the newest Log ID.",
      );
    }, 0);
  }, [lastAction, logQuery, receipt, totalQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> =>
        Boolean(connector),
      )
      .filter(
        (connector, index, queue) =>
          queue.findIndex((item) => item.id === connector.id) === index,
      );

    if (connectorQueue.length === 0) {
      setStatus("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setStatus("Opening wallet connection...");

    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setStatus("Wallet connected. Save a Vinyl Log when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setStatus(friendlyError(lastError));
  }

  async function createLog() {
    const contractAddress = vinylLogContractAddress;

    if (createBlocker) {
      setStatus(createBlocker);
      return;
    }

    if (!contractAddress) {
      setStatus("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }

    try {
      setLastAction("create");
      setStatus("Confirm your song log in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: vinylLogAbi,
        functionName: "createLog",
        args: [track.trim(), artist.trim(), vibe.trim(), note.trim()],
        chainId: base.id,
      });
      setStatus("Vinyl Log sent. Waiting for Base confirmation...");
    } catch (error) {
      setStatus(friendlyError(error));
    }
  }

  const previewTrack = liveLog?.track || track;
  const previewArtist = liveLog?.artist || artist;
  const previewVibe = liveLog?.vibe || vibe;
  const previewNote = liveLog?.note ?? note;

  return (
    <main className="min-h-screen bg-[#050711] text-[#f6f3ff]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[8px] border border-[#2c3558] bg-[#0b1024] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.46)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[#32f6ff]">
                Vinyl Log
              </p>
              <h1 className="mt-2 text-4xl font-black leading-none">
                Save a song moment.
              </h1>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] border border-[#32f6ff] bg-[#11162c] text-[#32f6ff]">
              <Disc3 className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-[#2c3558] bg-[#11162c] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#32f6ff]">
                Logs
              </p>
              <p className="mt-2 text-3xl font-black">{totalLogs}</p>
            </div>
            <div className="rounded-[8px] border border-[#2c3558] bg-[#171027] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ff85d5]">
                Chain
              </p>
              <p className="mt-2 text-xl font-black">Base</p>
            </div>
          </div>

          <section className="mt-4 rounded-[8px] border border-[#2c3558] bg-[#11162c] p-4">
            <h2 className="text-xl font-black">New log</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#32f6ff]">
                  Track
                </span>
                <input
                  value={track}
                  onChange={(event) => setTrack(event.target.value)}
                  maxLength={MAX_TRACK_LENGTH}
                  className="mt-1 w-full rounded-[8px] border border-[#2c3558] bg-[#080b18] px-3 py-3 font-black text-[#f6f3ff] outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#32f6ff]">
                  Artist
                </span>
                <input
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  maxLength={MAX_ARTIST_LENGTH}
                  className="mt-1 w-full rounded-[8px] border border-[#2c3558] bg-[#080b18] px-3 py-3 font-black text-[#f6f3ff] outline-none"
                />
              </label>

              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#32f6ff]">
                  Vibe
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {VIBES.map((value) => (
                    <button
                      key={value}
                      className={`rounded-[8px] border px-2 py-3 text-sm font-black ${
                        value === vibe
                          ? "border-[#32f6ff] bg-[#32f6ff] text-[#050711]"
                          : "border-[#2c3558] bg-[#080b18] text-[#f6f3ff]"
                      }`}
                      onClick={() => setVibe(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#32f6ff]">
                  Listening note
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={MAX_NOTE_LENGTH}
                  rows={4}
                  className="mt-1 w-full rounded-[8px] border border-[#2c3558] bg-[#080b18] px-3 py-3 text-sm font-bold leading-6 text-[#f6f3ff] outline-none"
                />
              </label>
            </div>
          </section>

          <div className="mt-4 space-y-3">
            {isConnected && chainId !== base.id ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#32f6ff] bg-[#32f6ff] px-4 py-3 font-black text-[#050711] disabled:opacity-60"
                disabled={switching}
                onClick={() => switchChain({ chainId: base.id })}
              >
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#ff85d5] px-4 py-3 font-black text-[#050711] disabled:opacity-60"
                disabled={writing || confirming}
                onClick={createLog}
              >
                {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Save Vinyl Log
              </button>
            )}

            {isConnected ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#2c3558] bg-[#080b18] px-4 py-3 font-black"
                onClick={disconnectWallet}
              >
                {shortAddress(address)}
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#2c3558] bg-[#f6f3ff] px-4 py-3 font-black text-[#050711] disabled:opacity-60"
                disabled={!selectedConnector || connecting}
                onClick={connectWallet}
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}

            <p className="rounded-[8px] border border-[#2c3558] bg-[#080b18] px-3 py-3 text-sm font-bold leading-6">
              {status}
            </p>
            {hash ? (
              <a
                className="block rounded-[8px] border border-[#2c3558] bg-[#080b18] px-3 py-3 text-xs font-black leading-5 text-[#32f6ff] underline"
                href={`https://basescan.org/tx/${hash}`}
                rel="noreferrer"
                target="_blank"
              >
                View transaction on BaseScan
              </a>
            ) : null}
            {createBlocker && isConnected ? (
              <p className="rounded-[8px] border border-[#2c3558] bg-[#11162c] px-3 py-3 text-xs font-bold leading-5 text-[#d9ddff]">
                {createBlocker}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="grid gap-4">
          <VinylCard
            track={previewTrack}
            artist={previewArtist}
            vibe={previewVibe}
            note={previewNote}
            listener={liveLog?.listener}
            createdAt={liveLog?.createdAt}
          />

          <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="rounded-[8px] border border-[#2c3558] bg-[#0b1024] p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <h2 className="text-2xl font-black">Load log</h2>
              </div>
              <label className="mt-4 block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#32f6ff]">
                  Log ID
                </span>
                <input
                  value={logIdInput}
                  onChange={(event) =>
                    setLogIdInput(event.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 w-full rounded-[8px] border border-[#2c3558] bg-[#080b18] px-3 py-3 text-2xl font-black text-[#f6f3ff] outline-none"
                />
              </label>
            </div>

            <div className="rounded-[8px] border border-[#2c3558] bg-[#0b1024] p-4">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#32f6ff]">
                What it does
              </p>
              <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-[#d9ddff]">
                Vinyl Log saves a song moment with track, artist, vibe, note,
                listener wallet, and timestamp on Base.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2c3558] bg-[#080b18] px-3 py-2 text-xs font-black">
                  <Headphones className="h-4 w-4 text-[#32f6ff]" /> Song memory
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2c3558] bg-[#080b18] px-3 py-2 text-xs font-black">
                  <Waves className="h-4 w-4 text-[#ff85d5]" /> Vibe tag
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2c3558] bg-[#080b18] px-3 py-2 text-xs font-black">
                  <Radio className="h-4 w-4 text-[#32f6ff]" /> Public by ID
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
