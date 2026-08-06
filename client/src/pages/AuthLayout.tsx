import type { ReactNode } from "react";

/**
 * Shell for the sign-in and sign-up pages.
 *
 * The design file covers only the scheduler, so these follow the Modernist
 * system directly: flush-left type, 2px rules, square corners, accent used once
 * for the primary action.
 */
export function AuthLayout({
  kicker,
  title,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div style={{ width: 380, maxWidth: "100%" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--muted-1)",
            marginBottom: 8,
          }}
        >
          {kicker}
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            margin: "0 0 20px",
          }}
        >
          {title}
        </h1>

        <div style={{ height: 2, background: "var(--ink)", marginBottom: 24 }} />

        {children}

        <div
          style={{
            marginTop: 24,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--muted-1)",
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        border: "2px solid var(--accent)",
        padding: "8px 10px",
        marginBottom: 16,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink)",
      }}
    >
      {message}
    </div>
  );
}

export function Field({
  label,
  error,
  ...input
}: {
  label: string;
  /** Shown under the field once the user has left it or tried to submit. */
  error?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span
        style={{
          display: "block",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted-1)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        {...input}
        aria-invalid={Boolean(error)}
        style={{
          width: "100%",
          height: 38,
          padding: "6px 10px",
          border: `1px solid ${error ? "var(--accent)" : "var(--line)"}`,
          background: "var(--field)",
          color: "var(--ink)",
          fontSize: 14,
          fontWeight: 500,
          outline: "none",
        }}
      />
      {error && (
        <span
          role="alert"
          style={{
            display: "block",
            marginTop: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

export function SubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="hv-accent-bg"
      style={{
        width: "100%",
        border: "none",
        background: "var(--ink)",
        color: "var(--bg)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "12px 14px",
        // Flush left, per the system: never centre a button label.
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        marginTop: 6,
      }}
    >
      {children}
    </button>
  );
}
