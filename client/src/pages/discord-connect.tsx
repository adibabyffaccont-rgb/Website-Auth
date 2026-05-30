import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link2, Hash, Shield, Bot, CheckCircle, XCircle, Loader2, Copy, Check, ExternalLink } from "lucide-react";

type Stage = "form" | "loading" | "success" | "error";

export default function DiscordConnect() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [discordUserId, setDiscordUserId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [linkedEmail, setLinkedEmail] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Discord purple/indigo theme
  const theme = {
    bgGradient: "bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950",
    blob1: "bg-indigo-600/30",
    blob2: "bg-violet-600/20",
    blob3: "bg-purple-500/10",
    glowGradient: "bg-gradient-to-r from-indigo-600/20 to-violet-600/20",
    textGradient: "bg-gradient-to-r from-indigo-400 to-violet-400",
    lineGradient: "bg-gradient-to-r from-indigo-500 to-violet-500",
    dot1: "bg-indigo-500",
    dot2: "bg-violet-500",
    mouseGlow: "99, 102, 241",
    cardGlow: "bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-indigo-600/10",
    cardBorder: "border-indigo-500/30",
    cardShadow: "0 0 80px rgba(99, 102, 241, 0.15), 0 0 120px rgba(139, 92, 246, 0.08), inset 0 0 60px rgba(0, 0, 0, 0.5)",
    topLine: "bg-gradient-to-r from-transparent via-indigo-500 to-transparent",
    innerGlow: "bg-gradient-to-b from-indigo-500/5 to-transparent",
    ring: "ring-indigo-500/40",
    shadow: "shadow-indigo-500/60",
    logoBg: "bg-gradient-to-br from-indigo-500/20 to-violet-500/20",
    inputFocus: "focus:ring-indigo-500/50 focus:border-indigo-500/50",
    inputHover: "hover:border-indigo-500/30",
    buttonBg: "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600",
    buttonShadow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.7),0_0_60px_rgba(139,92,246,0.4)]",
    buttonGlow: "bg-gradient-to-r from-indigo-400/0 via-white/25 to-violet-400/0",
    corner1: "bg-gradient-to-br from-indigo-500/10 to-transparent",
    corner2: "bg-gradient-to-bl from-violet-500/10 to-transparent",
    corner3: "bg-gradient-to-tr from-indigo-500/10 to-transparent",
    corner4: "bg-gradient-to-tl from-violet-500/10 to-transparent",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discordUserId.trim() || !verificationCode.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both your Discord User ID and verification code.",
        duration: 4000,
      });
      return;
    }

    // Basic Discord ID validation (17–19 digits)
    if (!/^\d{17,19}$/.test(discordUserId.trim())) {
      toast({
        variant: "destructive",
        title: "Invalid Discord ID",
        description: "Discord User IDs are 17–19 digit numbers. Enable Developer Mode in Discord settings to copy it.",
        duration: 5000,
      });
      return;
    }

    const codeClean = verificationCode.trim().toUpperCase();
    if (codeClean.length !== 8) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The verification code should be exactly 8 characters.",
        duration: 4000,
      });
      return;
    }

    setStage("loading");

    try {
      const response = await fetch("/api/discord/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          discordUserId: discordUserId.trim(),
          code: codeClean,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Verification failed. Please try again.");
        setStage("error");
        return;
      }

      setLinkedEmail(data.linkedUser?.email || "your site account");
      setStage("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please check your connection.");
      setStage("error");
    }
  };

  const handleCopyId = async () => {
    if (!discordUserId) return;
    try {
      await navigator.clipboard.writeText(discordUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleReset = () => {
    setStage("form");
    setErrorMessage("");
    setVerificationCode("");
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center overflow-hidden ${theme.bgGradient}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 h-96 w-96 animate-pulse ${theme.blob1} blur-[120px] rounded-full`} />
          <div className={`absolute -bottom-40 -left-40 h-96 w-96 animate-pulse ${theme.blob2} blur-[120px] rounded-full animation-delay-2000`} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
          <p className="text-gray-400">Loading auth state...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center overflow-hidden ${theme.bgGradient}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -right-40 h-96 w-96 animate-pulse ${theme.blob1} blur-[120px] rounded-full`} />
          <div className={`absolute -bottom-40 -left-40 h-96 w-96 animate-pulse ${theme.blob2} blur-[120px] rounded-full animation-delay-2000`} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative group max-w-md w-full mx-4" onMouseMove={handleMouseMove}>
          <div className={`absolute -inset-1 ${theme.cardGlow} rounded-3xl blur-2xl opacity-60`} />
          <div className={`relative bg-black/95 backdrop-blur-2xl rounded-3xl border ${theme.cardBorder} shadow-2xl overflow-hidden p-8 sm:p-10`} style={{ boxShadow: theme.cardShadow }}>
            <div className={`absolute top-0 left-0 right-0 h-px ${theme.topLine} opacity-75`} />
            
            <div className="text-center space-y-6">
              <div className={`relative mx-auto w-20 h-20 rounded-full ring-4 ${theme.ring} ring-offset-4 ring-offset-black flex items-center justify-center bg-black/50`}>
                <Shield className="h-10 w-10 text-red-500 relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Authentication Required</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  You must be logged in to link your Discord account.
                </p>
              </div>
              
              <a
                href="/login"
                className={`relative w-full h-12 ${theme.buttonBg} text-white font-semibold rounded-xl overflow-hidden flex items-center justify-center gap-2 transition-all duration-300 ${theme.buttonShadow} hover:scale-[1.02] active:scale-[0.98]`}
              >
                Sign In to Your Account
              </a>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-px ${theme.topLine} opacity-75`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex items-center justify-center overflow-hidden ${theme.bgGradient}`}>
      {/* Animated Background Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 h-96 w-96 animate-pulse ${theme.blob1} blur-[120px] rounded-full`} />
        <div className={`absolute -bottom-40 -left-40 h-96 w-96 animate-pulse ${theme.blob2} blur-[120px] rounded-full animation-delay-2000`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 animate-pulse ${theme.blob3} blur-[120px] rounded-full animation-delay-4000`} />
      </div>

      {/* Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-center gap-12 max-w-6xl mx-auto">

          {/* Left Side — Info Panel */}
          <div className="hidden lg:flex flex-col items-start justify-center w-1/2 space-y-6">
            <div className="relative">
              <div className={`absolute -inset-4 ${theme.glowGradient} blur-3xl rounded-full`} />
              <h1 className="relative text-5xl font-bold text-white leading-tight">
                Link Your<br />
                Discord to<br />
                <span className="relative inline-block">
                  <span className={`${theme.textGradient} bg-clip-text text-transparent`}>
                    ADI CHEATS
                  </span>
                  <div className={`absolute -bottom-2 left-0 right-0 h-1 ${theme.lineGradient} rounded-full`} />
                </span>
              </h1>
            </div>

            <p className="text-lg text-gray-300 max-w-md leading-relaxed">
              Connect your Discord account to unlock full bot management — manage licenses, users, and keys directly from your server.
            </p>

            <div className="space-y-4">
              {[
                { num: "1", text: "Run /connect in Discord" },
                { num: "2", text: "Copy your 8-character code" },
                { num: "3", text: "Paste it below with your Discord ID" },
                { num: "4", text: "Your accounts are now linked!" },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full ${theme.logoBg} border border-indigo-500/40 flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-bold text-indigo-400">{step.num}</span>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">{step.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 text-gray-400 pt-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                <span className="text-sm">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-500" />
                <span className="text-sm">Bot Integration</span>
              </div>
            </div>

            {/* Discord ID helper note */}
            <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-4 max-w-md">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-indigo-400 font-semibold">How to get your Discord ID:</span><br />
                Open Discord → Settings → Advanced → Enable Developer Mode.<br />
                Then right-click your name anywhere → Copy User ID.
              </p>
            </div>
          </div>

          {/* Right Side — Form Card */}
          <div className="w-full lg:w-1/2 max-w-md">
            <div className="relative group" onMouseMove={handleMouseMove}>
              {/* Mouse Glow */}
              <div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(${theme.mouseGlow}, 0.2), transparent 40%)`
                }}
              />

              {/* Ambient Glow */}
              <div className={`absolute -inset-1 ${theme.cardGlow} rounded-3xl blur-2xl opacity-60`} />

              {/* Main Card */}
              <div
                className={`relative bg-black/95 backdrop-blur-2xl rounded-3xl border ${theme.cardBorder} shadow-2xl overflow-hidden`}
                style={{ boxShadow: theme.cardShadow }}
              >
                {/* Top Line */}
                <div className={`absolute top-0 left-0 right-0 h-px ${theme.topLine} opacity-75`} />
                {/* Inner Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 ${theme.innerGlow} blur-2xl`} />

                <div className="p-8 sm:p-10 relative">
                  {/* Header */}
                  <div className="text-center space-y-4 mb-8">
                    <div className={`relative mx-auto w-20 h-20 rounded-full overflow-hidden ring-4 ${theme.ring} ring-offset-4 ring-offset-black shadow-lg ${theme.shadow} flex items-center justify-center bg-black/50`}>
                      <div className={`absolute inset-0 ${theme.logoBg} animate-pulse`} />
                      {/* Discord logo SVG */}
                      <svg className="h-10 w-10 text-indigo-400 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.102.127 18.116a19.979 19.979 0 0 0 6.0 3.026.077.077 0 0 0 .084-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.175 13.175 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent mb-2">
                        Discord Connect
                      </h2>
                      <p className="text-gray-500 text-sm">Link your Discord to the dashboard</p>
                    </div>
                  </div>

                  {/* ========== FORM STAGE ========== */}
                  {stage === "form" && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Discord User ID */}
                      <div className="space-y-2">
                        <label htmlFor="discord-id" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Hash className="h-4 w-4 text-indigo-500" />
                          Discord User ID
                        </label>
                        <div className="relative group">
                          <input
                            id="discord-id"
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 123456789012345678"
                            value={discordUserId}
                            onChange={(e) => setDiscordUserId(e.target.value.replace(/\D/g, ""))}
                            maxLength={19}
                            required
                            className={`w-full h-12 px-4 pr-12 bg-black/40 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${theme.inputFocus} focus:bg-black/60 transition-all duration-300 ${theme.inputHover} hover:bg-black/50 font-mono text-sm tracking-wider`}
                          />
                          {discordUserId && (
                            <button
                              type="button"
                              onClick={handleCopyId}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors duration-200"
                              title="Copy ID"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Enable Developer Mode in Discord → right-click your name → Copy User ID
                        </p>
                      </div>

                      {/* Verification Code */}
                      <div className="space-y-2">
                        <label htmlFor="verify-code" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-indigo-500" />
                          Verification Code
                        </label>
                        <input
                          id="verify-code"
                          type="text"
                          placeholder="e.g. XKP2MNJQ"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                          maxLength={8}
                          required
                          className={`w-full h-12 px-4 bg-black/40 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${theme.inputFocus} focus:bg-black/60 transition-all duration-300 ${theme.inputHover} hover:bg-black/50 font-mono text-lg tracking-[0.5em] text-center uppercase`}
                        />
                        <p className="text-xs text-gray-600">
                          Get this code by running <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">/connect</code> in your Discord server. Expires in 10 minutes.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className={`relative w-full h-12 ${theme.buttonBg} text-white font-semibold rounded-xl overflow-hidden group transition-all duration-300 ${theme.buttonShadow} focus:outline-none focus:ring-2 ${theme.inputFocus} focus:ring-offset-2 focus:ring-offset-black hover:scale-[1.02] active:scale-[0.98] mt-2`}
                      >
                        <div className={`absolute inset-0 ${theme.buttonGlow} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative flex items-center justify-center gap-2 font-bold tracking-wide">
                          <Link2 className="h-5 w-5" />
                          Link Account
                        </span>
                      </button>

                      <p className="text-xs text-center text-gray-600 mt-4">
                        You must be{" "}
                        <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-2">
                          logged in
                        </a>{" "}
                        to this dashboard for verification to work.
      </p>
                    </form>
                  )}

                  {/* ========== LOADING STAGE ========== */}
                  {stage === "loading" && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative">
                        <div className={`absolute inset-0 ${theme.logoBg} rounded-full blur-xl animate-pulse`} />
                        <Loader2 className="h-14 w-14 text-indigo-400 animate-spin relative z-10" />
                      </div>
                      <p className="text-gray-300 font-medium">Verifying your code...</p>
                      <p className="text-gray-600 text-sm">Linking Discord ID <code className="text-indigo-400">{discordUserId}</code></p>
                    </div>
                  )}

                  {/* ========== SUCCESS STAGE ========== */}
                  {stage === "success" && (
                    <div className="flex flex-col items-center text-center py-6 space-y-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                        <CheckCircle className="h-16 w-16 text-green-400 relative z-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">Account Linked!</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Your Discord (<code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{discordUserId}</code>) is now linked to <br />
                          <span className="text-green-400 font-medium">{linkedEmail}</span>
                        </p>
                      </div>

                      <div className="w-full bg-black/40 border border-green-500/20 rounded-xl p-4 text-left space-y-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">What you can do now:</p>
                        {[
                          "Manage licenses with /license create",
                          "Manage users with /user create",
                          "Generate keys with /key generate",
                          "View stats with /stats",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                            <span className="text-xs text-gray-400">{item}</span>
                          </div>
                        ))}
                      </div>

                      <a
                        href="/dashboard"
                        className={`relative w-full h-12 ${theme.buttonBg} text-white font-semibold rounded-xl overflow-hidden flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Go to Dashboard
                      </a>
                    </div>
                  )}

                  {/* ========== ERROR STAGE ========== */}
                  {stage === "error" && (
                    <div className="flex flex-col items-center text-center py-6 space-y-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
                        <XCircle className="h-16 w-16 text-red-400 relative z-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">Verification Failed</h3>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                          {errorMessage}
                        </p>
                      </div>

                      <div className="w-full bg-black/40 border border-red-500/20 rounded-xl p-4 text-left space-y-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Common issues:</p>
                        {[
                          "Code expired — run /connect again",
                          "Wrong Discord ID — must be all digits",
                          "Already linked — use /disconnect first",
                          "Not logged in to this website",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-red-500 rounded-full flex-shrink-0" />
                            <span className="text-xs text-gray-400">{item}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleReset}
                        className={`relative w-full h-12 ${theme.buttonBg} text-white font-semibold rounded-xl overflow-hidden group transition-all duration-300 ${theme.buttonShadow} hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative flex items-center justify-center gap-2 font-bold tracking-wide">
                          Try Again
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Line */}
                <div className={`absolute bottom-0 left-0 right-0 h-px ${theme.topLine} opacity-75`} />
                {/* Corner Accents */}
                <div className={`absolute top-0 left-0 w-20 h-20 ${theme.corner1} rounded-tl-3xl`} />
                <div className={`absolute top-0 right-0 w-20 h-20 ${theme.corner2} rounded-tr-3xl`} />
                <div className={`absolute bottom-0 left-0 w-20 h-20 ${theme.corner3} rounded-bl-3xl`} />
                <div className={`absolute bottom-0 right-0 w-20 h-20 ${theme.corner4} rounded-br-3xl`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
