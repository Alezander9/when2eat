import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <header className="flex items-center gap-3 mb-2">
        <img src="/stanfoodicon.svg" alt="" className="w-10 h-10" />
        <h1 className="font-display text-4xl font-bold text-charcoal tracking-tight">
          when2eat
        </h1>
      </header>
      <p className="text-charcoal/60 font-body text-base mb-10">
        meal scheduling for Stanford
      </p>

      <div className="w-full max-w-sm">
        <Authenticated>
          <Dashboard />
        </Authenticated>
        <Unauthenticated>
          <SignIn />
        </Unauthenticated>
      </div>
    </main>
  );
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.endsWith("@stanford.edu")) {
      setError("Use your @stanford.edu email");
      return;
    }
    setSending(true);
    const formData = new FormData();
    formData.set("email", email);
    void signIn("resend-otp", formData)
      .then(() => setCodeSent(true))
      .catch((err: Error) => setError(err.message))
      .finally(() => setSending(false));
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("code", code);
    void signIn("resend-otp", formData).catch((err: Error) =>
      setError(err.message),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-charcoal/80 text-center text-sm">
        Log in with a Stanford email to get your booking page.
        <br />
        You'll need a{" "}
        <a
          href="https://cal.com/signup"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sf-red hover:text-sf-red-hover underline underline-offset-2"
        >
          cal.com
        </a>{" "}
        account for availability.
      </p>

      <form onSubmit={codeSent ? handleVerify : handleSendCode} className="space-y-3">
        <div>
          <label className="block text-sm font-display text-charcoal/70 mb-1">
            Stanford email
          </label>
          <input
            name="email"
            type="email"
            placeholder="sunet@stanford.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={codeSent}
            className="w-full px-4 py-3 rounded-lg bg-cream-dark/50 border border-cream-dark
                       text-charcoal placeholder:text-charcoal/40
                       focus:outline-none focus:ring-2 focus:ring-sf-red/30 focus:border-sf-red
                       disabled:opacity-50 transition"
          />
        </div>

        {codeSent && (
          <div>
            <label className="block text-sm font-display text-charcoal/70 mb-1">
              Verification code
            </label>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-cream-dark/50 border border-cream-dark
                         text-charcoal text-center text-2xl font-display tracking-[0.3em]
                         placeholder:text-base placeholder:tracking-normal
                         focus:outline-none focus:ring-2 focus:ring-sf-red/30 focus:border-sf-red
                         transition"
            />
            <p className="text-xs text-charcoal/50 mt-1 text-center">
              Code sent to {email}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 rounded-lg bg-sf-red text-white font-display font-bold
                     hover:bg-sf-red-hover active:scale-[0.98] disabled:opacity-50
                     transition cursor-pointer"
        >
          {sending ? "Sending..." : codeSent ? "Verify" : "Send code"}
        </button>

        {codeSent && (
          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setCode("");
              setError(null);
            }}
            className="w-full py-2 text-sm text-charcoal/50 hover:text-charcoal transition cursor-pointer"
          >
            Use a different email
          </button>
        )}
      </form>

      {error && (
        <p className="text-sf-red text-sm text-center">{error}</p>
      )}
    </div>
  );
}

function Dashboard() {
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.getMy);
  const createProfile = useMutation(api.profiles.create);

  useEffect(() => {
    if (profile === null) {
      void createProfile();
    }
  }, [profile, createProfile]);

  if (profile === undefined || profile === null) {
    return <p className="text-center text-charcoal/50">Loading...</p>;
  }

  const pageUrl = `/${profile.sunetId}`;

  return (
    <div className="space-y-4 text-center">
      <p className="text-charcoal/70 text-sm">Your booking page is live:</p>
      <a
        href={pageUrl}
        className="block py-4 px-6 rounded-lg bg-cream-dark border border-tan/30
                   text-sf-red font-display text-xl font-bold
                   hover:border-sf-red/30 transition"
      >
        when2eat{pageUrl}
      </a>
      <button
        onClick={() => void signOut()}
        className="text-sm text-charcoal/40 hover:text-charcoal transition cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
