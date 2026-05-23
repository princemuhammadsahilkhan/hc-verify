import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BadgeCheck, ShieldCheck, Hash, Search } from "lucide-react";
import toast from "react-hot-toast";

import API from "../api";
import { useLang } from "../context/LangContext";


function VerifyPage() {
  const { t } = useLang();
  // Speak page intro on load
  useEffect(() => {
    setTimeout(() => speak(t.verifyTitle + ". " + t.verifySubtitle), 500);
  }, [t]);

  const location = useLocation();

  const [receipt, setReceipt] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const incomingReceipt = location.state?.receiptCode;
    if (incomingReceipt && !receipt) {
      setReceipt(incomingReceipt);
    }
  }, [location.state, receipt]);


  const verifyVote = async () => {

    try {

      setLoading(true);

      const response = await API.get(

        `/verify/${receipt}`

      );

      setResult(response.data);

    } catch (error) {

      console.log(error);

      toast.error("Verification failed. Please try again.");

    } finally {

      setLoading(false);
    }
  };


  return (

    <div className="page">

      <div className="page-header">
        <div className="eyebrow">
          <BadgeCheck size={16} />
          {t.verifyEyebrow}
        </div>
        <h1 className="section-title">
          {t.verifyTitle}
        </h1>
        <p className="section-subtitle">
          {t.verifySubtitle}
        </p>
      </div>


      <div className="card form-card">

        <div className="form-group">

          <label className="form-label">
            {t.receiptCode}
          </label>

          <div className="input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="input"
              placeholder="RCPT-XXXXXXXX"
              value={receipt}
              onChange={(e) =>
                setReceipt(e.target.value)
              }
            />
          </div>

          <p className="helper-text">
            {t.receiptCodeHelper}
          </p>

        </div>


        <button
          className={`button${loading ? " is-loading" : ""}`}
          onClick={verifyVote}
        >
          {
            loading
              ? (
                <>
                  <span className="spinner" />
                  Verifying...
                </>
              )
              : t.verifyBtn
          }
        </button>


        {

          result && (

            <div className="card result-card">

              {

                result.success ? (

                  <>

                    <div className="result-header">
                      <ShieldCheck size={18} />
                      <h2>{t.receiptVerified}</h2>
                    </div>

                    <p>
                      {t.receiptConfirmed}
                    </p>

                    <div className="receipt-box">
                      {result.receipt_code}
                    </div>

                    <div className="result-meta">
                      <span>
                        <Hash size={14} />
                        {t.blockchainHash}
                      </span>
                      <div className="hash-value">
                        {result.blockchain_hash}
                      </div>
                    </div>

                  </>

                ) : (

                  <>

                    <div className="result-header error">
                      <ShieldCheck size={18} />
                      <h2>{t.receiptNotFound}</h2>
                    </div>

                    <p>
                      {result.message}
                    </p>

                  </>

                )

              }

            </div>

          )

        }

      </div>

    </div>

  );
}

export default VerifyPage;