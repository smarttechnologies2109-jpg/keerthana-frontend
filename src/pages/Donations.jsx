
import React, { useMemo, useState } from "react";
import {
  FaHeart,
  FaHandsHelping,
  FaCopy,
  FaCheckCircle,
  FaQrcode,
  FaExternalLinkAlt,
} from "react-icons/fa";
import "../assets/css/Donations.css";

const UPI_ID = "msomapangu@ybl";
const PAYEE_NAME = "SOMAPANGU MAHESH";

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000];

function Donations() {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const amount = customAmount.trim()
    ? Number(customAmount)
    : selectedAmount;

  const validAmount =
    Number.isFinite(amount) && amount >= 1 && amount <= 100000;

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE_NAME,
      cu: "INR",
      tn: "Support Fire of Revival Ministry",
    });

    if (validAmount) {
      params.set("am", amount.toFixed(2));
    }

    return `upi://pay?${params.toString()}`;
  }, [amount, validAmount]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(`Please copy this UPI ID: ${UPI_ID}`);
    }
  };

  const handleDonate = () => {
    if (!validAmount) {
      alert("Please enter a valid amount between ₹1 and ₹1,00,000.");
      return;
    }

    window.location.href = upiLink;
  };

  const handlePresetAmount = (value) => {
    setSelectedAmount(value);
    setCustomAmount("");
  };

  return (
    <main className="donations-page">
      <section className="donation-hero">
        <div className="donation-hero-content">
          <div className="donation-label">
            <FaHeart />
            <span>FIRE OF REVIVAL MINISTRY</span>
          </div>

          <h1>
            Support the Ministry.
            <span> Share the Hope.</span>
          </h1>

          <p>
            Your voluntary contribution can help us continue sharing
            the message of Jesus Christ through online ministry,
            worship, prayer and Christian content.
          </p>

          <a href="#donate" className="donation-hero-button">
            Support Our Ministry
            <FaExternalLinkAlt />
          </a>
        </div>

        <div className="donation-hero-icon">
          <FaHandsHelping />
          <span>Give with a joyful heart</span>
        </div>
      </section>

      <section className="donation-mission">
        <div className="donation-section-heading">
          <span>OUR MISSION</span>
          <h2>Be a part of the work</h2>
          <p>
            We are committed to sharing Christian messages,
            worship and encouragement through digital platforms.
            Your support is voluntary and appreciated.
          </p>
        </div>

        <div className="donation-mission-cards">
          <article>
            <FaHeart />
            <h3>Faith & Hope</h3>
            <p>Sharing messages of faith, love and hope.</p>
          </article>

          <article>
            <FaHandsHelping />
            <h3>Online Ministry</h3>
            <p>Supporting the creation of Christian content.</p>
          </article>

          <article>
            <FaQrcode />
            <h3>Voluntary Support</h3>
            <p>Every contribution is voluntary and appreciated.</p>
          </article>
        </div>
      </section>

      <section className="donation-payment-section" id="donate">
        <div className="donation-section-heading">
          <span>SUPPORT FIRE OF REVIVAL</span>
          <h2>Make a Contribution</h2>
          <p>
            Choose an amount and pay using your preferred UPI app,
            or scan the PhonePe QR code.
          </p>
        </div>

        <div className="donation-payment-card">
          <div className="donation-amount-panel">
            <h3>Select Contribution Amount</h3>

            <div className="donation-amount-grid">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    !customAmount && selectedAmount === value
                      ? "donation-amount active"
                      : "donation-amount"
                  }
                  onClick={() => handlePresetAmount(value)}
                >
                  ₹{value.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <label htmlFor="custom-donation">
              Enter another amount (₹)
            </label>

            <input
              id="custom-donation"
              type="number"
              min="1"
              max="100000"
              step="1"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
            />

            <div className="donation-total">
              <span>Your contribution</span>
              <strong>
                {validAmount
                  ? `₹${amount.toLocaleString("en-IN")}`
                  : "Enter a valid amount"}
              </strong>
            </div>

            <button
              type="button"
              className="donation-pay-button"
              onClick={handleDonate}
              disabled={!validAmount}
            >
              Continue with UPI
              <FaExternalLinkAlt />
            </button>

            <p className="donation-secure-note">
              <FaCheckCircle />
              Payment will open in a supported UPI app.
            </p>
          </div>

          <div className="donation-qr-panel">
            <div className="donation-qr-heading">
              <FaQrcode />
              <h3>Scan & Pay with PhonePe</h3>
            </div>

            <div className="donation-qr-image">
              <img
                src="/donation-qr.jpeg"
                alt="PhonePe QR code for Fire of Revival Ministry contributions"
              />
            </div>

            <p className="donation-qr-instruction">
              Open PhonePe or another compatible UPI app,
              scan this QR code and enter your contribution amount.
            </p>

            <div className="donation-upi-details">
              <span>UPI ID</span>

              <div className="donation-upi-copy">
                <strong>{UPI_ID}</strong>

                <button
                  type="button"
                  onClick={copyUpiId}
                  aria-label="Copy UPI ID"
                >
                  {copied ? <FaCheckCircle /> : <FaCopy />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <small>Account name: {PAYEE_NAME}</small>
            </div>
          </div>
        </div>

        <div className="donation-thank-you">
          <FaHeart />
          <h3>Thank You for Your Support</h3>
          <p>
            We sincerely appreciate your voluntary contribution
            and your encouragement for Fire of Revival Ministry.
          </p>
        </div>

        <p className="donation-disclaimer">
          Contributions are voluntary personal contributions to
          this independently operated online ministry. They are
          not represented as tax-deductible charitable donations.
          Please verify the recipient name and UPI ID before paying.
        </p>
      </section>
    </main>
  );
}

export default Donations;
