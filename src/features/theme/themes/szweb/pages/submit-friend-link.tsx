import { ClientOnly, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { Turnstile } from "@/components/common/turnstile";
import type {
  MyFriendLink,
  SubmitFriendLinkPageProps,
} from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

function SubmissionStatus({ status }: { status: MyFriendLink["status"] }) {
  if (status === "approved") {
    return (
      <span className="sz-submission-status sz-submission-status-approved">
        <Check aria-hidden="true" />
        {m.friend_link_status_approved()}
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="sz-submission-status sz-submission-status-rejected">
        <X aria-hidden="true" />
        {m.friend_link_status_rejected()}
      </span>
    );
  }

  return (
    <span className="sz-submission-status sz-submission-status-pending">
      <Clock aria-hidden="true" />
      {m.friend_link_status_pending()}
    </span>
  );
}

export function SubmitFriendLinkPage({
  myLinks,
  form,
}: SubmitFriendLinkPageProps) {
  const field = (
    name: "siteName" | "siteUrl" | "description" | "logoUrl" | "contactEmail",
    id: string,
    label: string,
    placeholder: string,
    type: "text" | "url" | "email" = "text",
    required = false,
  ) => {
    const error = form.errors[name]?.message;
    return (
      <div className="sz-account-field">
        <label className="sz-label" htmlFor={id}>
          {label}
          {required ? <span className="sz-required-mark"> *</span> : null}
        </label>
        <input
          className="sz-account-input"
          id={id}
          type={type}
          placeholder={placeholder}
          disabled={form.isSubmitting}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...form.register(name)}
        />
        {error ? (
          <p className="sz-account-error" id={`${id}-error`} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="sz-account-page sz-submit-friend-page">
      <header className="sz-account-heading sz-submit-friend-heading">
        <p className="sz-account-eyebrow">{m.friend_link_submit_title()}</p>
        <h1 className="sz-account-title">{m.friend_links_title()}</h1>
        <p className="sz-account-description">{m.friend_link_submit_desc()}</p>
        <Link to="/friend-links" className="sz-text-link sz-submit-friend-back">
          <ArrowLeft aria-hidden="true" />
          {m.friend_link_back_to_list()}
        </Link>
      </header>

      <section
        className="sz-account-section"
        aria-labelledby="sz-friend-submit-title"
      >
        <div className="sz-account-section-heading">
          <h2 id="sz-friend-submit-title">
            {m.friend_link_submit_form_title()}
          </h2>
        </div>
        <form className="sz-account-form" onSubmit={form.handleSubmit}>
          <Turnstile {...form.turnstileProps} />
          {field(
            "siteName",
            "friend-site-name",
            m.friend_link_field_site_name(),
            m.friend_link_placeholder_site_name_default(),
            "text",
            true,
          )}
          {field(
            "siteUrl",
            "friend-site-url",
            m.friend_link_field_site_url(),
            m.friend_link_placeholder_site_url(),
            "url",
            true,
          )}
          {field(
            "description",
            "friend-description",
            m.friend_link_field_description_default(),
            m.friend_link_placeholder_description_default(),
          )}
          {field(
            "logoUrl",
            "friend-logo-url",
            m.friend_link_field_logo_url_default(),
            m.friend_link_placeholder_site_url(),
            "url",
          )}
          {field(
            "contactEmail",
            "friend-contact-email",
            m.friend_link_field_contact_email(),
            m.friend_link_placeholder_contact_email_default(),
            "email",
            true,
          )}
          <button
            className="sz-button sz-account-submit sz-account-submit-inline"
            type="submit"
            disabled={form.isSubmitting}
            aria-busy={form.isSubmitting}
          >
            {form.isSubmitting ? (
              <>
                <Loader2 className="sz-account-spinner" aria-hidden="true" />
                {m.friend_link_submitting()}
              </>
            ) : (
              <>
                {m.friend_link_submit_button_default()}
                <ArrowUpRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </section>

      <section
        className="sz-account-section sz-my-submissions"
        aria-labelledby="sz-my-submissions-title"
      >
        <div className="sz-account-section-heading">
          <h2 id="sz-my-submissions-title">{m.friend_link_my_submissions()}</h2>
          <span className="sz-submission-count">{myLinks.length}</span>
        </div>
        {myLinks.length ? (
          <ol className="sz-submission-list">
            {myLinks.map((link) => (
              <li className="sz-submission-row" key={link.id}>
                <div className="sz-submission-main">
                  <div className="sz-submission-title-line">
                    <h3>{link.siteName}</h3>
                    <SubmissionStatus status={link.status} />
                  </div>
                  <a
                    className="sz-submission-url"
                    href={link.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.siteUrl}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                  {link.status === "rejected" && link.rejectionReason ? (
                    <p className="sz-submission-reason">
                      <span>{m.friend_link_rejection_reason()}:</span>{" "}
                      {link.rejectionReason}
                    </p>
                  ) : null}
                </div>
                <time
                  className="sz-submission-date"
                  dateTime={new Date(link.createdAt).toISOString()}
                >
                  <span>{m.friend_link_submitted_at()}</span>{" "}
                  <ClientOnly fallback="—">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </ClientOnly>
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sz-submissions-empty sz-muted">
            {m.friend_link_no_submissions()}
          </p>
        )}
      </section>
    </div>
  );
}
