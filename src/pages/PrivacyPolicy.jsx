import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/" style={styles.backLink}>
          ← Back to Home
        </Link>

        <h1 style={styles.title}>Privacy Policy</h1>
        <p><strong>App:</strong> Keerthana</p>
        <p><strong>Effective date:</strong> 13 October 2026</p>

        <p>
          This Privacy Policy explains how Keerthana ("we", "us", or "our")
          handles information when you use the Keerthana music application
          and related services.
        </p>

        <h2>1. Information We Collect</h2>
        <p>Depending on the features you use, the app may process:</p>
        <ul>
          <li>Account details, phone number, and OTP verification information.</li>
          <li>Liked songs, playlists, artists, albums, and listening history.</li>
          <li>Subscription status, transaction references, and payment status.</li>
          <li>Song reports, feedback, and support messages you submit.</li>
          <li>Prompts submitted to AI features, if enabled.</li>
          <li>Technical logs, app version, and diagnostic information where collected.</li>
        </ul>
        <p>
          This list must be checked against the actual production app and its
          SDKs. Any additional information collected must also be disclosed.
        </p>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>To create accounts and verify sign-ins.</li>
          <li>To provide music playback, playlists, likes, and history.</li>
          <li>To manage subscriptions and payment status.</li>
          <li>To respond to feedback, reports, and support requests.</li>
          <li>To provide AI features when available and requested.</li>
          <li>To secure, maintain, and improve the app.</li>
        </ul>

        <h2>3. Sharing Information</h2>
        <p>
          We do not sell personal information. Information may be processed
          by service providers needed to operate the app, such as hosting,
          authentication, payment, or AI providers, where those services are
          actually used. Information may also be disclosed where required by law.
        </p>

        <h2>4. Storage and Security</h2>
        <p>
          Information may be stored on our servers and service-provider
          infrastructure. We use reasonable measures intended to protect
          information. No method of electronic storage or transmission is
          completely secure.
        </p>

        <h2>5. Data Retention and Deletion</h2>
        <p>
          We retain information only as reasonably necessary to provide the
          service, maintain required records, resolve disputes, and comply
          with legal obligations.
        </p>
        <p>
          Users can request account and personal-data deletion by contacting
          us at the email below. If users can create accounts, provide a
          working public account-deletion request webpage and an in-app
          deletion option as required by Google Play.
        </p>

        <h2>6. Children's Privacy</h2>
        <p>
          We do not knowingly collect children's personal information
          without the permissions or legal basis required by applicable law.
          Contact us if you believe a child has provided information
          inappropriately.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          The app may use third-party services or link to external websites.
          Those services have their own privacy policies.
        </p>

        <h2>8. Your Choices and Rights</h2>
        <p>
          Depending on applicable law, you may request access to, correction
          of, or deletion of your personal information.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy when our app or data practices change.
          The current version will be published on this page.
        </p>

        <h2>10. Contact Us</h2>
        <p><strong>App:</strong> Keerthana</p>
        <p>
          <strong>Developer/business name:</strong> REPLACE WITH YOUR
          ACTUAL DEVELOPER OR BUSINESS NAME
        </p>
        <p>
          <strong>Email:</strong> REPLACE WITH YOUR MONITORED SUPPORT EMAIL
        </p>

        <p style={styles.footer}>© 2026 Keerthana</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f5",
    padding: "24px 12px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "28px 22px",
    background: "#ffffff",
    color: "#202923",
    lineHeight: 1.7,
    borderRadius: "12px",
    overflowWrap: "anywhere",
  },
  title: {
    color: "#174b36",
    marginTop: "24px",
  },
  backLink: {
    color: "#174b36",
    textDecoration: "none",
    fontWeight: 600,
  },
  footer: {
    borderTop: "1px solid #dddddd",
    paddingTop: "16px",
    marginTop: "28px",
    color: "#59665e",
  },
};0