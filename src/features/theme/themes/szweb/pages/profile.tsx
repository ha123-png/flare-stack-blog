import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  Check,
  Loader2,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import type { ProfilePageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

export function ProfilePage({
  user,
  profileForm,
  passwordForm,
  notification,
  logout,
}: ProfilePageProps) {
  const displayName = user.name.trim() || user.email;

  return (
    <div className="sz-account-page sz-profile-page">
      <header className="sz-account-heading sz-profile-heading">
        <p className="sz-account-eyebrow">{m.profile_title()}</p>
        <div className="sz-profile-identity">
          {user.image ? (
            <img
              className="sz-profile-avatar"
              src={user.image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              className="sz-profile-avatar sz-profile-avatar-fallback"
              aria-hidden="true"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="sz-account-title">{displayName}</h1>
            <p className="sz-account-description">{user.email}</p>
          </div>
          <span className="sz-profile-role">
            {user.role === "admin"
              ? m.profile_role_admin()
              : m.profile_role_reader()}
          </span>
        </div>
      </header>

      <div className="sz-profile-sections">
        <div className="sz-profile-primary">
          <section
            className="sz-account-section"
            aria-labelledby="sz-profile-details-title"
          >
            <div className="sz-account-section-heading">
              <UserRound aria-hidden="true" />
              <h2 id="sz-profile-details-title">
                {m.profile_basic_settings()}
              </h2>
            </div>
            <form
              className="sz-account-form"
              onSubmit={profileForm.handleSubmit}
            >
              <div className="sz-account-field">
                <label className="sz-label" htmlFor="profile-name">
                  {m.profile_name()}
                </label>
                <input
                  id="profile-name"
                  autoComplete="name"
                  className="sz-account-input"
                  disabled={profileForm.isSubmitting}
                  aria-invalid={Boolean(profileForm.errors.name)}
                  aria-describedby={
                    profileForm.errors.name ? "profile-name-error" : undefined
                  }
                  {...profileForm.register("name")}
                />
                {profileForm.errors.name ? (
                  <p
                    className="sz-account-error"
                    id="profile-name-error"
                    role="alert"
                  >
                    {profileForm.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="sz-account-field">
                <label className="sz-label" htmlFor="profile-image">
                  {m.profile_avatar_url()}
                </label>
                <input
                  id="profile-image"
                  type="url"
                  autoComplete="url"
                  placeholder={m.profile_avatar_url_placeholder()}
                  className="sz-account-input"
                  disabled={profileForm.isSubmitting}
                  aria-invalid={Boolean(profileForm.errors.image)}
                  aria-describedby={
                    profileForm.errors.image ? "profile-image-error" : undefined
                  }
                  {...profileForm.register("image")}
                />
                {profileForm.errors.image ? (
                  <p
                    className="sz-account-error"
                    id="profile-image-error"
                    role="alert"
                  >
                    {profileForm.errors.image.message}
                  </p>
                ) : null}
              </div>
              <button
                className="sz-button sz-account-submit sz-account-submit-inline"
                type="submit"
                disabled={profileForm.isSubmitting}
                aria-busy={profileForm.isSubmitting}
              >
                {profileForm.isSubmitting ? (
                  <Loader2 className="sz-account-spinner" aria-hidden="true" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {m.profile_save_changes_fuwari()}
              </button>
            </form>
          </section>

          {passwordForm ? (
            <section
              className="sz-account-section"
              aria-labelledby="sz-profile-password-title"
            >
              <div className="sz-account-section-heading">
                <Shield aria-hidden="true" />
                <h2 id="sz-profile-password-title">
                  {m.profile_password_security()}
                </h2>
              </div>
              <form
                className="sz-account-form"
                onSubmit={passwordForm.handleSubmit}
              >
                <div className="sz-account-field">
                  <label
                    className="sz-label"
                    htmlFor="profile-current-password"
                  >
                    {m.profile_current_password()}
                  </label>
                  <input
                    id="profile-current-password"
                    type="password"
                    autoComplete="current-password"
                    className="sz-account-input"
                    disabled={passwordForm.isSubmitting}
                    aria-invalid={Boolean(passwordForm.errors.currentPassword)}
                    aria-describedby={
                      passwordForm.errors.currentPassword
                        ? "profile-current-password-error"
                        : undefined
                    }
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.errors.currentPassword ? (
                    <p
                      className="sz-account-error"
                      id="profile-current-password-error"
                      role="alert"
                    >
                      {passwordForm.errors.currentPassword.message}
                    </p>
                  ) : null}
                </div>
                <div className="sz-account-field">
                  <label className="sz-label" htmlFor="profile-new-password">
                    {m.profile_new_password()}
                  </label>
                  <input
                    id="profile-new-password"
                    type="password"
                    autoComplete="new-password"
                    className="sz-account-input"
                    disabled={passwordForm.isSubmitting}
                    aria-invalid={Boolean(passwordForm.errors.newPassword)}
                    aria-describedby={
                      passwordForm.errors.newPassword
                        ? "profile-new-password-error"
                        : undefined
                    }
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.errors.newPassword ? (
                    <p
                      className="sz-account-error"
                      id="profile-new-password-error"
                      role="alert"
                    >
                      {passwordForm.errors.newPassword.message}
                    </p>
                  ) : null}
                </div>
                <div className="sz-account-field">
                  <label
                    className="sz-label"
                    htmlFor="profile-confirm-password"
                  >
                    {m.profile_confirm_password()}
                  </label>
                  <input
                    id="profile-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="sz-account-input"
                    disabled={passwordForm.isSubmitting}
                    aria-invalid={Boolean(passwordForm.errors.confirmPassword)}
                    aria-describedby={
                      passwordForm.errors.confirmPassword
                        ? "profile-confirm-password-error"
                        : undefined
                    }
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.errors.confirmPassword ? (
                    <p
                      className="sz-account-error"
                      id="profile-confirm-password-error"
                      role="alert"
                    >
                      {passwordForm.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
                <button
                  className="sz-button sz-account-submit sz-account-submit-inline"
                  type="submit"
                  disabled={passwordForm.isSubmitting}
                  aria-busy={passwordForm.isSubmitting}
                >
                  {passwordForm.isSubmitting ? (
                    <Loader2
                      className="sz-account-spinner"
                      aria-hidden="true"
                    />
                  ) : (
                    <Shield aria-hidden="true" />
                  )}
                  {m.profile_update_password_fuwari()}
                </button>
              </form>
            </section>
          ) : null}
        </div>

        <div className="sz-profile-side">
          {notification.available ? (
            <section
              className="sz-account-section"
              aria-labelledby="sz-profile-notifications-title"
            >
              <div className="sz-account-section-heading">
                <Bell aria-hidden="true" />
                <h2 id="sz-profile-notifications-title">
                  {m.profile_preferences()}
                </h2>
              </div>
              <p className="sz-account-description">
                {m.profile_email_notify_desc_fuwari()}
              </p>
              <button
                className="sz-profile-toggle"
                type="button"
                aria-pressed={notification.enabled ?? false}
                disabled={notification.isLoading || notification.isPending}
                onClick={notification.toggle}
              >
                <span>{m.profile_email_notify()}</span>
                {notification.isLoading || notification.isPending ? (
                  <Loader2 className="sz-account-spinner" aria-hidden="true" />
                ) : (
                  <span className="sz-profile-toggle-state">
                    {notification.enabled
                      ? m.profile_notify_enabled_fuwari()
                      : m.profile_notify_disabled_fuwari()}
                  </span>
                )}
              </button>
            </section>
          ) : null}

          <section
            className="sz-account-section"
            aria-labelledby="sz-profile-actions-title"
          >
            <div className="sz-account-section-heading">
              <Shield aria-hidden="true" />
              <h2 id="sz-profile-actions-title">{m.profile_actions()}</h2>
            </div>
            {user.role === "admin" ? (
              <Link to="/admin" className="sz-profile-action-link">
                <span>{m.profile_admin_dashboard_fuwari()}</span>
                <ArrowUpRight aria-hidden="true" />
              </Link>
            ) : null}
            <button
              className="sz-profile-logout"
              type="button"
              onClick={() => void logout()}
            >
              <LogOut aria-hidden="true" />
              {m.profile_logout_fuwari()}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
