import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Github,
  Loader2,
} from "lucide-react";
import type { HTMLInputTypeAttribute, ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type {
  ForgotPasswordPageProps,
  LoginPageProps,
  RegisterPageProps,
  ResetPasswordPageProps,
  VerifyEmailPageProps,
} from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

interface AuthFieldProps {
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
}

function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  disabled = false,
  error,
  registration,
}: AuthFieldProps) {
  return (
    <div className="sz-account-field">
      <label className="sz-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="sz-account-input"
        {...registration}
      />
      {error ? (
        <p className="sz-account-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="sz-account-heading">
      <p className="sz-account-eyebrow">{eyebrow}</p>
      <h1 className="sz-account-title">{title}</h1>
      {description ? (
        <p className="sz-account-description">{description}</p>
      ) : null}
    </header>
  );
}

function AuthFeedback({
  kind,
  title,
  description,
  children,
}: {
  kind: "success" | "error";
  title: string;
  description: string;
  children: ReactNode;
}) {
  const Icon = kind === "success" ? CheckCircle2 : AlertCircle;

  return (
    <section className="sz-account-feedback" aria-live="polite">
      <Icon
        className={`sz-account-feedback-icon sz-account-feedback-${kind}`}
        aria-hidden="true"
      />
      <div className="sz-account-feedback-copy">
        <h1 className="sz-account-title">{title}</h1>
        <p className="sz-account-description">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LoginPage({
  isEmailConfigured,
  loginForm,
  socialLogin,
  turnstileElement,
}: LoginPageProps) {
  const disabled =
    loginForm.isSubmitting ||
    loginForm.loginStep !== "IDLE" ||
    loginForm.turnstilePending;

  return (
    <div className="sz-account-page sz-auth-flow">
      <AuthHeading
        eyebrow={isEmailConfigured ? m.login_label() : m.login_auth_label()}
        title={isEmailConfigured ? m.login_title() : m.login_auth_title()}
        description={
          isEmailConfigured
            ? m.login_welcome_back()
            : m.login_only_third_party_fuwari()
        }
      />

      <div className="sz-account-content">
        {isEmailConfigured ? (
          <form className="sz-account-form" onSubmit={loginForm.handleSubmit}>
            <AuthField
              id="login-email"
              label={m.login_email_address()}
              type="email"
              placeholder={m.login_email_placeholder()}
              autoComplete="username"
              disabled={disabled}
              error={loginForm.errors.email?.message}
              registration={loginForm.register("email")}
            />
            <AuthField
              id="login-password"
              label={m.login_password()}
              type="password"
              placeholder={m.login_password_placeholder()}
              autoComplete="current-password"
              disabled={disabled}
              error={loginForm.errors.password?.message}
              registration={loginForm.register("password")}
            />
            <div className="sz-account-form-note">
              <Link to="/forgot-password" className="sz-text-link">
                {m.login_forgot_password_fuwari()}
              </Link>
            </div>
            <button
              className="sz-button sz-account-submit"
              type="submit"
              disabled={disabled}
              aria-busy={loginForm.loginStep === "VERIFYING"}
            >
              {loginForm.loginStep === "VERIFYING" ? (
                <>
                  <Loader2 className="sz-account-spinner" aria-hidden="true" />
                  {m.login_submitting()}
                </>
              ) : loginForm.loginStep === "SUCCESS" ? (
                m.login_toast_success()
              ) : (
                <>
                  {m.login_submit()}
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        ) : null}

        {isEmailConfigured ? (
          <div className="sz-account-divider" aria-hidden="true">
            <span />
            <span>{m.login_or()}</span>
            <span />
          </div>
        ) : null}

        <button
          className={`sz-button sz-account-oauth${isEmailConfigured ? " sz-account-oauth-outline" : ""}`}
          type="button"
          onClick={() => void socialLogin.handleGithubLogin()}
          disabled={socialLogin.isLoading}
          aria-busy={socialLogin.isLoading}
        >
          {socialLogin.isLoading ? (
            <Loader2 className="sz-account-spinner" aria-hidden="true" />
          ) : (
            <Github aria-hidden="true" />
          )}
          {socialLogin.isLoading
            ? m.login_social_connecting()
            : m.login_github_fuwari()}
        </button>

        {turnstileElement}

        {isEmailConfigured ? (
          <p className="sz-account-footer">
            {m.login_no_account()}{" "}
            <Link to="/register" className="sz-text-link">
              {m.login_register_now()}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RegisterPage({
  isEmailConfigured,
  registerForm,
  turnstileElement,
}: RegisterPageProps) {
  const disabled = registerForm.isSubmitting || registerForm.turnstilePending;

  if (registerForm.isSuccess) {
    return (
      <div className="sz-account-page">
        <AuthFeedback
          kind="success"
          title={m.register_success_title()}
          description={m.register_success_desc()}
        >
          <Link to="/login" className="sz-button sz-account-submit">
            {m.register_back_to_login()}
            <ArrowRight aria-hidden="true" />
          </Link>
        </AuthFeedback>
      </div>
    );
  }

  return (
    <div className="sz-account-page sz-auth-flow">
      <AuthHeading
        eyebrow={m.register_label()}
        title={m.register_title()}
        description={m.register_header_desc()}
      />
      <div className="sz-account-content">
        <form className="sz-account-form" onSubmit={registerForm.handleSubmit}>
          <AuthField
            id="register-name"
            label={m.register_nickname()}
            placeholder={m.register_nickname_placeholder()}
            autoComplete="nickname"
            disabled={disabled}
            error={registerForm.errors.name?.message}
            registration={registerForm.register("name")}
          />
          <AuthField
            id="register-email"
            label={m.login_email_address()}
            type="email"
            placeholder={m.login_email_placeholder()}
            autoComplete="email"
            disabled={disabled}
            error={registerForm.errors.email?.message}
            registration={registerForm.register("email")}
          />
          <div className="sz-account-field-grid">
            <AuthField
              id="register-password"
              label={m.register_password()}
              type="password"
              placeholder={m.login_password_placeholder()}
              autoComplete="new-password"
              disabled={disabled}
              error={registerForm.errors.password?.message}
              registration={registerForm.register("password")}
            />
            <AuthField
              id="register-confirm-password"
              label={m.register_confirm_password()}
              type="password"
              placeholder={m.login_password_placeholder()}
              autoComplete="new-password"
              disabled={disabled}
              error={registerForm.errors.confirmPassword?.message}
              registration={registerForm.register("confirmPassword")}
            />
          </div>
          <button
            className="sz-button sz-account-submit"
            type="submit"
            disabled={disabled}
            aria-busy={registerForm.isSubmitting}
          >
            {registerForm.isSubmitting ? (
              <>
                <Loader2 className="sz-account-spinner" aria-hidden="true" />
                {m.register_submitting()}
              </>
            ) : (
              <>
                {m.register_submit()}
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
        {turnstileElement}
        {isEmailConfigured ? (
          <p className="sz-account-footer">
            {m.register_have_account()}{" "}
            <Link to="/login" className="sz-text-link">
              {m.register_go_to_login()}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ForgotPasswordPage({
  forgotPasswordForm,
  turnstileElement,
}: ForgotPasswordPageProps) {
  const form = forgotPasswordForm;
  const disabled = form.isSubmitting || form.turnstilePending;

  if (form.isSent) {
    return (
      <div className="sz-account-page">
        <AuthFeedback
          kind="success"
          title={m.forgot_password_success_title()}
          description={m.forgot_password_success_desc({
            email: form.sentEmail,
          })}
        >
          <Link to="/login" className="sz-button sz-account-submit">
            {m.forgot_password_back_to_login()}
            <ArrowRight aria-hidden="true" />
          </Link>
        </AuthFeedback>
      </div>
    );
  }

  return (
    <div className="sz-account-page sz-auth-flow">
      <AuthHeading
        eyebrow={m.forgot_password_label()}
        title={m.forgot_password_title()}
        description={m.forgot_password_header_desc()}
      />
      <div className="sz-account-content">
        <form className="sz-account-form" onSubmit={form.handleSubmit}>
          <AuthField
            id="forgot-password-email"
            label={m.forgot_password_email_label()}
            type="email"
            placeholder={m.login_email_placeholder()}
            autoComplete="email"
            disabled={disabled}
            error={form.errors.email?.message}
            registration={form.register("email")}
          />
          <button
            className="sz-button sz-account-submit"
            type="submit"
            disabled={disabled}
            aria-busy={form.isSubmitting}
          >
            {form.isSubmitting ? (
              <>
                <Loader2 className="sz-account-spinner" aria-hidden="true" />
                {m.forgot_password_submitting()}
              </>
            ) : (
              <>
                {m.forgot_password_submit()}
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
        {turnstileElement}
        <p className="sz-account-footer">
          <Link to="/login" className="sz-text-link">
            {m.register_back_to_login()}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage({
  resetPasswordForm,
  token,
  error,
}: ResetPasswordPageProps) {
  const form = resetPasswordForm;

  if (!token && !error) {
    return (
      <div className="sz-account-page">
        <AuthFeedback
          kind="error"
          title={m.reset_password_error_missing_token()}
          description={m.reset_password_error_missing_token_desc()}
        >
          <Link to="/login" className="sz-button sz-account-submit">
            {m.forgot_password_back_to_login()}
            <ArrowRight aria-hidden="true" />
          </Link>
        </AuthFeedback>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sz-account-page">
        <AuthFeedback
          kind="error"
          title={m.reset_password_error_expired_title()}
          description={m.reset_password_error_invalid_link({ error })}
        >
          <Link to="/forgot-password" className="sz-button sz-account-submit">
            {m.reset_password_request_new_link()}
            <ArrowRight aria-hidden="true" />
          </Link>
        </AuthFeedback>
      </div>
    );
  }

  return (
    <div className="sz-account-page sz-auth-flow">
      <AuthHeading
        eyebrow={m.reset_password_label()}
        title={m.reset_password_title()}
        description={m.reset_password_header_desc()}
      />
      <form className="sz-account-form" onSubmit={form.handleSubmit}>
        <AuthField
          id="reset-password"
          label={m.reset_password_new_password()}
          type="password"
          placeholder={m.login_password_placeholder()}
          autoComplete="new-password"
          disabled={form.isSubmitting}
          error={form.errors.password?.message}
          registration={form.register("password")}
        />
        <AuthField
          id="reset-confirm-password"
          label={m.reset_password_confirm_new_password()}
          type="password"
          placeholder={m.login_password_placeholder()}
          autoComplete="new-password"
          disabled={form.isSubmitting}
          error={form.errors.confirmPassword?.message}
          registration={form.register("confirmPassword")}
        />
        <button
          className="sz-button sz-account-submit"
          type="submit"
          disabled={form.isSubmitting}
          aria-busy={form.isSubmitting}
        >
          {form.isSubmitting ? (
            <>
              <Loader2 className="sz-account-spinner" aria-hidden="true" />
              {m.reset_password_submitting()}
            </>
          ) : (
            <>
              {m.reset_password_submit()}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export function VerifyEmailPage({ status, error }: VerifyEmailPageProps) {
  if (status === "ANALYZING") {
    return (
      <div className="sz-account-page">
        <section className="sz-account-feedback" aria-live="polite">
          <Loader2
            className="sz-account-feedback-icon sz-account-spinner"
            aria-hidden="true"
          />
          <div className="sz-account-feedback-copy">
            <p className="sz-account-eyebrow">{m.verify_email_header()}</p>
            <h1 className="sz-account-title">
              {m.verify_email_analyzing_title()}
            </h1>
            <p className="sz-account-description">
              {m.verify_email_analyzing_desc()}
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (status === "SUCCESS") {
    return (
      <div className="sz-account-page">
        <AuthFeedback
          kind="success"
          title={m.verify_email_success_title()}
          description={m.verify_email_success_desc()}
        >
          <Link to="/" className="sz-button sz-account-submit">
            {m.verify_email_success_action()}
            <ArrowRight aria-hidden="true" />
          </Link>
        </AuthFeedback>
      </div>
    );
  }

  return (
    <div className="sz-account-page">
      <AuthFeedback
        kind="error"
        title={m.verify_email_error_title()}
        description={
          error === "invalid_token"
            ? m.verify_email_error_invalid_token_desc()
            : m.verify_email_error_generic_desc()
        }
      >
        <div className="sz-account-actions">
          <Link to="/login" className="sz-button sz-account-submit">
            {m.verify_email_error_action()}
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link to="/login" className="sz-text-link">
            {m.verify_email_error_resend_action()}
          </Link>
        </div>
      </AuthFeedback>
    </div>
  );
}
