import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Field, FormError, SubmitButton } from "./AuthLayout";
import { useAuth } from "@/auth/AuthContext";
import { parseEmail } from "@/lib/validation";

type FieldName = "email" | "password";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailCheck = parseEmail(email);
  // Sign-in only checks that something was entered. Applying the sign-up
  // strength rules here would tell an attacker which passwords are too short
  // to be real, and would lock out anyone whose account predates the rule.
  const passwordError = password ? null : "Password is required";

  const errors = {
    email: emailCheck.ok ? null : emailCheck.error,
    password: passwordError,
  };
  const invalid = Boolean(errors.email || errors.password);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setError("");
    if (invalid) return;

    setSubmitting(true);
    try {
      await login(emailCheck.ok ? emailCheck.value : email, password);
      // Navigating only after the promise resolves is what makes this a real
      // gate: the old version redirected on a string match and let anyone in.
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      kicker="Scheduler VIT"
      title="Sign in"
      footer={
        <>
          No account yet? <Link to="/signup">Create one</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <FormError message={error} />}

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email ? errors.email : null}
        />

        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={touched.password ? errors.password : null}
        />

        <SubmitButton disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
