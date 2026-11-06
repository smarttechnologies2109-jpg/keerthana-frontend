
import { useEffect, useRef, useState } from "react";

import {
  FaCheck,
  FaCrown,
  FaMusic,
  FaPlay,
  FaShieldAlt,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

import "../assets/css/premium.css";

/* =========================================================
   LOAD CASHFREE CHECKOUT SCRIPT
========================================================= */

function loadCashfreeScript() {
  return new Promise((resolve) => {
    if (window.Cashfree) {
      resolve(true);
      return;
    }

    const scriptUrl =
      "https://sdk.cashfree.com/js/v3/cashfree.js";

    const existing = document.querySelector(
      `script[src="${scriptUrl}"]`
    );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      // Handle a script that has already loaded.
      if (window.Cashfree) {
        resolve(true);
      }

      return;
    }

    const script = document.createElement("script");

    script.src = scriptUrl;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

/* =========================================================
   PREMIUM PAGE
========================================================= */

function Premium() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    subscription,
    isPremium,
    adFree,
    refreshUser,
  } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [payingPlan, setPayingPlan] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const verifiedOrderRef = useRef("");

  /* =========================================================
     LOAD SUBSCRIPTION PLANS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        setPlansError("");

        const response = await API.get(
          "/subscriptions/plans"
        );

        if (!mounted) return;

        setPlans(response.data.plans || []);
      } catch (error) {
        console.error(
          "Load subscription plans error:",
          error
        );

        if (!mounted) return;

        setPlans([]);

        setPlansError(
          error.response?.data?.message ||
          "Unable to load subscription plans."
        );
      } finally {
        if (mounted) {
          setLoadingPlans(false);
        }
      }
    };

    loadPlans();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     VERIFY CASHFREE PAYMENT AFTER REDIRECT

     Backend return URL:
     /premium?cashfree_order_id={order_id}

     We also support order_id as a fallback.
  ========================================================= */

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const orderId =
      params.get("cashfree_order_id") ||
      params.get("order_id");

    if (!orderId || !user) {
      return;
    }

    // Prevent duplicate verification during rerenders.
    if (verifiedOrderRef.current === orderId) {
      return;
    }

    verifiedOrderRef.current = orderId;

    const verifyReturnedPayment = async () => {
      try {
        setPayingPlan("verification");
        setPaymentSuccess(false);

        setPaymentMessage(
          "Payment received. Verifying securely..."
        );

        /*
          Your existing Cashfree backend expects:
          POST /payments/verify
          { order_id: "..." }
        */

        const response = await API.post(
          "/payments/verify",
          {
            order_id: orderId,
          }
        );

        console.log(
          "Cashfree verification response:",
          response.data
        );

        if (response.data?.success) {
          if (typeof refreshUser === "function") {
            await refreshUser();
          }

          setPaymentSuccess(true);

          setPaymentMessage(
            "Premium activated successfully!"
          );
        } else {
          setPaymentSuccess(false);

          setPaymentMessage(
            response.data?.message ||
            "Payment is not confirmed yet. Please check again."
          );
        }
      } catch (error) {
        console.error(
          "Cashfree payment verification error:",
          error
        );

        console.error(
          "Verification backend response:",
          error.response?.data
        );

        setPaymentSuccess(false);

        setPaymentMessage(
          error.response?.data?.message ||
          "Unable to verify payment. Please contact support if your amount was deducted."
        );
      } finally {
        setPayingPlan(null);

        // Remove the order ID from the address bar.
        navigate("/premium", {
          replace: true,
        });
      }
    };

    verifyReturnedPayment();
  }, [
    location.search,
    user,
    navigate,
    refreshUser,
  ]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     FORMAT PRICE
  ========================================================= */

  const formatPrice = (price) => {
    const number = Number(price);

    if (Number.isNaN(number)) {
      return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  /* =========================================================
     CURRENT SUBSCRIPTION
  ========================================================= */

  const currentPlan =
    subscription?.display_name ||
    "KEERTHANA Free";

  const expiryDate = formatDate(
    subscription?.expires_at
  );

  /* =========================================================
     CHOOSE PREMIUM PLAN - CASHFREE
  ========================================================= */

  const handleChoosePlan = async (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (plan.name === "free") {
      return;
    }

    if (subscription?.plan === plan.name) {
      return;
    }

    try {
      setPayingPlan(plan.id);
      setPaymentSuccess(false);

      setPaymentMessage(
        "Preparing secure Cashfree checkout..."
      );

      /* =========================================
         LOAD CASHFREE SDK
      ========================================= */

      const loaded = await loadCashfreeScript();

      if (!loaded || !window.Cashfree) {
        throw new Error(
          "Unable to load Cashfree checkout. Please try again."
        );
      }

      /* =========================================
         CREATE ORDER ON YOUR BACKEND

         POST /api/payments/create-order
         Body: { plan_id: plan.id }
      ========================================= */

      const response = await API.post(
        "/payments/create-order",
        {
          plan_id: plan.id,
        }
      );

      console.log(
        "Cashfree create order response:",
        response.data
      );

      const {
        order_id,
        payment_session_id,
        environment,
      } = response.data || {};

      if (!order_id || !payment_session_id) {
        throw new Error(
          "Invalid Cashfree order response. Payment session is missing."
        );
      }

      /* =========================================
         INITIALIZE CASHFREE

         Backend environment must be:
         sandbox OR production
      ========================================= */

      const mode =
        environment === "production"
          ? "production"
          : "sandbox";

      const cashfree = window.Cashfree({
        mode,
      });

      if (!cashfree || typeof cashfree.checkout !== "function") {
        throw new Error(
          "Cashfree checkout could not be initialized."
        );
      }

      setPaymentMessage(
        "Opening secure Cashfree payment..."
      );

      /* =========================================
         OPEN CASHFREE CHECKOUT

         Cashfree redirects back to the return URL
         configured by your backend.
      ========================================= */

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });

      /*
        If checkout returns an error without redirecting,
        show it to the user.
      */

      if (checkoutResult?.error) {
        throw new Error(
          checkoutResult.error.message ||
          "Cashfree checkout could not be opened."
        );
      }

      /*
        Do not activate Premium here.
        The backend verifies the order after the
        customer returns to the Premium page.
      */

    } catch (error) {
      console.error(
        "Start Cashfree payment error:",
        error
      );

      console.error(
        "Cashfree backend response:",
        error.response?.data
      );

      setPaymentSuccess(false);

      setPaymentMessage(
        error.response?.data?.message ||
        error.message ||
        "Unable to start payment. Please try again."
      );

      setPayingPlan(null);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="premium-page">

      {/* HERO */}

      <section className="premium-hero">

        <div className="premium-crown">
          <FaCrown />
        </div>

        <span className="premium-brand">
          KEERTHANA PREMIUM
        </span>

        <h1>
          Worship without
          interruptions.
        </h1>

        <p>
          Enjoy your Christian music
          experience without ads.
        </p>

        {user && (
          <div className="premium-current-plan">

            <span>
              Your current plan
            </span>

            <strong>
              {currentPlan}
            </strong>

            {isPremium && expiryDate && (
              <small>
                Active until {expiryDate}
              </small>
            )}

          </div>
        )}

      </section>

      {/* PAYMENT MESSAGE */}

      {paymentMessage && (
        <div
          className={
            paymentSuccess
              ? "premium-payment-message success"
              : "premium-payment-message"
          }
        >
          {paymentMessage}
        </div>
      )}

      {/* BENEFITS */}

      <section className="premium-benefits">

        <BenefitCard
          icon={<FaShieldAlt />}
          title="Ad-Free"
          text="Enjoy KEERTHANA without advertising interruptions."
        />

        <BenefitCard
          icon={<FaMusic />}
          title="Christian Music"
          text="Listen to your favourite Telugu and English Christian songs."
        />

        <BenefitCard
          icon={<FaPlay />}
          title="Keep Listening"
          text="Use playlists, lyrics and your personal music library."
        />

      </section>

      {/* PLANS */}

      <section className="premium-plans-section">

        <div className="premium-section-title">

          <span>
            CHOOSE YOUR PLAN
          </span>

          <h2>
            Simple plans.
          </h2>

          <p>
            Start free and upgrade
            whenever you want an
            ad-free experience.
          </p>

        </div>

        {/* LOADING */}

        {loadingPlans && (
          <div className="premium-plans-loading">
            Loading subscription plans...
          </div>
        )}

        {/* ERROR */}

        {!loadingPlans && plansError && (
          <div className="premium-plans-error">
            {plansError}
          </div>
        )}

        {/* PLAN CARDS */}

        {!loadingPlans &&
          !plansError &&
          plans.length > 0 && (

            <div className="premium-plans">

              {plans.map((plan) => {
                const current =
                  subscription?.plan === plan.name;

                const premium =
                  plan.name === "premium_monthly";

                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    premium={premium}
                    current={current}
                    paying={payingPlan === plan.id}
                    price={formatPrice(plan.price)}
                    onClick={() =>
                      handleChoosePlan(plan)
                    }
                  />
                );
              })}

            </div>
          )}

      </section>

      {/* SUBSCRIPTION STATUS */}

      {user && (
        <section className="premium-status">

          <div>

            <span>
              ACCOUNT
            </span>

            <h3>
              Subscription Status
            </h3>

          </div>

          <div className="premium-status-grid">

            <StatusItem
              label="Account"
              value={user.email}
            />

            <StatusItem
              label="Plan"
              value={currentPlan}
            />

            <StatusItem
              label="Status"
              value={subscription?.status || "active"}
            />

            <StatusItem
              label="Ads"
              value={adFree ? "Ad-Free" : "Enabled"}
            />

            {expiryDate && (
              <StatusItem
                label="Expires"
                value={expiryDate}
              />
            )}

          </div>

        </section>
      )}

    </div>
  );
}

/* =========================================================
   BENEFIT CARD
========================================================= */

function BenefitCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="premium-benefit-card">

      <div className="premium-benefit-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
}

/* =========================================================
   PLAN CARD
========================================================= */

function PlanCard({
  plan,
  price,
  premium,
  current,
  paying,
  onClick,
}) {
  const isFree = plan.name === "free";

  const period =
    plan.name === "premium_monthly"
      ? "/ month"
      : plan.name === "premium_yearly"
      ? "/ year"
      : "forever";

  const features = isFree
    ? [
        "Listen to songs",
        "View lyrics",
        "Create playlists",
        "Like songs",
        "Ads included",
      ]
    : [
        "Everything in Free",
        "No ads",
        "Lyrics",
        "Playlists",
        "Ad-free music experience",
      ];

  let buttonText = "Choose Plan";

  if (paying) {
    buttonText = "Opening Checkout...";
  } else if (current) {
    buttonText = "Current Plan";
  } else if (isFree) {
    buttonText = "Free Plan";
  } else if (plan.name === "premium_monthly") {
    buttonText = "Choose Monthly";
  } else if (plan.name === "premium_yearly") {
    buttonText = "Choose Yearly";
  }

  return (
    <div
      className={
        `premium-plan-card ${
          premium ? "premium-plan-featured" : ""
        }`
      }
    >

      {premium && (
        <div className="premium-popular">
          <FaCrown />
          POPULAR
        </div>
      )}

      {current && (
        <div className="premium-current-badge">
          CURRENT PLAN
        </div>
      )}

      <span className="premium-plan-subtitle">
        {plan.display_name}
      </span>

      <h3>
        {plan.name === "free"
          ? "Free"
          : plan.name === "premium_monthly"
          ? "Premium Monthly"
          : plan.name === "premium_yearly"
          ? "Premium Yearly"
          : plan.display_name}
      </h3>

      <div className="premium-price">

        <strong>
          {price}
        </strong>

        <span>
          {period}
        </span>

      </div>

      {plan.duration_days && (
        <div className="premium-duration">
          {plan.duration_days} days access
        </div>
      )}

      <div className="premium-feature-list">

        {features.map((feature) => (
          <div
            className="premium-feature"
            key={feature}
          >
            <FaCheck />

            <span>
              {feature}
            </span>
          </div>
        ))}

      </div>

      <button
        type="button"
        className="premium-plan-button"
        disabled={current || isFree || paying}
        onClick={onClick}
      >
        {buttonText}
      </button>

    </div>
  );
}

/* =========================================================
   STATUS ITEM
========================================================= */

function StatusItem({
  label,
  value,
}) {
  return (
    <div className="premium-status-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

export default Premium;
