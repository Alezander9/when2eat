import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";

export default function App() {
  return (
    <main>
      <h1>when2eat</h1>
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
    </main>
  );
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | { email: string }>("email");
  const [error, setError] = useState<string | null>(null);

  return step === "email" ? (
    <div>
      <p>Sign in to set up your when2eat page</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const formData = new FormData(e.currentTarget);
          const email = formData.get("email") as string;
          if (!email.endsWith("@stanford.edu")) {
            setError("Please use your @stanford.edu email");
            return;
          }
          void signIn("resend-otp", formData)
            .then(() => setStep({ email }))
            .catch((err: Error) => setError(err.message));
        }}
      >
        <input name="email" type="email" placeholder="sunet@stanford.edu" />
        <button type="submit">Send code</button>
      </form>
      {error && <p>{error}</p>}
    </div>
  ) : (
    <div>
      <p>Enter the code sent to {step.email}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const formData = new FormData(e.currentTarget);
          void signIn("resend-otp", formData).catch((err: Error) =>
            setError(err.message),
          );
        }}
      >
        <input
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          maxLength={6}
        />
        <input name="email" value={step.email} type="hidden" />
        <button type="submit">Verify</button>
        <button type="button" onClick={() => setStep("email")}>
          Cancel
        </button>
      </form>
      {error && <p>{error}</p>}
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

  if (profile === undefined) return <p>Loading...</p>;
  if (profile === null) return <p>Setting up your profile...</p>;

  return (
    <div>
      <p>Your when2eat page:</p>
      <a href={`/${profile.sunetId}`}>/{profile.sunetId}</a>
      <button onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}
