import {
  useEffect,
  useState,
} from "react";

import {
  FaCheck,
  FaCrown,
  FaMusic,
  FaPlay,
  FaShieldAlt,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import API
  from "../services/api";

import "../assets/css/premium.css";


/* =========================================================
   LOAD RAZORPAY CHECKOUT SCRIPT
========================================================= */

function loadRazorpayScript() {

  return new Promise(
    (resolve) => {

      /* Already loaded */

      if (window.Razorpay) {

        resolve(true);

        return;

      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";


      script.onload =
        () => {

          resolve(true);

        };


      script.onerror =
        () => {

          resolve(false);

        };


      document.body.appendChild(
        script
      );

    }
  );

}


/* =========================================================
   PREMIUM PAGE
========================================================= */

function Premium() {

  const navigate =
    useNavigate();


  const {
    user,
    subscription,
    isPremium,
    adFree,
    refreshUser,
  } = useAuth();


  /* =========================================================
     STATE
  ========================================================= */

  const [
    plans,
    setPlans,
  ] =
    useState([]);


  const [
    loadingPlans,
    setLoadingPlans,
  ] =
    useState(true);


  const [
    plansError,
    setPlansError,
  ] =
    useState("");


  const [
    payingPlan,
    setPayingPlan,
  ] =
    useState(null);


  const [
    paymentMessage,
    setPaymentMessage,
  ] =
    useState("");


  const [
    paymentSuccess,
    setPaymentSuccess,
  ] =
    useState(false);


  /* =========================================================
     LOAD SUBSCRIPTION PLANS
  ========================================================= */

  useEffect(() => {

    const loadPlans =
      async () => {

        try {

          setLoadingPlans(
            true
          );


          setPlansError(
            ""
          );


          const response =
            await API.get(
              "/subscriptions/plans"
            );


          setPlans(
            response.data.plans ||
            []
          );


        } catch (error) {

          console.error(
            "Load subscription plans error:",
            error
          );


          setPlans([]);


          setPlansError(
            error.response
              ?.data
              ?.message ||

            "Unable to load subscription plans"
          );


        } finally {

          setLoadingPlans(
            false
          );

        }

      };


    loadPlans();

  }, []);


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate =
    (date) => {

      if (!date) {

        return null;

      }


      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {

          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",

        }
      );

    };


  /* =========================================================
     FORMAT PRICE
  ========================================================= */

  const formatPrice =
    (price) => {

      const number =
        Number(price);


      if (
        Number.isNaN(
          number
        )
      ) {

        return "₹0";

      }


      return new Intl
        .NumberFormat(
          "en-IN",
          {

            style:
              "currency",

            currency:
              "INR",

            maximumFractionDigits:
              0,

          }
        )
        .format(
          number
        );

    };


  /* =========================================================
     CURRENT SUBSCRIPTION
  ========================================================= */

  const currentPlan =
    subscription
      ?.display_name ||
    "KEERTHANA Free";


  const expiryDate =
    formatDate(
      subscription
        ?.expires_at
    );


  /* =========================================================
     CHOOSE PREMIUM PLAN
  ========================================================= */

  const handleChoosePlan =
    async (
      plan
    ) => {

      /* =====================================
         LOGIN REQUIRED
      ===================================== */

      if (!user) {

        navigate(
          "/login"
        );

        return;

      }


      /* =====================================
         FREE PLAN
      ===================================== */

      if (
        plan.name ===
        "free"
      ) {

        return;

      }


      /* =====================================
         CURRENT PLAN
      ===================================== */

      if (
        subscription?.plan ===
        plan.name
      ) {

        return;

      }


      try {

        setPayingPlan(
          plan.id
        );


        setPaymentSuccess(
          false
        );


        setPaymentMessage(
          "Preparing secure checkout..."
        );


        /* =====================================
           LOAD RAZORPAY
        ===================================== */

        const loaded =
          await loadRazorpayScript();


        if (!loaded) {

          setPaymentMessage(
            "Unable to load Razorpay checkout."
          );


          setPayingPlan(
            null
          );


          return;

        }


        /* =====================================
           CREATE PAYMENT ORDER

           Backend:
           POST /api/payments/create-order
        ===================================== */

        const response =
          await API.post(
            "/payments/create-order",
            {

              plan_id:
                plan.id,

            }
          );


        console.log(
          "Payment order response:",
          response.data
        );


        const {
          order,
          key_id,
        } =
          response.data;


        if (
          !order?.id ||
          !key_id
        ) {

          throw new Error(
            "Invalid payment order received from server"
          );

        }


        /* =====================================
           RAZORPAY CHECKOUT OPTIONS
        ===================================== */

        const options = {

          key:
            key_id,


          amount:
            order.amount,


          currency:
            order.currency,


          name:
            "KEERTHANA",


          description:
            plan.display_name ||
            "KEERTHANA Premium",


          order_id:
            order.id,


          /* =================================
             PAYMENT SUCCESS
          ================================= */

          handler:
            async (
              paymentResponse
            ) => {

              try {

                console.log(
                  "Razorpay payment response:",
                  paymentResponse
                );


                setPaymentMessage(
                  "Payment successful. Verifying payment..."
                );


                /* =============================
                   VERIFY PAYMENT
                ============================= */

                const verifyResponse =
                  await API.post(
                    "/payments/verify",
                    {

                      razorpay_order_id:
                        paymentResponse
                          .razorpay_order_id,


                      razorpay_payment_id:
                        paymentResponse
                          .razorpay_payment_id,


                      razorpay_signature:
                        paymentResponse
                          .razorpay_signature,

                    }
                  );


                console.log(
                  "Payment verification response:",
                  verifyResponse.data
                );


                /* =============================
                   VERIFIED
                ============================= */

                if (
                  verifyResponse
                    .data
                    .success
                ) {

                  /* ===========================
                     REFRESH AUTH USER

                     This reloads subscription
                     from /auth/me.
                  =========================== */

                  if (
                    typeof refreshUser ===
                    "function"
                  ) {

                    await refreshUser();

                  }


                  setPaymentSuccess(
                    true
                  );


                  setPaymentMessage(
                    "Premium activated successfully!"
                  );

                } else {

                  setPaymentSuccess(
                    false
                  );


                  setPaymentMessage(
                    "Payment verification failed."
                  );

                }


              } catch (error) {

                console.error(
                  "Payment verification error:",
                  error
                );


                console.error(
                  "Verification backend response:",
                  error.response?.data
                );


                setPaymentSuccess(
                  false
                );


                setPaymentMessage(
                  error.response
                    ?.data
                    ?.message ||

                  "Payment verification failed."
                );


              } finally {

                setPayingPlan(
                  null
                );

              }

            },


          /* =================================
             PREFILL
          ================================= */

          prefill: {

            name:
              user?.name ||
              "",


            email:
              user?.email ||
              "",

          },


          /* =================================
             NOTES
          ================================= */

          notes: {

            user_id:
              String(
                user?.id ||
                ""
              ),


            plan_id:
              String(
                plan.id
              ),


            plan_name:
              plan.name,

          },


          /* =================================
             THEME
          ================================= */

          theme: {

            color:
              "#1ed760",

          },


          /* =================================
             CHECKOUT CLOSED
          ================================= */

          modal: {

            ondismiss:
              () => {

                setPayingPlan(
                  null
                );


                setPaymentMessage(
                  ""
                );

              },

          },

        };


        /* =====================================
           CREATE CHECKOUT
        ===================================== */

        const razorpayCheckout =
          new window.Razorpay(
            options
          );


        /* =====================================
           PAYMENT FAILED
        ===================================== */

        razorpayCheckout.on(
          "payment.failed",

          (response) => {

            console.error(
              "Razorpay payment failed:",
              response.error
            );


            setPaymentSuccess(
              false
            );


            setPaymentMessage(
              response.error
                ?.description ||

              "Payment failed. Please try again."
            );


            setPayingPlan(
              null
            );

          }
        );


        /* =====================================
           OPEN CHECKOUT
        ===================================== */

        razorpayCheckout.open();


      } catch (error) {

        console.error(
          "Start payment error:",
          error
        );


        console.error(
          "Backend response:",
          error.response?.data
        );


        setPaymentSuccess(
          false
        );


        setPaymentMessage(
          error.response
            ?.data
            ?.message ||

          error.message ||

          "Unable to start payment."
        );


        setPayingPlan(
          null
        );

      }

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="premium-page">


      {/* =================================================
          HERO
      ================================================= */}

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


            {isPremium &&
              expiryDate && (

                <small>

                  Active until{" "}
                  {expiryDate}

                </small>

              )}

          </div>

        )}

      </section>


      {/* =================================================
          PAYMENT MESSAGE
      ================================================= */}

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


      {/* =================================================
          BENEFITS
      ================================================= */}

      <section className="premium-benefits">

        <BenefitCard
          icon={
            <FaShieldAlt />
          }
          title="Ad-Free"
          text="Enjoy KEERTHANA without advertising interruptions."
        />


        <BenefitCard
          icon={
            <FaMusic />
          }
          title="Christian Music"
          text="Listen to your favourite Telugu and English Christian songs."
        />


        <BenefitCard
          icon={
            <FaPlay />
          }
          title="Keep Listening"
          text="Use playlists, lyrics and your personal music library."
        />

      </section>


      {/* =================================================
          PLANS
      ================================================= */}

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

        {!loadingPlans &&
          plansError && (

            <div className="premium-plans-error">

              {plansError}

            </div>

          )}


        {/* PLAN CARDS */}

        {!loadingPlans &&
          !plansError &&
          plans.length > 0 && (

            <div className="premium-plans">

              {plans.map(
                (plan) => {

                  const current =
                    subscription
                      ?.plan ===
                    plan.name;


                  const premium =
                    plan.name ===
                    "premium_monthly";


                  return (

                    <PlanCard

                      key={
                        plan.id
                      }

                      plan={
                        plan
                      }

                      premium={
                        premium
                      }

                      current={
                        current
                      }

                      paying={
                        payingPlan ===
                        plan.id
                      }

                      price={
                        formatPrice(
                          plan.price
                        )
                      }

                      onClick={() =>
                        handleChoosePlan(
                          plan
                        )
                      }

                    />

                  );

                }
              )}

            </div>

          )}

      </section>


      {/* =================================================
          SUBSCRIPTION STATUS
      ================================================= */}

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
              value={
                user.email
              }
            />


            <StatusItem
              label="Plan"
              value={
                currentPlan
              }
            />


            <StatusItem
              label="Status"
              value={
                subscription
                  ?.status ||
                "active"
              }
            />


            <StatusItem
              label="Ads"
              value={
                adFree
                  ? "Ad-Free"
                  : "Enabled"
              }
            />


            {expiryDate && (

              <StatusItem
                label="Expires"
                value={
                  expiryDate
                }
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

  const isFree =
    plan.name ===
    "free";


  const period =
    plan.name ===
    "premium_monthly"

      ? "/ month"

      : plan.name ===
        "premium_yearly"

      ? "/ year"

      : "forever";


  const features =
    isFree

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


  let buttonText =
    "Choose Plan";


  if (paying) {

    buttonText =
      "Opening Checkout...";

  } else if (current) {

    buttonText =
      "Current Plan";

  } else if (isFree) {

    buttonText =
      "Free Plan";

  } else if (
    plan.name ===
    "premium_monthly"
  ) {

    buttonText =
      "Choose Monthly";

  } else if (
    plan.name ===
    "premium_yearly"
  ) {

    buttonText =
      "Choose Yearly";

  }


  return (

    <div
      className={
        `premium-plan-card ${
          premium
            ? "premium-plan-featured"
            : ""
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

        {
          plan.name ===
          "free"

            ? "Free"

            : plan.name ===
              "premium_monthly"

            ? "Premium Monthly"

            : plan.name ===
              "premium_yearly"

            ? "Premium Yearly"

            : plan.display_name
        }

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

          {plan.duration_days}
          {" "}
          days access

        </div>

      )}


      <div className="premium-feature-list">

        {features.map(
          (feature) => (

            <div
              className="premium-feature"
              key={
                feature
              }
            >

              <FaCheck />

              <span>

                {feature}

              </span>

            </div>

          )
        )}

      </div>


      <button
        type="button"

        className="premium-plan-button"

        disabled={
          current ||
          isFree ||
          paying
        }

        onClick={
          onClick
        }
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