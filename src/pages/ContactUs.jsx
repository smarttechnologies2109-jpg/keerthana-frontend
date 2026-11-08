
import React from "react";
import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaHeadset,
  FaMusic,
  FaArrowLeft,
} from "react-icons/fa";

import "../assets/css/ContactUs.css";

const CONTACT = {
  email: "smarttechnologies2109@gmail.com",
  phone: "+91 9866816611",
  address: "Khammam, Telanaga, India",
};

function ContactUs() {
  return (
    <main className="contact-page">

      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero-content">

          <div className="contact-brand">
            <FaMusic />
            <span>KEERTHANA MUSIC</span>
          </div>

          <span className="contact-eyebrow">
            WE ARE HERE TO HELP
          </span>

          <h1>
            Contact <span>Us</span>
          </h1>

          <p>
            Have a question, suggestion or need assistance?
            We would love to hear from you.
            Contact the KEERTHANA MUSIC support team.
          </p>

        </div>
      </section>

      {/* CONTACT CONTENT */}
      <section className="contact-content">

        <div className="contact-heading">
          <span>GET IN TOUCH</span>
          <h2>We'd Love to Hear From You</h2>
          <p>
            Reach out to us using the contact information below.
          </p>
        </div>

        <div className="contact-grid">

          {/* EMAIL */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaEnvelope />
            </div>

            <h3>Email Support</h3>

            <p>
              For general questions, suggestions and support.
            </p>

            <a href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </div>

          {/* PHONE */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaPhoneAlt />
            </div>

            <h3>Phone Support</h3>

            <p>
              Contact us for assistance and enquiries.
            </p>

            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
              {CONTACT.phone}
            </a>
          </div>

          {/* ADDRESS */}
          <div className="contact-card">
            <div className="contact-icon">
              <FaMapMarkerAlt />
            </div>

            <h3>Our Location</h3>

            <p>
              Business location of KEERTHANA MUSIC.
            </p>

            <span>{CONTACT.address}</span>
          </div>

        </div>

        {/* SUPPORT SECTION */}
        <div className="contact-support">

          <div className="contact-support-icon">
            <FaHeadset />
          </div>

          <div className="contact-support-text">
            <h3>Need Help With KEERTHANA?</h3>

            <p>
              For account assistance, music-related questions,
              technical issues or feedback, please contact
              our support team by email.
            </p>

            <a
              href={`mailto:${CONTACT.email}?subject=KEERTHANA%20MUSIC%20Support`}
              className="contact-button"
            >
              <FaEnvelope />
              Contact Support
            </a>
          </div>

        </div>

        {/* BACK HOME */}
        <div className="contact-back">
          <Link to="/home">
            <FaArrowLeft />
            Back to Home
          </Link>
        </div>

      </section>

    </main>
  );
}

export default ContactUs;
