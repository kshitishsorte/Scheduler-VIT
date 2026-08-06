import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Field, FormError, SubmitButton } from "./AuthLayout";
import { useAuth } from "@/auth/AuthContext";
import {
  LIMITS,
  parseEmail,
  parseName,
  parsePassword,
} from "@/lib/validation";

type FieldName = "firstName" | "lastName" | "email" | "password";

const EMPTY: Record<FieldName, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
};

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks = {
    firstName: parseName(form.firstName, "First name"),
    lastName: parseName(form.lastName, "Last name"),
    email: parseEmail(form.email),
    password: parsePassword(form.password),
  };

  const errorFor = (field: FieldName) =>
    touched[field] && !checks[field].ok ? checks[field].error : null;

  const invalid = Object.values(checks).some((check) => !check.ok);

  const set =
    (key: FieldName) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const blur = (key: FieldName) => () =>
    setTouched((current) => ({ ...current, [key]: true }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
    });
    setError("");
    if (invalid) return;

    setSubmitting(true);
    try {
      // Send the parsed values - trimmed names, lowercased email - so what is
      // stored matches what was validated.
      await signup({
        firstName: checks.firstName.ok ? checks.firstName.value : form.firstName,
        lastName: checks.lastName.ok ? checks.lastName.value : form.lastName,
        email: checks.email.ok ? checks.email.value : form.email,
        password: form.password,
      });
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
      title="Create account"
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <FormError message={error} />}

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field
              label="First name"
              name="firstName"
              autoComplete="given-name"
              maxLength={LIMITS.nameMax}
              value={form.firstName}
              onChange={set("firstName")}
              onBlur={blur("firstName")}
              error={errorFor("firstName")}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              maxLength={LIMITS.nameMax}
              value={form.lastName}
              onChange={set("lastName")}
              onBlur={blur("lastName")}
              error={errorFor("lastName")}
            />
          </div>
        </div>

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          maxLength={LIMITS.emailMax}
          value={form.email}
          onChange={set("email")}
          onBlur={blur("email")}
          error={errorFor("email")}
        />

        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          maxLength={LIMITS.passwordMax}
          value={form.password}
          onChange={set("password")}
          onBlur={blur("password")}
          error={errorFor("password")}
        />

        {!errorFor("password") && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--muted-2)",
              marginTop: -4,
            }}
          >
            At least {LIMITS.passwordMin} characters.
          </div>
        )}

        <SubmitButton disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
