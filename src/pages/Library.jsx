
import {
  FaMusic,
  FaPlus,
  FaHistory,
  FaArrowRight,
  FaHeadphones,
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
        "Return to your personal collections of worship songs and Christian music.",
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
        "Bring your favourite worship songs together in a collection of your own.",
      action: "Start creating",
      icon: <FaPlus />,
      className: "library-card-create",
      onClick: openCreatePlaylist,
    },
    {
      id: "history",
      number: "03",
      title: "Recently Played",
      description:
        "Return to the songs you have listened to and continue your worship time.",
      action: "View listening history",
      icon: <FaHistory />,
      className: "library-card-history",
      onClick: () => navigate("/history"),
    },
  ];

  return (
    <main className="library-page">
      <section className="library-hero">
        <div className="library-hero-copy">
          <span className="library-eyebrow">
            KEERTHANA MUSIC
          </span>

          <h1>Your Library</h1>

          <p>
            Your personal space for worship, favourite
            collections, and the music you love.
          </p>
        </div>

        <div className="library-hero-art" aria-hidden="true">
          <div className="library-art-circle library-art-circle-one" />
          <div className="library-art-circle library-art-circle-two" />

          <div className="library-art-icon">
            <FaHeadphones />
          </div>

          <span className="library-art-note">♪</span>
          <span className="library-art-note library-art-note-two">♫</span>
        </div>
      </section>

      <section className="library-content">
        <div className="library-section-heading">
          <div>
            <span className="library-section-eyebrow">
              MADE FOR YOUR WORSHIP
            </span>

            <h2>Your music, your way</h2>

            <p>
              Pick up where you left off or create a collection
              for your next worship session.
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
                <FaArrowRight className="library-card-arrow" />
              </span>
            </button>
          ))}
        </div>

        <div className="library-footer-note">
          <span className="library-footer-icon">
            <FaMusic />
          </span>

          <p>
            Let every song bring you closer to the joy of worship.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Library;
