import React from "react";
import "../assets/css/PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const effectiveDate = "8 November 2026";

  const Section = ({ title, children }) => (
    <section className="privacy-section">
      <h2 className="privacy-heading">{title}</h2>
      {children}
    </section>
  );

  const Paragraph = ({ children }) => (
    <p className="privacy-paragraph">{children}</p>
  );

  const Subheading = ({ children }) => (
    <h3 className="privacy-subheading">{children}</h3>
  );

  return (
    <main className="privacy-page">
      <div className="privacy-container">

        {/* PAGE HEADER */}
        <header className="privacy-header">
          <div className="privacy-brand">
            KEERTHANA MUSIC
          </div>

          <h1 className="privacy-title">
            Privacy Policy
          </h1>

          <p className="privacy-subtitle">
            Your privacy matters to us. This Privacy Policy explains
            how KEERTHANA MUSIC collects, uses, stores and protects
            information when you use our website and mobile application.
          </p>

          <div className="privacy-date">
            Effective Date: {effectiveDate}
          </div>
        </header>

        {/* 1. INTRODUCTION */}
        <Section title="1. Introduction">
          <Paragraph>
            Welcome to KEERTHANA MUSIC. We provide a platform for
            users to discover, listen to and enjoy Christian music,
            worship songs, praise songs and related content.
          </Paragraph>

          <Paragraph>
            This Privacy Policy applies to our website, mobile
            application and related services.
          </Paragraph>

          <Paragraph>
            By using KEERTHANA MUSIC, you acknowledge that you have
            read this Privacy Policy. If you do not agree with the
            practices described here, please discontinue use of
            our services.
          </Paragraph>
        </Section>

        {/* 2. INFORMATION WE COLLECT */}
        <Section title="2. Information We Collect">
          <Paragraph>
            Depending on how you use KEERTHANA MUSIC, we may collect
            the following categories of information:
          </Paragraph>

          <Subheading>Account Information</Subheading>

          <ul className="privacy-list">
            <li>Mobile number used for registration or login.</li>
            <li>Name or profile information you choose to provide.</li>
            <li>Account identifiers and authentication information.</li>
          </ul>

          <Subheading>Music Activity</Subheading>

          <ul className="privacy-list">
            <li>Songs you like or add to favorites.</li>
            <li>Listening history and playback activity.</li>
            <li>Playlists and music preferences.</li>
            <li>Search queries and selected language preferences.</li>
          </ul>

          <Subheading>Technical Information</Subheading>

          <ul className="privacy-list">
            <li>Device type and operating system.</li>
            <li>Application version and browser information.</li>
            <li>IP address and diagnostic information.</li>
            <li>Crash reports, performance and security logs.</li>
          </ul>

          <Subheading>Information You Send Us</Subheading>

          <Paragraph>
            If you contact us, we may collect your email address,
            message and any information you voluntarily provide
            to help us respond.
          </Paragraph>
        </Section>

        {/* 3. HOW WE USE INFORMATION */}
        <Section title="3. How We Use Your Information">
          <Paragraph>
            We may use collected information for the following purposes:
          </Paragraph>

          <ul className="privacy-list">
            <li>To create and manage user accounts.</li>
            <li>To authenticate users through supported login methods.</li>
            <li>To provide music streaming and playback services.</li>
            <li>To save liked songs and listening preferences.</li>
            <li>To improve search and music recommendations.</li>
            <li>To maintain application performance and security.</li>
            <li>To respond to customer support requests.</li>
            <li>To detect misuse, fraud and unauthorized activity.</li>
            <li>To display and measure advertisements.</li>
            <li>To comply with applicable legal obligations.</li>
          </ul>
        </Section>

        {/* 4. ADVERTISING */}
        <Section title="4. Advertising Services">
          <Paragraph>
            KEERTHANA MUSIC is designed to provide free access to
            its services and may display advertisements to support
            its operation and maintenance.
          </Paragraph>

          <Subheading>Google AdMob – Android Application</Subheading>

          <Paragraph>
            Our Android application may use Google AdMob to display
            advertisements. Depending on the implementation and
            applicable settings, Google and its advertising partners
            may collect or process information such as:
          </Paragraph>

          <ul className="privacy-list">
            <li>Advertising identifiers and device identifiers.</li>
            <li>IP address and approximate location information.</li>
            <li>Device and application information.</li>
            <li>Advertisement impressions and interactions.</li>
            <li>Diagnostics and fraud-prevention information.</li>
          </ul>

          <Subheading>Google AdSense – Website</Subheading>

          <Paragraph>
            Our website, https://keerthana.co, may use Google AdSense
            to display advertisements. Depending on user settings,
            consent choices and applicable laws, Google and its
            advertising partners may use cookies, IP addresses,
            browser information and similar technologies to:
          </Paragraph>

          <ul className="privacy-list">
            <li>Display advertisements.</li>
            <li>Measure advertising performance.</li>
            <li>Limit repeated advertisements.</li>
            <li>Provide personalized or non-personalized advertisements.</li>
          </ul>

          <Subheading>Personalized Advertising</Subheading>

          <Paragraph>
            Advertising personalization may depend on your location,
            consent choices, browser settings and applicable laws.
            You may be able to manage Google's advertising
            personalization preferences through Google's advertising
            settings.
          </Paragraph>

          <Subheading>Google Privacy Information</Subheading>

          <Paragraph>
            For more information about how Google processes information,
            please review:
          </Paragraph>

          <ul className="privacy-list">
            <li>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="privacy-link"
              >
                Google Privacy Policy
              </a>
            </li>

            <li>
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="privacy-link"
              >
                How Google uses information from sites or apps
              </a>
            </li>

            <li>
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="privacy-link"
              >
                Google Ads Settings
              </a>
            </li>
          </ul>
        </Section>

        {/* 5. COOKIES */}
        <Section title="5. Cookies and Similar Technologies">
          <Paragraph>
            Our website and third-party services may use cookies,
            local storage, web beacons and similar technologies.
          </Paragraph>

          <Paragraph>
            These technologies may be used to maintain website
            functionality, remember preferences, improve performance,
            analyze usage and support advertising services.
          </Paragraph>

          <Paragraph>
            You can manage or delete cookies through your browser
            settings. Disabling certain cookies may affect some
            website features or advertising functionality.
          </Paragraph>
        </Section>

        {/* 6. INFORMATION SHARING */}
        <Section title="6. Sharing of Information">
          <Paragraph>
            We do not sell users' personal information to advertisers.
            We may share information with service providers when
            necessary to operate KEERTHANA MUSIC.
          </Paragraph>

          <Subheading>Service Providers</Subheading>

          <ul className="privacy-list">
            <li>
              Google AdMob and Google AdSense for advertising services.
            </li>
            <li>
              Cloud hosting and storage providers used to operate
              our platform.
            </li>
            <li>
              Authentication, security and technical service providers.
            </li>
          </ul>

          <Subheading>Legal Requirements</Subheading>

          <Paragraph>
            We may disclose information where required by applicable
            law, a valid legal request or to protect the rights,
            safety and security of our users and services.
          </Paragraph>
        </Section>

        {/* 7. DATA SECURITY */}
        <Section title="7. Data Storage and Security">
          <Paragraph>
            We use appropriate technical and organizational measures
            intended to protect information against unauthorized
            access, loss, misuse, alteration and disclosure.
          </Paragraph>

          <Paragraph>
            Our platform may use cloud infrastructure, databases
            and storage services to operate the application and
            maintain user information.
          </Paragraph>

          <Paragraph>
            However, no internet transmission or electronic storage
            system can be guaranteed to be completely secure.
          </Paragraph>
        </Section>

        {/* 8. DATA RETENTION */}
        <Section title="8. Data Retention">
          <Paragraph>
            We retain personal information for as long as necessary
            to provide our services, maintain accounts, meet legal
            obligations, resolve disputes and protect our platform.
          </Paragraph>

          <Paragraph>
            When information is no longer required, we will take
            reasonable steps to delete it or anonymize it, subject
            to applicable legal requirements and legitimate retention
            needs.
          </Paragraph>
        </Section>

        {/* 9. ACCOUNT DELETION */}
        <Section title="9. Account Deletion">
          <Paragraph>
            Users may request deletion of their KEERTHANA MUSIC
            accounts and associated personal information.
          </Paragraph>

          <Paragraph>
            Please use the account deletion option within the app,
            if available, or contact our support team using the
            contact details provided on our Contact Us page.
          </Paragraph>

          <Paragraph>
            We will process valid deletion requests in accordance
            with applicable laws. Some information may need to be
            retained where legally required or necessary for
            legitimate security and legal purposes.
          </Paragraph>

          <Paragraph>
            If your account deletion request is approved, we will
            take reasonable steps to delete or anonymize associated
            personal information, subject to those exceptions.
          </Paragraph>
        </Section>

        {/* 10. CHILDREN */}
        <Section title="10. Children's Privacy">
          <Paragraph>
            KEERTHANA MUSIC is not intended to knowingly collect
            personal information from children in violation of
            applicable laws.
          </Paragraph>

          <Paragraph>
            If we become aware that personal information has been
            collected from a child without legally required
            authorization, we will take appropriate steps to
            address the situation.
          </Paragraph>

          <Paragraph>
            Parents or guardians who believe a child has provided
            personal information may contact us.
          </Paragraph>
        </Section>

        {/* 11. THIRD-PARTY SERVICES */}
        <Section title="11. Third-Party Services and Links">
          <Paragraph>
            KEERTHANA MUSIC may contain links to third-party websites,
            services or media platforms.
          </Paragraph>

          <Paragraph>
            These third parties operate under their own privacy
            policies and terms. We are not responsible for their
            independent privacy practices.
          </Paragraph>

          <Paragraph>
            We encourage users to review the privacy policies of
            third-party services before using them.
          </Paragraph>
        </Section>

        {/* 12. PRIVACY RIGHTS */}
        <Section title="12. Your Privacy Rights">
          <Paragraph>
            Subject to applicable law, you may have the right to:
          </Paragraph>

          <ul className="privacy-list">
            <li>Request access to your personal information.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your account and personal data.</li>
            <li>Raise concerns about how your information is used.</li>
            <li>Exercise applicable consent and advertising choices.</li>
          </ul>

          <Paragraph>
            To exercise your rights, please contact us through
            our Contact Us page.
          </Paragraph>
        </Section>

        {/* 13. INTERNATIONAL PROCESSING */}
        <Section title="13. International Data Processing">
          <Paragraph>
            Some service providers may process or store information
            in locations outside your state or country. Where this
            occurs, we will take steps required by applicable
            data-protection laws.
          </Paragraph>
        </Section>

        {/* 14. POLICY CHANGES */}
        <Section title="14. Changes to This Privacy Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time
            to reflect changes in our services, advertising
            providers, technology or legal requirements.
          </Paragraph>

          <Paragraph>
            Any updated version will be published on this page
            with a revised effective date.
          </Paragraph>
        </Section>

        {/* 15. CONTACT */}
        <Section title="15. Contact Us">
          <Paragraph>
            If you have questions, concerns or requests relating
            to this Privacy Policy or your personal information,
            please contact KEERTHANA MUSIC through the Contact Us
            page on our website.
          </Paragraph>

          <Paragraph>
            Website:{" "}
            <a
              href="https://keerthana.co"
              target="_blank"
              rel="noopener noreferrer"
              className="privacy-link"
            >
              https://keerthana.co
            </a>
          </Paragraph>

          <Paragraph>
            Please use your verified support email address and
            contact details published on the Contact Us page.
          </Paragraph>
        </Section>

        {/* IMPORTANT NOTE */}
        <div className="privacy-note">
          <strong>Important:</strong> This Privacy Policy is a
          general draft for KEERTHANA MUSIC. Before publishing,
          verify that it matches your actual login system,
          database, AWS services, advertising SDKs, cookies,
          analytics tools and data-retention practices.
          Do not claim that an advertising feature or privacy
          control is active unless it has actually been implemented.
        </div>

        {/* FOOTER */}
        <footer className="privacy-footer">
          © {new Date().getFullYear()} KEERTHANA MUSIC.
          All rights reserved.
        </footer>

      </div>
    </main>
  );
};

export default PrivacyPolicy;