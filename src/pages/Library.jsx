
import {
  FaMusic,
  FaPlus,
  FaHistory,
  FaArrowRight,
  FaHeadphones,
  FaPlay,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import "../assets/css/library.css";

function Library() {
  const navigate = useNavigate();

  const openCreatePlaylist = () => {
    navigate("/playlists?create=true");
  };

  const cards = [
    {
      id: "playlists",
      number: "01",
      title: "Your Playlists",
      description:
        "All your personal collections of worship songs, praise, and Christian music.",
      action: "Explore playlists",
      icon: <FaMusic />,
      className: "library-card-playlists",
      onClick: () => navigate("/playlists"),
    },
    {
      id: "create",
      number: "02",
      title: "Create a Playlist",
      description:
        "Bring your favourite worship songs together and create a collection of your own.",
      action: "Create your collection",
      icon: <FaPlus />,
      className: "library-card-create",
      onClick: openCreatePlaylist,
    },
    {
      id: "history",
      number: "03",
      title: "Recently Played",
      description:
        "Return to the songs you've listened to and continue your worship experience.",
      action: "View listening history",
      icon: <FaHistory />,
      className: "library-card-history",
      onClick: () => navigate("/history"),
    },
  ];

  return (
    <main className="library-page">
      <div className="library-main">
        <section className="library-hero">
          <div className="library-hero-glow" aria-hidden="true" />

          <div className="library-hero-copy">
            <span className="library-eyebrow">
              <span className="library-eyebrow-dot" />
              KEERTHANA MUSIC
            </span>

            <h1>
              Your music.
              <br />
              <span>Your worship.</span>
            </h1>

            <p>
              Every song has a place. Discover your collections,
              revisit meaningful moments, and make your worship personal.
            </p>

            <button
              type="button"
              className="library-hero-button"
              onClick={() => navigate("/playlists")}
            >
              <FaPlay />
              <span>Explore your library</span>
              <FaArrowRight className="library-button-arrow" />
            </button>
          </div>

          <div className="library-hero-art" aria-hidden="true">
            <div className="library-art-orbit library-art-orbit-one" />
            <div className="library-art-orbit library-art-orbit-two" />
            <div className="library-art-glow" />

            <div className="library-art-disc">
              <div className="library-art-disc-inner">
                <FaHeadphones />
              </div>
            </div>

            <span className="library-art-note library-art-note-one">
              ♪
            </span>
            <span className="library-art-note library-art-note-two">
              ♫
            </span>
            <span className="library-art-note library-art-note-three">
              ♪
            </span>

            <div className="library-art-caption">
              <span className="library-art-caption-icon">
                <FaMusic />
              </span>
              <span>
                <strong>Your personal space</strong>
                <small>Made for your worship</small>
              </span>
            </div>
          </div>
        </section>

        <section className="library-content">
          <div className="library-section-heading">
            <div className="library-section-copy">
              <span className="library-section-eyebrow">
                YOUR COLLECTIONS
              </span>

              <h2>Your music, your way</h2>

              <p>
                Everything you love, gathered in one place.
              </p>
            </div>

            <button
              type="button"
              className="library-primary-button"
              onClick={openCreatePlaylist}
            >
              <FaPlus />
              <span>Create playlist</span>
            </button>
          </div>

          <div className="library-grid">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`library-card ${card.className}`}
                onClick={card.onClick}
              >
                <span className="library-card-top">
                  <span className="library-card-icon">
                    {card.icon}
                  </span>

                  <span className="library-card-number">
                    {card.number}
                  </span>
                </span>

                <span className="library-card-content">
                  <span className="library-card-title">
                    {card.title}
                  </span>

                  <span className="library-card-description">
                    {card.description}
                  </span>
                </span>

                <span className="library-card-action">
                  <span>{card.action}</span>
                  <span className="library-card-arrow-wrap">
                    <FaArrowRight className="library-card-arrow" />
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="library-footer-note">
            <span className="library-footer-icon">
              <FaMusic />
            </span>

            <div>
              <strong>Let the music lead your heart.</strong>
              <p>
                A place for praise, prayer, peace, and worship.
              </p>
            </div>

            <span className="library-footer-decoration" aria-hidden="true">
              ♪
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Library;
