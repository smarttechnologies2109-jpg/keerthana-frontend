
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/TermsAndConditions.css";

export default function TermsAndConditions() {
  return (
    <main className="legal-page">
      <div className="legal-container">

        <Link to="/home" className="legal-back">
          ← Back to Home
        </Link>

        <h1>Terms & Conditions</h1>

        <p><strong>App:</strong> KEERTHANA MUSIC</p>
        <p><strong>Effective Date:</strong> 08 November 2026</p>

        <p>
          Welcome to KEERTHANA MUSIC. These Terms and Conditions
          govern your access to and use of our website,
          mobile application and related services.
          By using our services, you agree to these terms.
        </p>

        <h2>1. About KEERTHANA MUSIC</h2>
        <p>
          KEERTHANA MUSIC is a Christian music platform
          providing songs, praise, worship, playlists and
          other music-related features across supported languages.
        </p>

        <h2>2. User Accounts</h2>
        <ul>
          <li>Users must provide accurate account information.</li>
          <li>Users are responsible for maintaining account security.</li>
          <li>Users must not misuse another person's account.</li>
          <li>We may restrict accounts involved in abuse or fraud,
          subject to applicable law.</li>
        </ul>

        <h2>3. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the application for unlawful activities.</li>
          <li>Copy, redistribute or commercially exploit music
          without appropriate permission.</li>
          <li>Attempt to access restricted systems or accounts.</li>
          <li>Interfere with the application's security or operation.</li>
          <li>Upload content that infringes another person's rights.</li>
        </ul>

        <h2>4. Music and Copyright</h2>
        <p>
          Music, lyrics, artwork and other content may be
          protected by copyright and related intellectual
          property laws.
        </p>
        <p>
          Users may listen to music for personal use through
          the features made available by KEERTHANA MUSIC.
          Downloading, copying, distributing or commercially
          using content is not permitted unless authorized
          by the applicable rights holder.
        </p>

        <h2>5. Free Services and Advertising</h2>
        <p>
          KEERTHANA MUSIC may provide free music-related
          services supported by advertising. Advertisements
          may be displayed through the application or website.
        </p>
        <p>
          Advertising availability and features may change
          from time to time.
        </p>

        <h2>6. Premium Services and Payments</h2>
        <p>
          If paid subscriptions or premium services are
          introduced, their applicable prices, billing
          periods, payment terms and cancellation conditions
          will be displayed before purchase.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          Our services may contain links or integrations
          with third-party platforms. We are not responsible
          for the independent services or policies of those
          providers.
        </p>

        <h2>8. Service Availability</h2>
        <p>
          We aim to maintain reliable services but cannot
          guarantee uninterrupted availability. Maintenance,
          technical problems or circumstances beyond our
          control may temporarily affect the application.
        </p>

        <h2>9. Account Suspension</h2>
        <p>
          We may suspend or restrict access when reasonably
          necessary to protect users, maintain security,
          prevent abuse or comply with applicable law.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          To the extent permitted by applicable law,
          KEERTHANA MUSIC is not responsible for indirect
          losses arising from temporary service interruptions
          or unauthorized use of third-party services.
          Nothing in these terms excludes liability that
          cannot legally be excluded.
        </p>

        <h2>11. Changes to These Terms</h2>
        <p>
          We may update these Terms when our services or
          legal requirements change. Updated terms will
          be published on this page with a revised date.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These terms are subject to the applicable laws
          of India, subject to mandatory consumer rights
          and other applicable legal requirements.
        </p>

        <h2>13. Contact Us</h2>
        <p>
          For questions regarding these Terms, please
          contact KEERTHANA MUSIC through our official
          support email.
        </p>

        <Link to="/contact-us" className="legal-contact">
          Contact KEERTHANA Support
        </Link>

        <p className="legal-footer">
          © 2026 KEERTHANA MUSIC. All rights reserved.
        </p>

      </div>
    </main>
  );
}
