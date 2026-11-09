
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/Footer.css";

const Footer = () => {
  return (
    <footer className="keerthana-footer">
      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">♫</span>
            <span>KEERTHANA</span>
          </Link>

          <p className="footer-subtitle">
            CHRISTIAN MUSIC
          </p>

          <p className="footer-description">
            Telugu Christian Songs • Praise • Worship.
            Discover Christian music and enjoy songs
            that inspire faith, hope and worship.
          </p>
        </div>

        {/* Company */}
        <div className="footer-column">
          <h3>Company</h3>
          <Link to="/about-us">About Us</Link>
          <Link to="/contact-us">Contact Us</Link>
          <Link to="/pricing">Pricing</Link>
        </div>

        {/* Legal */}
        <div className="footer-column">
          <h3>Legal & Policies</h3>
          <Link to="/terms-and-conditions">
            Terms & Conditions
          </Link>
          <Link to="/privacy-policy">
            Privacy Policy
          </Link>
          <Link to="/refund-cancellation">
            Refund & Cancellation
          </Link>
          <Link to="/copyright-policy">
            Copyright / Music Licensing
          </Link>
        </div>

        {/* Support */}
        <div className="footer-column">
          <h3>Support</h3>
          <Link to="/contact-us">Help & Support</Link>
          <Link to="/songs">Explore Songs</Link>
        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} KEERTHANA MUSIC.
          All rights reserved.
        </p>

        <p className="footer-tagline">
          Made with ♡ for Praise & Worship
        </p>
      </div>
    </footer>
  );
};

export default Footer;
