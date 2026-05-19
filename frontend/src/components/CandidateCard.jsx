function CandidateCard({

  candidate,

  onVote

}) {

  return (

    <div className="candidate-card">

      <div className="candidate-header">
        <div className="candidate-symbol">
          {candidate.symbol}
        </div>
        <div>
          <h2>
            {candidate.name}
          </h2>
          <p>
            {candidate.party}
          </p>
        </div>
      </div>

      <span className="candidate-tag">
        {candidate.constituency}
      </span>

      <button
        className="button"
        onClick={() => onVote(candidate)}
      >
        Submit vote
      </button>

    </div>

  );
}

export default CandidateCard;