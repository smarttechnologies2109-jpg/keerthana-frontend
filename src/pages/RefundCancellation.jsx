
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/RefundCancellation.css";

const RefundCancellation = () => {
  return (
    <div className="refund-page">
      <div className="refund-container">

        <header className="refund-header">
          <span className="refund-brand">KEERTHANA MUSIC</span>
          <h1>Refund & Cancellation Policy</h1>
          <p>
            Please read our refund and cancellation terms
            before using any paid services offered by KEERTHANA MUSIC.
          </p>
          <span className="refund-date">
            Effective Date: 8 November 2026
          </span>
        </header>

        <section className="refund-section">
          <h2>1. Introduction</h2>
          <p>
            KEERTHANA MUSIC aims to provide users with a simple
            and transparent music experience. This policy explains
            how refunds and cancellations are handled for services
            offered through our platform.
          </p>
        </section>

        <section className="refund-section">
          <h2>2. Free Music Access</h2>
          <p>
            Our standard music access is currently free and
            supported by advertisements.
          </p>
          <ul>
            <li>No payment is required for standard free access.</li>
            <li>No subscription cancellation is required for free access.</li>
            <li>There are no refunds for services for which no payment was made.</li>
          </ul>
        </section>

        <section className="refund-section">
          <h2>3. Premium Services and Paid Features</h2>
          <p>
            KEERTHANA MUSIC may offer separate Premium memberships
            or paid features in the future or through an existing
            active purchase flow.
          </p>
          <p>
            Any applicable price, billing period, renewal conditions
            and cancellation terms will be displayed before a user
            completes a purchase.
          </p>
          <p>
            This policy does not promise that any particular
            Premium plan is currently available for purchase.
          </p>
        </section>

        <section className="refund-section">
          <h2>4. Refund Eligibility</h2>
          <p>
            If paid services are made available, refund requests
            will be reviewed according to the applicable purchase
            terms, payment provider rules and consumer protection
            laws.
          </p>
          <p>
            Where a payment was made in error, duplicated, or
            processed without authorization, users should contact
            our support team promptly with the relevant transaction
            details.
          </p>
          <p>
            Refund eligibility will be assessed individually.
            A refund is not guaranteed merely because a user
            changes their mind or stops using a service.
          </p>
        </section>

        <section className="refund-section">
          <h2>5. Subscription Cancellation</h2>
          <p>
            If a recurring Premium subscription is offered,
            users may cancel it using the cancellation method
            provided for that subscription.
          </p>
          <p>
            If the subscription was purchased through Google Play,
            cancellation may need to be completed through the
            Google Play subscription settings.
          </p>
          <p>
            Cancelling a subscription generally stops future
            renewals. It does not automatically mean that a
            refund will be issued for a previous payment.
          </p>
        </section>

        <section className="refund-section">
          <h2>6. Payment Processing</h2>
          <p>
            Where applicable, payments may be processed by
            third-party payment providers.
          </p>
          <p>
            KEERTHANA MUSIC will review payment-related complaints
            and coordinate with the relevant payment provider
            where necessary.
          </p>
          <p>
            Refund processing times may depend on the payment
            provider and the user's bank.
          </p>
        </section>

        <section className="refund-section">
          <h2>7. How to Request a Refund</h2>
          <p>
            For payment-related questions or refund requests,
            please contact our support team through the Contact
            Us page.
          </p>
          <p>
            Please provide the following information where available:
          </p>
          <ul>
            <li>Your registered account details.</li>
            <li>Payment transaction or order reference.</li>
            <li>Payment date and amount.</li>
            <li>A brief explanation of your request.</li>
          </ul>
          <p>
            Do not send passwords, OTPs, card PINs or other
            confidential authentication information.
          </p>
        </section>

        <section className="refund-section">
          <h2>8. Refund Review and Processing</h2>
          <p>
            We will review refund requests and may contact users
            if additional information is required.
          </p>
          <p>
            Approved refunds will be processed through the
            applicable payment method or payment provider,
            subject to its procedures.
          </p>
        </section>

        <section className="refund-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this policy when our services,
            payment methods or legal requirements change.
            Updated terms will be published on this page
            with a revised effective date.
          </p>
        </section>

        <section className="refund-section">
          <h2>10. Contact Us</h2>
          <p>
            For questions about refunds, cancellations or
            payment issues, please visit our Contact Us page.
          </p>
          <Link to="/contact-us" className="refund-contact-link">
            Contact KEERTHANA MUSIC
          </Link>
        </section>

        <nav className="refund-links">
          <Link to="/about-us">About Us</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/premium">Premium</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </nav>

        <div className="refund-footer">
          © {new Date().getFullYear()} KEERTHANA MUSIC.
          All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default RefundCancellation;
