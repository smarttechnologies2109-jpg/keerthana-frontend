
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/TermsAndConditions.css";

export default function TermsAndConditions() {
  return (
    <main className="legal-page">
      <article className="legal-container">

        <Link to="/home" className="legal-back">
          ← Back to Home
        </Link>

        <header className="legal-header">
          <span className="legal-brand">KEERTHANA MUSIC</span>

          <h1>Terms &amp; Conditions</h1>

          <p>
            Please read these Terms and Conditions carefully
            before using KEERTHANA MUSIC.
          </p>

          <span className="legal-date">
            Effective Date: 08 November 2026
          </span>
        </header>

        <section>
          <h2>1. About These Terms</h2>
          <p>
            Welcome to KEERTHANA MUSIC. These Terms and Conditions
            govern your access to and use of our website, mobile
            application and related services. By accessing or
            using our services, you agree to these terms.
          </p>
        </section>

        <section>
          <h2>2. About KEERTHANA MUSIC</h2>
          <p>
            KEERTHANA MUSIC is a Christian music platform providing
            songs, praise, worship, playlists and other
            music-related features across supported languages.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <ul>
            <li>Users must provide accurate account information.</li>
            <li>Users are responsible for maintaining account security.</li>
            <li>Users must not misuse another person's account.</li>
            <li>
              We may restrict accounts involved in abuse or fraud,
              subject to applicable law.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the application for unlawful activities.</li>
            <li>
              Copy, redistribute or commercially exploit music
              without appropriate permission.
            </li>
            <li>Attempt to access restricted systems or accounts.</li>
            <li>Interfere with the application's security or operation.</li>
            <li>Upload content that infringes another person's rights.</li>
          </ul>
        </section>

        <section>
          <h2>5. Music and Copyright</h2>
          <p>
            Music, lyrics, artwork and other content may be protected
            by copyright and related intellectual property laws.
          </p>
          <p>
            KEERTHANA MUSIC makes music available only where it has
            the necessary rights, licences or permissions to do so.
            Copyright and ownership remain with the respective
            rights holders unless otherwise stated.
          </p>
          <p>
            Users may listen to music for personal use through the
            features made available by KEERTHANA MUSIC. Downloading,
            copying, distributing or commercially using content is
            not permitted unless authorized by the applicable rights
            holder.
          </p>
        </section>

        <section>
          <h2>6. Free Services and Advertising</h2>
          <p>
            KEERTHANA MUSIC may provide free music-related services
            supported by advertising. Advertisements may be displayed
            through the application or website.
          </p>
          <p>
            Advertising availability and features may change
            from time to time.
          </p>
        </section>

        <section>
          <h2>7. Premium Services and Payments</h2>
          <p>
            KEERTHANA MUSIC may offer Premium memberships or
            paid features. Applicable prices, billing periods,
            payment methods, renewal conditions and cancellation
            terms will be displayed before a user completes
            a purchase.
          </p>
          <p>
            Payments may be processed through supported
            third-party payment providers or app stores.
          </p>
          <p>
            Users should review the applicable Refund and
            Cancellation Policy before purchasing a paid service.
          </p>
        </section>

        <section>
          <h2>8. Third-Party Services</h2>
          <p>
            Our services may contain links or integrations with
            third-party platforms, including payment providers,
            advertising services and other technology providers.
          </p>
          <p>
            Third-party services are subject to their own terms
            and privacy policies.
          </p>
        </section>

        <section>
          <h2>9. Service Availability</h2>
          <p>
            We aim to maintain reliable services but cannot guarantee
            uninterrupted availability. Maintenance, technical
            problems or circumstances beyond our control may
            temporarily affect the application.
          </p>
        </section>

        <section>
          <h2>10. Account Suspension</h2>
          <p>
            We may suspend or restrict access when reasonably
            necessary to protect users, maintain security,
            prevent abuse or comply with applicable law.
          </p>
        </section>

        <section>
          <h2>11. Limitation of Liability</h2>
          <p>
            To the extent permitted by applicable law, KEERTHANA MUSIC
            is not responsible for indirect losses arising from
            temporary service interruptions or unauthorized use
            of third-party services.
          </p>
          <p>
            Nothing in these terms excludes liability that
            cannot legally be excluded.
          </p>
        </section>

        <section>
          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms when our services or legal
            requirements change. Updated terms will be published
            on this page with a revised effective date.
          </p>
        </section>

        <section>
          <h2>13. Governing Law</h2>
          <p>
            These terms are subject to the applicable laws of India,
            subject to mandatory consumer rights and other
            applicable legal requirements.
          </p>
        </section>

        <section>
          <h2>14. Contact Us</h2>
          <p>
            For questions regarding these Terms and Conditions,
            please contact KEERTHANA MUSIC through our official
            support email or contact page.
          </p>
          <p>
            Email:{" "}
            <a href="mailto:smarttechnologies2109@gmail.com">
              smarttechnologies2109@gmail.com
            </a>
          </p>
          <Link to="/contact-us" className="legal-contact">
            Contact KEERTHANA Support
          </Link>
        </section>

        <nav className="legal-links">
          <Link to="/about-us">About Us</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">
            Terms &amp; Conditions
          </Link>
          <Link to="/refund-cancellation">
            Refund &amp; Cancellation
          </Link>
          <Link to="/premium">Premium</Link>
        </nav>

        <footer className="legal-footer">
          <p>
            © {new Date().getFullYear()} KEERTHANA MUSIC.
            All rights reserved.
          </p>
        </footer>

      </article>
    </main>
  );
}
