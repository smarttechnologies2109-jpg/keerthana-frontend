
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/Pricing.css";

const Pricing = () => {
  return (
    <div className="pricing-page">
      <div className="pricing-container">

        <header className="pricing-header">
          <span className="pricing-brand">KEERTHANA MUSIC</span>

          <h1>Simple & Transparent Pricing</h1>

          <p>
            Enjoy Christian music, praise and worship.
            Our standard music experience is free for everyone.
          </p>
        </header>

        <section className="pricing-main-card">
          <div className="pricing-top">
            <span className="pricing-plan-badge">
              STANDARD ACCESS
            </span>

            <h2>Free Music Experience</h2>

            <div className="pricing-amount">
              <span className="pricing-currency">₹</span>
              <span className="pricing-value">0</span>
              <span className="pricing-period">/ forever</span>
            </div>

            <p>
              No mandatory subscription.
              No monthly payment for standard access.
            </p>
          </div>

          <div className="pricing-separator" />

          <div className="pricing-feature-section">
            <h3>Included with Free Access</h3>

            <ul>
              <li>
                <span>✓</span>
                Access to available Christian songs
              </li>
              <li>
                <span>✓</span>
                Praise and worship music
              </li>
              <li>
                <span>✓</span>
                Explore artists and albums
              </li>
              <li>
                <span>✓</span>
                Like and save favorite songs
              </li>
              <li>
                <span>✓</span>
                Search available music
              </li>
              <li>
                <span>✓</span>
                Explore supported languages
              </li>
              <li>
                <span>✓</span>
                Access available ministries and categories
              </li>
            </ul>
          </div>

          <Link to="/all-songs" className="pricing-explore-btn">
            Explore Songs
          </Link>

          <p className="pricing-small-note">
            Standard access is free and supported by advertisements.
          </p>
        </section>

        <section className="pricing-advertisement">
          <div className="pricing-ad-icon">♪</div>

          <div>
            <h2>Supported by Advertisements</h2>

            <p>
              We aim to make Christian music accessible to everyone.
              Advertisements may help support the operation,
              maintenance and development of KEERTHANA MUSIC.
            </p>

            <p>
              We may use Google AdMob in our Android application
              and Google AdSense on our website for advertising.
            </p>
          </div>
        </section>

        <section className="pricing-transparency">
          <h2>Our Pricing Commitment</h2>

          <p>
            Our standard music access is currently free.
            If we introduce new paid services or change our pricing
            in the future, we will communicate the applicable
            terms and charges clearly before they take effect.
          </p>
        </section>

        <nav className="pricing-page-links">
          <Link to="/about-us">About Us</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms & Conditions</Link>
        </nav>

      </div>
    </div>
  );
};

export default Pricing;
