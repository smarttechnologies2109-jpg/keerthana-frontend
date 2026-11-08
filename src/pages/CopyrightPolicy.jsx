
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/CopyrightPolicy.css";

const CopyrightPolicy = () => {
  return (
    <div className="copyright-page">
      <div className="copyright-container">

        <header className="copyright-header">
          <span className="copyright-brand">
            KEERTHANA MUSIC
          </span>

          <h1>Copyright & Music Licensing Policy</h1>

          <p>
            Respecting music creators, composers, singers,
            musicians, producers and copyright owners.
          </p>

          <span className="copyright-date">
            Effective Date: 8 November 2026
          </span>
        </header>

        <section className="copyright-section">
          <h2>1. Introduction</h2>

          <p>
            KEERTHANA MUSIC respects intellectual property rights
            and is committed to protecting the rights of music
            creators, artists, composers, lyricists, publishers,
            producers and other copyright owners.
          </p>

          <p>
            This policy explains our approach to music content,
            copyright ownership, licensing permissions and
            copyright complaints.
          </p>
        </section>

        <section className="copyright-section">
          <h2>2. Music Content on KEERTHANA MUSIC</h2>

          <p>
            KEERTHANA MUSIC provides Christian music, Telugu
            Christian songs, praise and worship music and
            related audio content.
          </p>

          <p>
            Music recordings may be stored and delivered through
            our cloud storage infrastructure, including AWS S3.
          </p>

          <p>
            Music may be provided by the platform, authorized
            contributors, rights holders or other parties
            with appropriate permissions.
          </p>
        </section>

        <section className="copyright-section">
          <h2>3. Copyright Ownership and Permissions</h2>

          <p>
            Copyright in a musical work and copyright in its
            sound recording may belong to different rights holders.
          </p>

          <p>
            The relevant rights may include:
          </p>

          <ul>
            <li>Musical composition and melody.</li>
            <li>Song lyrics and written material.</li>
            <li>Sound recordings and master recordings.</li>
            <li>Performances by singers and musicians.</li>
            <li>Album artwork, photographs and promotional images.</li>
          </ul>

          <p>
            Before making content available, KEERTHANA MUSIC
            must have the necessary ownership, license,
            authorization or other lawful basis to use and
            distribute that content.
          </p>

          <p>
            Public availability of a song on YouTube or another
            platform does not automatically grant KEERTHANA MUSIC
            permission to download, copy, store, stream or
            distribute that recording.
          </p>
        </section>

        <section className="copyright-section">
          <h2>4. Content Submitted by Contributors</h2>

          <p>
            If artists, ministries, record labels or other
            contributors submit music or related materials,
            they must have the necessary rights and permissions
            to provide that content to KEERTHANA MUSIC.
          </p>

          <p>
            By submitting content, contributors must not knowingly
            provide material that infringes another person's
            copyright or other intellectual property rights.
          </p>

          <p>
            KEERTHANA MUSIC may request evidence of ownership,
            licensing or authorization before publishing
            submitted content.
          </p>
        </section>

        <section className="copyright-section">
          <h2>5. User Responsibilities</h2>

          <p>
            Users must use KEERTHANA MUSIC only for its intended
            purposes and must not:
          </p>

          <ul>
            <li>
              Reproduce or redistribute copyrighted recordings
              without permission.
            </li>
            <li>
              Download or extract music through unauthorized
              methods.
            </li>
            <li>
              Upload copyrighted music without the necessary rights.
            </li>
            <li>
              Remove copyright notices or ownership information.
            </li>
            <li>
              Use music, artwork or other content in a way that
              violates applicable intellectual property laws.
            </li>
          </ul>
        </section>

        <section className="copyright-section">
          <h2>6. Copyright Complaint and Takedown Requests</h2>

          <p>
            If you believe that content available through
            KEERTHANA MUSIC infringes your copyright or other
            intellectual property rights, you may submit a
            complaint to our support team.
          </p>

          <p>
            Please include the following information:
          </p>

          <ul>
            <li>Your full name and contact information.</li>
            <li>
              Identification of the copyrighted work you own
              or are authorized to represent.
            </li>
            <li>
              The title and details of the allegedly infringing
              song or content.
            </li>
            <li>
              The relevant KEERTHANA MUSIC page or content URL,
              if available.
            </li>
            <li>
              An explanation of why you believe the use is
              unauthorized.
            </li>
            <li>
              Evidence of ownership or authorization, where available.
            </li>
            <li>
              A statement that the information in your complaint
              is accurate and that you are authorized to submit it.
            </li>
          </ul>

          <p>
            Please do not submit false, misleading or knowingly
            inaccurate copyright complaints.
          </p>
        </section>

        <section className="copyright-section">
          <h2>7. Review and Removal of Content</h2>

          <p>
            We will review copyright complaints and may request
            additional information to assess the issue.
          </p>

          <p>
            Where appropriate, we may temporarily restrict access
            to disputed content, remove content, request proof
            of authorization or take other action consistent
            with applicable law.
          </p>

          <p>
            We may also take action against repeated or serious
            copyright violations.
          </p>
        </section>

        <section className="copyright-section">
          <h2>8. Counter-Notifications</h2>

          <p>
            If content has been removed or restricted because
            of a copyright complaint and you believe you have
            the necessary rights or authorization, you may
            contact us with supporting information.
          </p>

          <p>
            We will review the information and take appropriate
            action in accordance with applicable law.
          </p>
        </section>

        <section className="copyright-section">
          <h2>9. Third-Party Platforms and Services</h2>

          <p>
            KEERTHANA MUSIC may reference or link to third-party
            platforms and services. Such platforms have their
            own copyright policies and terms.
          </p>

          <p>
            The presence of a song or video on a third-party
            platform does not mean KEERTHANA MUSIC owns or
            controls its copyright.
          </p>
        </section>

        <section className="copyright-section">
          <h2>10. Policy Changes</h2>

          <p>
            We may update this policy to reflect changes in
            our platform, licensing practices or applicable
            legal requirements.
          </p>

          <p>
            Updated versions will be published on this page
            with a revised effective date.
          </p>
        </section>

        <section className="copyright-section">
          <h2>11. Contact for Copyright Complaints</h2>

          <p>
            For copyright complaints, licensing questions or
            requests relating to music content, please contact
            KEERTHANA MUSIC through our Contact Us page.
          </p>

          <Link
            to="/contact-us"
            className="copyright-contact-button"
          >
            Contact KEERTHANA MUSIC
          </Link>
        </section>

        <nav className="copyright-links">
          <Link to="/about-us">About Us</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/premium">Premium</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </nav>

        <footer className="copyright-footer">
          © {new Date().getFullYear()} KEERTHANA MUSIC.
          All rights reserved.
        </footer>

      </div>
    </div>
  );
};

export default CopyrightPolicy;
