"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Terminal,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

interface RegisteredClient {
  id: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  createdAt: string;
}

export default function DeveloperConsolePage() {
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [appName, setAppName] = useState("");
  const [redirectUris, setRedirectUris] = useState<string[]>(["http://localhost:3001/api/auth/callback"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Result state (shown once)
  const [createdCredentials, setCreatedCredentials] = useState<{
    clientId: string;
    plainSecret: string;
    appName: string;
    redirectUri: string;
  } | null>(null);

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshClients = async () => {
    try {
      const res = await fetch("/api/developer/apps");
      const data = await res.json();
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients);
      }
    } catch (e) {
      console.error("Failed to refresh clients:", e);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/developer/apps");
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.clients)) {
          setClients(data.clients);
        }
      } catch (e) {
        console.error("Failed to load clients:", e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddUri = () => {
    setRedirectUris([...redirectUris, ""]);
  };

  const handleRemoveUri = (index: number) => {
    if (redirectUris.length <= 1) return;
    setRedirectUris(redirectUris.filter((_, i) => i !== index));
  };

  const handleUriChange = (index: number, value: string) => {
    const updated = [...redirectUris];
    updated[index] = value;
    setRedirectUris(updated);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const filteredUris = redirectUris.map((u) => u.trim()).filter(Boolean);
    if (!appName.trim() || filteredUris.length === 0) {
      setError("Please provide an app name and at least one valid redirect URI.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName.trim(),
          redirectUris: filteredUris,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || "Failed to create application.");
      }

      setCreatedCredentials({
        clientId: data.client.clientId,
        plainSecret: data.plainSecret,
        appName: data.client.name,
        redirectUri: filteredUris[0],
      });

      // Refresh list
      refreshClients();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating application";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCreatedCredentials(null);
    setAppName("");
    setRedirectUris(["http://localhost:3001/api/auth/callback"]);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080809] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100 dark:bg-white/5 text-[11px] font-mono tracking-widest text-zinc-700 dark:text-zinc-300 uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OAuth 2.0 & OIDC Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="text-stroke font-black">DEVELOPER</span>{" "}
              <span className="text-black dark:text-white">CONSOLE</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Register and govern client applications, manage whitelisted redirect URIs, and obtain zero-password credentials for your internal services.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.99] transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Register New Application</span>
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316]">
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-500">Active Applications</div>
            <div className="text-2xl font-bold font-mono mt-1 text-black dark:text-white">
              {loading ? "..." : clients.length}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316]">
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-500">Supported Grant Types</div>
            <div className="text-sm font-semibold font-mono mt-2 text-zinc-800 dark:text-zinc-200">
              authorization_code + PKCE, refresh_token
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121316]">
            <div className="text-xs uppercase font-mono tracking-wider text-zinc-500">Secret Storage Security</div>
            <div className="text-sm font-semibold font-mono mt-2 text-zinc-800 dark:text-zinc-200">
              SHA-256 Asymmetric Hashed (Show-Once Policy)
            </div>
          </div>
        </div>

        {/* Client Apps List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-zinc-500" />
              <span>Registered Client Services</span>
            </h2>
            <span className="text-xs font-mono text-zinc-500">{clients.length} Total</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading registered applications...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl p-8 bg-zinc-50/50 dark:bg-[#121316]/50">
              <Lock className="w-8 h-8 mx-auto text-zinc-400 mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-black dark:text-white">No applications registered yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Create your first client application to obtain Client ID & Secret for your service integration.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Application</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clients.map((client) => {
                const testLoginUrl = `/oauth/authorize?client_id=${encodeURIComponent(
                  client.clientId
                )}&redirect_uri=${encodeURIComponent(
                  client.redirectUris[0] || "http://localhost:3000/api/auth/callback"
                )}&response_type=code&state=demo-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256`;

                return (
                  <div
                    key={client.id}
                    className="p-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121316] hover:border-zinc-400 dark:hover:border-white/25 transition shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-black dark:text-white tracking-tight">
                          {client.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Registered: {new Date(client.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <a
                        href={testLoginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-white/15 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition shrink-0"
                      >
                        <span>Test Auth Flow</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                          Client ID
                        </span>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/5">
                          <code className="text-zinc-800 dark:text-zinc-200 truncate">{client.clientId}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(client.clientId, `client-${client.id}`)}
                            className="p-1 text-zinc-500 hover:text-black dark:hover:text-white transition shrink-0 ml-2"
                            title="Copy Client ID"
                          >
                            {copiedKey === `client-${client.id}` ? (
                              <Check className="w-3.5 h-3.5 text-black dark:text-white" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                          Whitelisted Redirect URIs ({client.redirectUris.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {client.redirectUris.map((uri, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 truncate max-w-full"
                              title={uri}
                            >
                              {uri}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Register Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#121316] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {!createdCredentials ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                    <KeyRound className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Register Client Application</h3>
                </div>
                <p className="text-xs text-zinc-500 mb-5">
                  Provision an OAuth 2.0 / OIDC identity client with PKCE security enforcement.
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Application Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Saveroute API or Savetable Web"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Callback / Redirect URIs
                      </label>
                      <button
                        type="button"
                        onClick={handleAddUri}
                        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add URI</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {redirectUris.map((uri, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="https://example.com/api/auth/callback"
                            value={uri}
                            onChange={(e) => handleUriChange(idx, e.target.value)}
                            required
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/60 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition"
                          />
                          {redirectUris.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUri(idx)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition shrink-0"
                              title="Remove URI"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Must be a valid HTTPS URL (or HTTP localhost for development).
                    </span>
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Create Application</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Success Credential Screen */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-white">Credentials Generated</h3>
                </div>

                <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Store these credentials securely.</span>
                    For security purposes, Savelo IdP only stores cryptographic hashes. The Client Secret will never be displayed again.
                  </div>
                </div>

                {/* Client ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Client ID
                  </label>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/10 font-mono text-xs">
                    <span className="truncate text-zinc-900 dark:text-zinc-100">{createdCredentials.clientId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdCredentials.clientId, "modal-client-id")}
                      className="p-1 text-zinc-500 hover:text-black dark:hover:text-white ml-2"
                    >
                      {copiedKey === "modal-client-id" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Client Secret */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Client Secret (Copy Now)
                  </label>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/10 font-mono text-xs">
                    <span className="truncate text-zinc-900 dark:text-zinc-100">{createdCredentials.plainSecret}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdCredentials.plainSecret, "modal-client-secret")}
                      className="p-1 text-zinc-500 hover:text-black dark:hover:text-white ml-2"
                    >
                      {copiedKey === "modal-client-secret" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Copy .env snippet */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const envSnippet = `# Savelo IdP Integration\nSAVELO_IDP_ISSUER="http://localhost:3000"\nSAVELO_CLIENT_ID="${createdCredentials.clientId}"\nSAVELO_CLIENT_SECRET="${createdCredentials.plainSecret}"\nSAVELO_REDIRECT_URI="${createdCredentials.redirectUri}"\n`;
                      handleCopy(envSnippet, "modal-env-snippet");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-300 dark:border-white/15 text-xs font-mono text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>
                      {copiedKey === "modal-env-snippet" ? "Copied .env Snippet to Clipboard!" : "Copy .env Configuration"}
                    </span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                  >
                    I Have Saved My Secret
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
