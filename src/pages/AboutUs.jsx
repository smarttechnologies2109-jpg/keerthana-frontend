
import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/AboutUs.css";

const AboutUs = () => {
  return (
    <main className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-tag">
            WELCOME TO KEERTHANA
          </span>

          <h1>
            Music That Inspires
            <span> Faith & Worship</span>
          </h1>

          <p>
            KEERTHANA MUSIC is a platform dedicated to
            Christian songs, praise and worship.
            Discover music that brings you closer to
            faith, hope and inspiration.
          </p>

          <Link to="/all-songs" className="about-button">
            Explore Music
          </Link>
        </div>
      </section>

      {/* Introduction */}
      <section className="about-section">
        <div className="about-container">
          <span className="about-label">ABOUT US</span>

          <h2>About KEERTHANA MUSIC</h2>

          <p>
            KEERTHANA MUSIC is a Christian music platform
            created to make Christian songs and worship
            music accessible to listeners everywhere.
          </p>

          <p>
            Our platform brings together Christian music
            across multiple languages, helping listeners
            discover songs, enjoy praise and worship,
            and experience music in their daily lives.
          </p>

          <p>
            We aim to provide a simple and enjoyable
            listening experience through our website
            and mobile application.
          </p>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="about-section about-highlight">
        <div className="about-container about-grid">

          <div className="about-card">
            <div className="about-icon">♡</div>
            <h3>Our Mission</h3>
            <p>
              To make Christian music accessible to
              everyone and encourage praise, worship,
              faith and inspiration through music.
            </p>
          </div>

          <div className="about-card">
            <div className="about-icon">✦</div>
            <h3>Our Vision</h3>
            <p>
              To build a trusted Christian music
              platform connecting listeners with
              songs across different languages.
            </p>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="about-section">
        <div className="about-container">
          <span className="about-label">OUR PLATFORM</span>

          <h2>What You Can Discover</h2>

          <div className="about-features">

            <div className="about-feature">
              <span>♫</span>
              <h3>Christian Songs</h3>
              <p>
                Discover Christian songs and worship music.
              </p>
            </div>

            <div className="about-feature">
              <span>🌍</span>
              <h3>Multiple Languages</h3>
              <p>
                Explore music in Telugu, Hindi, English,
                Malayalam, Kannada and Tamil.
              </p>
            </div>

            <div className="about-feature">
              <span>♡</span>
              <h3>Your Favorites</h3>
              <p>
                Save your favorite songs and enjoy them
                whenever you want.
              </p>
            </div>

            <div className="about-feature">
              <span>▶</span>
              <h3>Easy Listening</h3>
              <p>
                Enjoy a simple and convenient music
                listening experience.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="about-closing">
        <h2>Let Music Bring You Closer to Faith</h2>
        <p>
          Thank you for being part of KEERTHANA MUSIC.
        </p>

        <Link to="/all-songs" className="about-button">
          Start Listening
        </Link>
      </section>

    </main>
  );
};

export default AboutUs;
