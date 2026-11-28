
import React, { useCallback, useEffect, useState } from "react";

import {
  prepareRewardedAd,
  showRewardedAd,
} from "../services/rewardedAds";

import {
  getAdFreeStatus,
} from "../services/rewardService";

import {
  FaGift,
  FaPlay,
  FaShieldAlt,
  FaClock,
  FaSyncAlt,
  FaHeadphones,
  FaCheckCircle,
} from "react-icons/fa";

import "../assets/css/ad-free-reward.css";

export default function AdFreeReward() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD REWARD STATUS
  // =====================================================

  const loadRewardStatus = useCallback(async () => {
    try {
      setChecking(true);

      const response = await getAdFreeStatus();

      setStatus(response);
      setError("");
    } catch (err) {
      console.error(
        "[KEERTHANA Reward] Status error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load your reward status."
      );
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    loadRewardStatus();
  }, [loadRewardStatus]);

  // =====================================================
  // REWARD STATUS DISPLAY
  // =====================================================

  const isAdFree =
    status?.isAdFree === true ||
    status?.active === true;

  const remainingMinutes =
    Number(
      status?.remainingMinutes ??
      status?.remaining_minutes ??
      0
    );

  // =====================================================
  // WATCH REWARDED AD
  // =====================================================

  const handleWatchAd = async () => {
    if (watching) return;

    try {
      setWatching(true);
      setError("");
      setMessage("");

      // Step 1: Prepare backend SSV session and load ad.
      await prepareRewardedAd();

      // Step 2: Show the prepared rewarded video.
      // The plugin resolves with a reward item only
      // when the user earns the ad reward.
      const rewardItem = await showRewardedAd();

      if (!rewardItem) {
        throw new Error(
          "The ad did not return a reward result."
        );
      }

      console.info(
        "[KEERTHANA Reward] Ad reward callback:",
        rewardItem
      );

      // Do not activate ad-free access here.
      // Wait for Google's backend SSV verification.
      setMessage(
        "Video completed! We're verifying your reward. Please check your status shortly."
      );

      // Check once immediately. Google SSV may arrive later.
      await loadRewardStatus();

    } catch (err) {
      console.error(
        "[KEERTHANA Reward] Ad error:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to show the rewarded ad. Please try again."
      );
    } finally {
      setWatching(false);
    }
  };

  // =====================================================
  // REFRESH STATUS
  // =====================================================

  const handleRefresh = async () => {
    await loadRewardStatus();
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="ad-free-page">
      <div className="ad-free-shell">
        <header className="ad-free-topbar">
          <div>
            <span className="ad-free-topbar-kicker">KEERTHANA • LISTENING REWARDS</span>
            <h2>Your music. Your uninterrupted moment.</h2>
            <p>Enjoy your favourite worship songs with fewer interruptions.</p>
          </div>
          <div className="ad-free-topbar-mark"><FaHeadphones /></div>
        </header>
        <div className="ad-free-feature-row" aria-label="Reward benefits">
          <div><FaCheckCircle /><span>Securely verified rewards</span></div>
          <div><FaCheckCircle /><span>No payment required</span></div>
          <div><FaCheckCircle /><span>Refresh your status anytime</span></div>
        </div>
      <section className="ad-free-card">

        <div className="ad-free-icon">
          <FaGift />
        </div>

        <p className="ad-free-eyebrow">
          KEERTHANA MUSIC REWARDS
        </p>

        <h1>Enjoy Music Without Ads</h1>

        <p className="ad-free-description">
          Watch a short video advertisement and
          enjoy 30 minutes of uninterrupted
          Christian music.
        </p>

        {/* REWARD DETAILS */}

        <div className="ad-free-benefit">
          <div className="ad-free-benefit-icon">
            <FaClock />
          </div>

          <div>
            <strong>30 Minutes Ad-Free</strong>
            <span>
              One completed rewarded video
            </span>
          </div>
        </div>

        {/* CURRENT REWARD STATUS */}

        <div className={"ad-free-status " + (isAdFree ? "is-active" : "is-inactive")}>
          <div className="ad-free-status-heading"><span className="ad-free-status-pulse" /><span>{loading ? "SYNCING YOUR REWARD" : isAdFree ? "YOUR LISTENING PASS" : "YOUR REWARD STATUS"}</span></div>

          {loading ? (
            <p>Checking your reward status...</p>
          ) : isAdFree ? (
            <>
              <span className="ad-free-status-active">
                Ad-Free Listening Active
              </span>

              <strong>
                {remainingMinutes > 0
                  ? `${remainingMinutes} minutes remaining`
                  : "Your reward is active"}
              </strong>
            </>
          ) : (
            <>
              <span className="ad-free-status-inactive">
                No Active Reward
              </span>

              <strong>
                Watch a video to earn 30 minutes
              </strong>
            </>
          )}

        </div>

        {/* WATCH AD BUTTON */}

        <button
          type="button"
          className="ad-free-watch-button"
          onClick={handleWatchAd}
          disabled={watching || loading || isAdFree}
        >
          {watching ? (
            <>
              <FaSyncAlt className="ad-free-spin" />
              Preparing Rewarded Ad...
            </>
          ) : (
            <>
              <FaPlay />
              Watch Ad & Get 30 Minutes
            </>
          )}
        </button>

        {/* REFRESH STATUS */}

        <button
          type="button"
          className="ad-free-refresh-button"
          onClick={handleRefresh}
          disabled={checking || watching}
        >
          <FaSyncAlt />
          {checking ? "Checking..." : "Refresh Reward Status"}
        </button>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div
            className="ad-free-message success"
            role="status"
          >
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="ad-free-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* SECURITY NOTE */}

        <div className="ad-free-security">
          <FaShieldAlt />
          <span>Rewards are activated only after secure server-side verification.</span>
        </div>
      </section>
      <aside className="ad-free-how-card">
        <span className="ad-free-how-kicker">HOW IT WORKS</span>
        <h3>A simple way to enjoy more music</h3>
        <ol>
          <li><span>01</span><div><strong>Start a rewarded video</strong><small>Choose to watch when you are ready.</small></div></li>
          <li><span>02</span><div><strong>Complete the video</strong><small>Allow the reward process to finish.</small></div></li>
          <li><span>03</span><div><strong>Enjoy your listening time</strong><small>Access activates after secure verification.</small></div></li>
        </ol>
        <p><FaShieldAlt /> Your reward is verified securely on our server.</p>
      </aside>
      </div>
    </main>
  );
}
