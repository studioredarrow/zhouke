"use client";

import { useEffect, useState, useRef } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useConnectModal,
  useDisconnect,
  useSendTransaction,
  useReadContract,
} from "thirdweb/react";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { claimTo } from "thirdweb/extensions/erc1155";
import { client } from "./client";

// ============================================
// CONFIGURATION
// ============================================
const CONTRACT_ADDRESS = "0x293fc126bB74363F75c160B43A574f3C40515df5";
const TOKEN_ID = 0n;
const QUANTITY_OPTIONS = [1, 10, 50, 100];

// Contract instance
const contract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESS,
});

// ============================================
// MAIN COMPONENT
// ============================================
export default function MintPage() {
  const [quantity, setQuantity] = useState(1);
  const [mintState, setMintState] = useState<
    "idle" | "minting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // Thirdweb hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { mutateAsync: sendTransaction, isPending } = useSendTransaction();

  // Read total supply using direct contract call
  const { data: totalSupply } = useReadContract({
    contract,
    method: "function totalSupply(uint256 id) view returns (uint256)",
    params: [TOKEN_ID],
  });

  // ============================================
  // IFRAME RESIZE OBSERVER
  // ============================================
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "resize", height }, "*");
    };

    // Initial send
    sendHeight();

    // Observe changes
    const observer = new ResizeObserver(() => {
      sendHeight();
    });

    observer.observe(document.body);

    return () => observer.disconnect();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleConnect = async () => {
    try {
      await connect({ client });
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const handleDisconnect = () => {
    if (wallet) disconnect(wallet);
  };

  const handleMint = async () => {
    if (!account) return;

    setMintState("minting");
    setErrorMessage("");

    try {
      // Use Thirdweb's claimTo extension for DropERC1155
      const transaction = claimTo({
        contract,
        to: account.address,
        tokenId: TOKEN_ID,
        quantity: BigInt(quantity),
      });

      const result = await sendTransaction(transaction);
      setTxHash(result.transactionHash);
      setMintState("success");
    } catch (err: unknown) {
      console.error("Minting failed:", err);
      setMintState("error");

      if (err instanceof Error) {
        // User-friendly error messages
        if (err.message.includes("user rejected")) {
          setErrorMessage("Transaction was cancelled.");
        } else if (err.message.includes("insufficient funds")) {
          setErrorMessage("Insufficient funds for this transaction.");
        } else {
          setErrorMessage("Something went wrong. Please try again.");
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }
  };

  const resetMint = () => {
    setMintState("idle");
    setErrorMessage("");
    setTxHash("");
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatSupply = () => {
    if (totalSupply === undefined) return "...";
    return totalSupply.toString();
  };

  // ============================================
  // RENDER: SUCCESS STATE
  // ============================================
  if (mintState === "success") {
    return (
      <div
        ref={containerRef}
        className="min-h-screen flex items-center justify-center p-6"
      >
        <div className="text-center space-y-6 max-w-md">
          <div className="text-[var(--foreground)] text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] uppercase tracking-widest">
            Witness Recorded
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm">
            Your witness has been permanently inscribed on the blockchain.
          </p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[var(--foreground)] underline text-sm hover:opacity-70 transition-opacity"
          >
            View on Etherscan →
          </a>
          <div className="pt-4">
            <button
              onClick={resetMint}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Mint another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: MAIN UI
  // ============================================
  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Supply Counter - Industrial Data Art */}
        <div className="text-center py-8">
          <p
            className="text-8xl font-black text-[var(--foreground)] tracking-tighter leading-none"
            style={{
              fontFamily:
                "'Arial Narrow', Impact, 'Helvetica Neue', sans-serif",
            }}
          >
            {formatSupply()}
          </p>
          <p className="text-[var(--foreground-muted)] text-xs tracking-[0.3em] uppercase mt-4">
            {"// WITNESSES RECORDED"}
          </p>
        </div>

        {/* Main Card */}
        <div className="card p-6 space-y-6">
          {/* Wallet Connection */}
          {!account ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-primary"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <>
              {/* Connected Address */}
              <div className="flex items-center justify-between py-3 px-4 bg-neutral-800/50 rounded-lg">
                <span className="text-[var(--foreground)] text-sm font-mono">
                  {formatAddress(account.address)}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <p className="text-[var(--foreground-muted)] text-sm">
                  Quantity
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {QUANTITY_OPTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={`btn-secondary ${quantity === q ? "active" : ""}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {mintState === "error" && errorMessage && (
                <div className="py-3 px-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <p className="text-red-400 text-sm text-center">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={isPending || mintState === "minting"}
                className="btn-primary"
              >
                {mintState === "minting" || isPending ? "Minting..." : "Mint"}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--foreground-muted)] text-xs">
          Sepolia Testnet • Free Mint
        </p>
      </div>
    </div>
  );
}
