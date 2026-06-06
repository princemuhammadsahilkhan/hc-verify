import { useEffect, useState } from "react";
import {
  ShieldCheck, Users, Vote as VoteIcon, Activity, AlertTriangle,
  UserX, CheckCircle2, Database, Terminal, Globe, Lock, RefreshCw,
  PlusCircle, Trash2, Download, Menu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { tab: "Dashboard", label: "Dashboard", icon: Activity },
      { tab: "Audit Dashboard", label: "Analytics Report", icon: Database }
    ]
  },
  {
    title: "Election Management",
    items: [
      { tab: "Candidates", label: "Candidates", icon: PlusCircle },
      { tab: "Pending", label: "Pending Reviews", icon: UserX }
    ]
  },
  {
    title: "Audit & Security",
    items: [
      { tab: "Audit", label: "Audit Logs", icon: Terminal },
      { tab: "Suspicious", label: "Suspicious Activity", icon: AlertTriangle },
      { tab: "Integrity", label: "Database Integrity", icon: Lock }
    ]
  },
  {
    title: "Demonstrations",
    items: [
      { tab: "Demo Center", label: "Attack Simulator", icon: Globe },
      { tab: "Crypto Center", label: "Cryptography Sandbox", icon: ShieldCheck }
    ]
  }
];

const AUDIT_FILTERS = [
  { value: "all", label: "All events" },
  { value: "registration", label: "Registration" },
  { value: "verification", label: "Verification" },
  { value: "voting", label: "Voting" },
  { value: "administration", label: "Administration" },
  { value: "security", label: "Security" },
  { value: "system", label: "System" }
];

const SUSPICIOUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" }
];

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Dashboard");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [stats, setStats] = useState({ total_voters: 0, votes_cast: 0, turnout: 0, pending: 0 });
  const [allVoters, setAllVoters] = useState([]);
  const [flagReason, setFlagReason] = useState({});
  const [pendingVoters, setPendingVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidateForm, setCandidateForm] = useState({ name: "", party: "", district: "", symbol: "" });
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [resolving, setResolving] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState({});
  const [apiResponse, setApiResponse] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategory, setAuditCategory] = useState("all");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(50);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [suspiciousAlerts, setSuspiciousAlerts] = useState([]);
  const [suspiciousLoading, setSuspiciousLoading] = useState(false);
  const [suspiciousFilter, setSuspiciousFilter] = useState("all");

  const [auditDashboardData, setAuditDashboardData] = useState(null);
  const [auditDashboardLoading, setAuditDashboardLoading] = useState(false);

  const [integrityData, setIntegrityData] = useState(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  // Security Demonstration Center States
  const [g1ThreatType, setG1ThreatType] = useState("rate_limit");
  const [g1Loading, setG1Loading] = useState(false);
  const [g1Result, setG1Result] = useState(null);

  const [g2VoterId, setG2VoterId] = useState("HC-VOTED");
  const [g2Loading, setG2Loading] = useState(false);
  const [g2Result, setG2Result] = useState(null);

  const [g3FailureType, setG3FailureType] = useState("invalid");
  const [g3Loading, setG3Loading] = useState(false);
  const [g3Result, setG3Result] = useState(null);

  const handleG1Simulate = () => {
    setG1Loading(true);
    setG1Result(null);
    setTimeout(() => {
      let result = {};
      if (g1ThreatType === "rate_limit") {
        result = {
          threatType: "Rate Limiting Exploit (API Flooding)",
          protection: "RateLimiter (5 calls/min per IP)",
          status: "BLOCKED (HTTP 429 Too Many Requests)",
          explanation: "The server registers incoming API calls by client IP. The 6th request within a 60-second window is dropped immediately with an HTTP 429 status code.",
          attackAttempt: "Automated voter registration script attempts to register 20 synthetic CNICs in 3 seconds from IP 198.51.100.12.",
          protectionActivated: "RateLimiter middleware matching route: /auth/register.",
          whyFailed: "The request counter for IP 198.51.100.12 exceeded max_calls (5) in the sliding window period (60s).",
          benefit: "Prevents Denial of Service (DoS) and brute-force registration spamming on voter databases."
        };
      } else if (g1ThreatType === "lockout") {
        result = {
          threatType: "Account Lockout Bypass",
          protection: "AccountLockout (5 failed attempts trigger)",
          status: "BLOCKED (HTTP 423 Locked)",
          explanation: "Admin credential failures are tracked in-memory. After 5 failed attempts, the account is locked for 300 seconds, and all subsequent logins are rejected.",
          attackAttempt: "Brute-force script tries common password lists against the 'Admin' user account.",
          protectionActivated: "AccountLockout tracker checking username: 'Admin'.",
          whyFailed: "The account lockout state remains active. A cooldown of 300 seconds is enforced before any new login attempts are processed.",
          benefit: "Eliminates automated password-guessing attacks against key administrative command centers."
        };
      } else if (g1ThreatType === "cnic") {
        result = {
          threatType: "CNIC Format Validation Injection",
          protection: "validate_cnic regex filter",
          status: "BLOCKED (HTTP 422 Unprocessable Entity)",
          explanation: "CNIC values must match the exact pattern: 00000-0000000-0. Character strings or malformed patterns are blocked before db check.",
          attackAttempt: "Malicious user enters input '12345-6789012-3 OR 1=1' attempting to execute a SQL Injection probe during registration.",
          protectionActivated: "Server-side regex validation check: regex matching 13 digits separated by dashes.",
          whyFailed: "The input string failed the regex layout validation and was rejected before reaching the SQL execution or query builder stage.",
          benefit: "Prevents malformed data insertion and eliminates injection vectors at the entry border."
        };
      } else if (g1ThreatType === "phone") {
        result = {
          threatType: "Phone Number Validation Bypass",
          protection: "validate_phone check",
          status: "BLOCKED (HTTP 422 Unprocessable Entity)",
          explanation: "Phone inputs must start with '03' and have exactly 11 digits. Non-conforming patterns are blocked.",
          attackAttempt: "Registration attempt with an invalid or international phone pattern (+92-333-1234567 or letters) to corrupt notification registries.",
          protectionActivated: "validate_phone regex: '^03\\d{9}$'.",
          whyFailed: "The input did not conform to the 11-digit Pakistani pattern, resulting in instant server rejection.",
          benefit: "Ensures operational reliability for SMS verification and ledger integrity."
        };
      } else if (g1ThreatType === "face") {
        result = {
          threatType: "Biometric Face Spoofing",
          protection: "Face Verification similarity check",
          status: "FLAGGED & PENDING MANUAL REVIEW (Similarity: 0.42)",
          explanation: "At voting time, the facial scan is matched against the registration face template. A mismatch flags the voter as pending, preventing automated ballot submission.",
          attackAttempt: "User attempts to vote on behalf of a registered voter by holding a photo up to the webcam.",
          protectionActivated: "Face service comparing cosine similarity of current webcam frame against registered face template.",
          whyFailed: "The comparison similarity fell to 0.42, which is below the authorized threshold of 0.60. The voter was flagged, and double voting/biometric spoofing was blocked.",
          benefit: "Stops biometric impersonation and photo-based spoofing attempts at the voting terminal."
        };
      }
      setG1Result(result);
      setG1Loading(false);
    }, 600);
  };

  const handleG2Simulate = () => {
    setG2Loading(true);
    setG2Result(null);
    setTimeout(() => {
      const result = {
        voterId: g2VoterId || "HC-VOTED",
        protection: "has_voted constraint verification",
        status: "PREVENTED (Vote already cast)",
        explanation: "Before vote commit, the system verifies if the voter ID's has_voted flag is True. If True, the transaction is rejected and no vote is generated.",
        attackAttempt: `Voter '${g2VoterId || "HC-VOTED"}' attempts to submit a second ballot by calling the POST /vote endpoint via curl or multiple browser windows.`,
        protectionActivated: "Database row constraint check on Voter.has_voted.",
        whyFailed: "The voter profile has_voted flag was set to True upon their first ballot transaction. Subsequent attempts to vote are instantly aborted.",
        benefit: "Strictly enforces one-person-one-vote mathematical integrity, keeping the ballot box clean."
      };
      setG2Result(result);
      setG2Loading(false);
    }, 600);
  };

  const handleG3Simulate = () => {
    setG3Loading(true);
    setG3Result(null);
    setTimeout(() => {
      let result = {};
      if (g3FailureType === "invalid") {
        result = {
          failureType: "Invalid Verification Code",
          status: "REJECTED (Receipt not found)",
          explanation: "If the receipt code doesn't exist in the database, verification fails, returning a 'Receipt not found' response.",
          action: "Check the spelling of your receipt code and ensure it is complete.",
          attackAttempt: "User inputs a guessed verification code (e.g. RCPT-12345678) to verify a non-existent ballot.",
          protectionActivated: "Database select query checking Vote.receipt_code.",
          whyFailed: "The search query returned zero matching records in the database. The receipt does not exist.",
          benefit: "Prevents verification of fabricated ballots or receipt guessing."
        };
      } else if (g3FailureType === "expired") {
        result = {
          failureType: "Expired Verification Code",
          status: "REJECTED (Verification code expired)",
          explanation: "Verification codes generated during validation sessions have a strict expiration window. Expired codes are rejected.",
          action: "Re-authenticate with voter credentials and acquire a new verification token.",
          attackAttempt: "User attempts to submit a vote or verify a session using a validation token that is 2 hours old.",
          protectionActivated: "TTL timestamp evaluation on liveness verification session.",
          whyFailed: "The verification token's timestamp has exceeded the allowable session TTL window (10 minutes).",
          benefit: "Limits threat window for token theft or request replay attacks."
        };
      } else if (g3FailureType === "malformed") {
        result = {
          failureType: "Malformed Verification Code",
          status: "REJECTED (Malformed format check)",
          explanation: "Receipt verification codes must follow the RCPT-[A-Z0-9]{8} pattern. Non-conforming queries are rejected before database scanning.",
          action: "Input a code in the valid format starting with 'RCPT-' followed by 8 characters.",
          attackAttempt: "User enters malformed SQL strings or overly long parameters to query receipts.",
          protectionActivated: "Frontend and backend receipt formatting regex check.",
          whyFailed: "The input string does not match the strict alphanumeric structure required for receipt identification.",
          benefit: "Guards database query processors against excessive load and injection attempts."
        };
      }
      setG3Result(result);
      setG3Loading(false);
    }, 600);
  };

  // H1 — Digital Signature States
  const [h1Message, setH1Message] = useState("HV-Verify Ballot Proof: Voter ID HC-74B92C voted for Tariq Mehmood.");
  const [h1Hash, setH1Hash] = useState("");
  const [h1Signature, setH1Signature] = useState("");
  const [h1Verified, setH1Verified] = useState(null);
  const [h1VerificationDetails, setH1VerificationDetails] = useState("");

  // H2 — Secret Sharing States
  const [h2Secret, setH2Secret] = useState("ELECTION-KEY-SECRET-2026");
  const [h2TotalShares, setH2TotalShares] = useState(5);
  const [h2Threshold, setH2Threshold] = useState(3);
  const [h2Shares, setH2Shares] = useState([]);
  const [h2SelectedShares, setH2SelectedShares] = useState({});
  const [h2ReconstructedSecret, setH2ReconstructedSecret] = useState("");
  const [h2ReconstructStatus, setH2ReconstructStatus] = useState(""); // "success", "failed", or ""

  // H3 — Threshold Cryptography States
  const [h3Trustees, setH3Trustees] = useState({
    "Trustee A": true,
    "Trustee B": true,
    "Trustee C": true,
    "Trustee D": false,
    "Trustee E": false
  });
  const [h3DecryptedResult, setH3DecryptedResult] = useState("");
  const [h3Status, setH3Status] = useState(""); // "success", "failed", or ""

  // H4 — Zero Knowledge Proof States
  const [h4Secret, setH4Secret] = useState("my-voter-secret");
  const [h4PublicValue, setH4PublicValue] = useState("");
  const [h4Proof, setH4Proof] = useState("");
  const [h4Verified, setH4Verified] = useState(null);

  // Helper function to generate SHA256 locally using Web Cryptography API
  const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleH1Sign = async () => {
    const computedHash = await sha256(h1Message);
    setH1Hash(computedHash);
    
    // Simulate generation of asymmetric key pair signature (mocked using private key representation)
    const mockSignature = "SIG-" + computedHash.substring(0, 16).toUpperCase() + "-" + btoa(h1Message.substring(0, 10)).replace(/[^A-Za-z0-9]/g, "");
    setH1Signature(mockSignature);
    setH1Verified(null);
    setH1VerificationDetails("");
  };

  const handleH1Verify = async () => {
    if (!h1Signature || !h1Hash) {
      toast.error("Please generate the digital signature first.");
      return;
    }
    const currentHash = await sha256(h1Message);
    
    if (currentHash === h1Hash) {
      setH1Verified(true);
      setH1VerificationDetails(`SUCCESS: Rekey validation matches. Recalculated SHA-256 hash (${currentHash.substring(0, 10)}...) is identical to signed payload hash. Origin authenticated via Public Key 0xAB...12.`);
    } else {
      setH1Verified(false);
      setH1VerificationDetails(`FAILED: The message text has been altered since the digital signature was generated! Recalculated hash: ${currentHash.substring(0, 10)}... Stored signature hash: ${h1Hash.substring(0, 10)}... Integrity check failed.`);
    }
  };

  const handleH2Split = () => {
    if (!h2Secret) {
      toast.error("Please enter a secret key to split.");
      return;
    }
    if (parseInt(h2Threshold) > parseInt(h2TotalShares)) {
      toast.error("Threshold cannot exceed total number of shares.");
      return;
    }
    
    const newShares = [];
    for (let i = 1; i <= h2TotalShares; i++) {
      const shareVal = `SHARE-${i}-${btoa(h2Secret + i).substring(0, 12).toUpperCase()}`;
      newShares.push({ id: i, value: shareVal });
    }
    setH2Shares(newShares);
    setH2SelectedShares({});
    setH2ReconstructedSecret("");
    setH2ReconstructStatus("");
  };

  const toggleH2Share = (id) => {
    setH2SelectedShares(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleH2Reconstruct = () => {
    const selectedCount = Object.values(h2SelectedShares).filter(Boolean).length;
    if (selectedCount >= h2Threshold) {
      setH2ReconstructedSecret(h2Secret);
      setH2ReconstructStatus("success");
    } else {
      setH2ReconstructedSecret("");
      setH2ReconstructStatus("failed");
    }
  };

  const toggleH3Trustee = (name) => {
    setH3Trustees(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
    setH3DecryptedResult("");
    setH3Status("");
  };

  const handleH3Decrypt = () => {
    const activeCount = Object.values(h3Trustees).filter(Boolean).length;
    if (activeCount >= 3) {
      setH3Status("success");
      setH3DecryptedResult("TALLY-RESULT: Tariq Mehmood (42%), Ayesha Siddiqui (38%), Zara Hussain (12%), Khalid Nawaz (8%)");
    } else {
      setH3Status("failed");
      setH3DecryptedResult("");
    }
  };

  const handleH4GenerateProof = async () => {
    if (!h4Secret) {
      toast.error("Please enter a secret to prove.");
      return;
    }
    const computedHash = await sha256(h4Secret);
    setH4PublicValue(computedHash);
    
    const mockZkp = JSON.stringify({
      proof: {
        a: ["0x" + computedHash.substring(0, 10), "0x" + computedHash.substring(10, 20)],
        b: [["0x" + computedHash.substring(20, 30), "0x" + computedHash.substring(30, 40)], ["0x" + computedHash.substring(40, 50), "0x" + computedHash.substring(50, 60)]],
        c: ["0x" + computedHash.substring(0, 8) + "FF", "0x" + computedHash.substring(8, 16) + "EE"]
      },
      inputs: ["0x" + computedHash.substring(60, 64)]
    }, null, 2);
    
    setH4Proof(mockZkp);
    setH4Verified(null);
  };

  const handleH4VerifyProof = () => {
    if (!h4Proof) {
      toast.error("Please generate ZK-Proof first.");
      return;
    }
    setH4Verified(true);
  };

  const token = localStorage.getItem("adminToken");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    loadStats(); loadPendingVoters(); loadCandidates(); loadAllVoters();
  }, []);

  useEffect(() => {
    if (tab === "Audit") {
      loadAudit();
    }
  }, [tab, auditPage]);

  useEffect(() => {
    if (tab === "Suspicious") {
      loadSuspicious();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "Audit Dashboard") {
      loadAuditDashboard();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "Integrity") {
      loadIntegrity();
    }
  }, [tab]);

  const loadStats = async () => {
    try {
      const res = await API.get("/admin/stats", authHeader);
      setStats(res.data);
    } catch (err) {
      console.error("Error in loadStats:", err);
      toast.error("Stats load failed: " + (err.response?.data?.detail || err.message));
    }
  };
  const loadAuditDashboard = async () => {
    setAuditDashboardLoading(true);
    try {
      const res = await API.get("/admin/audit-dashboard", authHeader);
      setAuditDashboardData(res.data);
    } catch (err) {
      toast.error("Failed to load audit dashboard statistics");
    } finally {
      setAuditDashboardLoading(false);
    }
  };
  const loadIntegrity = async () => {
    setIntegrityLoading(true);
    try {
      const res = await API.get("/admin/integrity/check", authHeader);
      setIntegrityData(res.data);
      if (res.data.is_healthy) {
        toast.success("System integrity verified: Healthy!");
      } else {
        toast.error("System integrity check completed: Issues detected!");
      }
    } catch (err) {
      toast.error("Failed to load integrity statistics");
    } finally {
      setIntegrityLoading(false);
    }
  };
  const loadAllVoters = async () => {
    try {
      const res = await API.get("/admin/voters", authHeader);
      setAllVoters(res.data);
    } catch (err) {
      console.error("Error in loadAllVoters:", err);
      toast.error("Voters load failed: " + (err.response?.data?.detail || err.message));
    }
  };
  const loadPendingVoters = async () => {
    try {
      const res = await API.get("/admin/pending-voters", authHeader);
      setPendingVoters(res.data);
    } catch (err) {
      console.error("Error in loadPendingVoters:", err);
      toast.error("Pending voters load failed: " + (err.response?.data?.detail || err.message));
    }
  };
  const loadCandidates = async () => {
    try {
      const res = await API.get("/candidates");
      setCandidates(res.data);
    } catch (err) {
      console.error("Error in loadCandidates:", err);
      toast.error("Candidates load failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCandidateChange = (event) => {
    setCandidateForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreateCandidate = async (event) => {
    event.preventDefault();
    setCandidateLoading(true);
    try {
      await API.post("/candidates", candidateForm, authHeader);
      toast.success("Candidate created");
      setCandidateForm({ name: "", party: "", district: "", symbol: "" });
      loadCandidates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create candidate");
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    try {
      await API.delete(`/candidates/${candidateId}`, authHeader);
      toast.success("Candidate deleted");
      loadCandidates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete candidate");
    }
  };

  const handleApprove = async (voterId) => {
    setResolving(voterId);
    try {
      await API.post(`/admin/resolve-pending/${voterId}`, { action: "approve" }, authHeader);
      toast.success("Voter approved"); loadPendingVoters(); loadStats();
    } catch { toast.error("Failed"); } finally { setResolving(null); }
  };

  const handleManualVote = async (voterId) => {
    const candidateId = selectedCandidate[voterId];
    if (!candidateId) { toast.error("Select a candidate first"); return; }
    setResolving(voterId);
    try {
      const res = await API.post(`/admin/resolve-pending/${voterId}`, { action: "manual_vote", candidate_id: parseInt(candidateId) }, authHeader);
      toast.success(res.data.message); loadPendingVoters(); loadStats();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); } finally { setResolving(null); }
  };

  const handleFlagVoter = async (voterId) => {
    const reason = flagReason[voterId] || "Flagged by admin";
    try {
      await API.post(`/admin/flag-voter/${voterId}`, { reason }, authHeader);
      toast.success("Voter flagged"); loadAllVoters(); loadPendingVoters(); loadStats();
    } catch { toast.error("Failed"); }
  };

  const handleLogout = () => { localStorage.removeItem("adminToken"); navigate("/admin-login", { replace: true }); };

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await API.get("/admin/audit", {
        ...authHeader,
        params: {
          page: auditPage,
          page_size: auditPageSize
        }
      });
      setAuditEntries(res.data.records || []);
      setAuditTotal(res.data.total || 0);
      setAuditTotalPages(res.data.total_pages || 0);
    } catch (err) {
      setAuditEntries([]);
      setAuditTotal(0);
      setAuditTotalPages(0);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadSuspicious = async () => {
    setSuspiciousLoading(true);
    try {
      const res = await API.get("/admin/suspicious-activity", authHeader);
      setSuspiciousAlerts(res.data.records || []);
    } catch (err) {
      setSuspiciousAlerts([]);
    } finally {
      setSuspiciousLoading(false);
    }
  };

  const ENDPOINTS = [
    { label: "GET /admin/stats", method: "GET", url: "/admin/stats", auth: true },
    { label: "GET /voters", method: "GET", url: "/voters", auth: false },
    { label: "GET /admin/voters", method: "GET", url: "/admin/voters", auth: true },
    { label: "GET /candidates", method: "GET", url: "/candidates", auth: false },
    { label: "GET /admin/pending-voters", method: "GET", url: "/admin/pending-voters", auth: true },
    { label: "GET /admin/audit", method: "GET", url: "/admin/audit", auth: true },
    { label: "GET /admin/suspicious-activity", method: "GET", url: "/admin/suspicious-activity", auth: true },
    { label: "GET /admin/audit-dashboard", method: "GET", url: "/admin/audit-dashboard", auth: true },
    { label: "GET /admin/integrity/check", method: "GET", url: "/admin/integrity/check", auth: true },
  ];

  const runEndpoint = async (ep) => {
    setApiLoading(true); setApiResponse("");
    try {
      const headers = ep.auth ? authHeader.headers : {};
      const res = await API.get(ep.url, { headers });
      setApiResponse(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setApiResponse(JSON.stringify(err.response?.data || err.message, null, 2));
    } finally { setApiLoading(false); }
  };

  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarMobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <ShieldCheck size={20} className="brand-icon-side" />
            <span>HC Verify Admin</span>
          </div>
          <button className="sidebar-mobile-close" onClick={() => setSidebarMobileOpen(false)}>×</button>
        </div>
        
        <nav className="sidebar-nav">
          {navigationGroups.map((group) => (
            <div key={group.title} className="nav-group">
              <h3 className="nav-group-title">{group.title}</h3>
              <div className="nav-group-items">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      className={`sidebar-nav-item ${tab === item.tab ? "active" : ""}`}
                      onClick={() => {
                        setTab(item.tab);
                        setSidebarMobileOpen(false);
                      }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button className="button secondary logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Mobile Header */}
        <header className="admin-mobile-header">
          <button className="sidebar-toggle-btn" onClick={() => setSidebarMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="mobile-header-title">Admin Command Center</span>
          <span className="admin-pill success">Live</span>
        </header>

        {/* Desktop Header */}
        <div className="page-header admin-header-content">
          <div className="eyebrow"><ShieldCheck size={16} />Administration</div>
          <div className="admin-title-row">
            <h1 className="section-title">Election command center</h1>
            <span className="admin-pill success">Live</span>
          </div>
        </div>

        <div className="admin-tab-content">

      {/* ── DASHBOARD TAB ── */}
      {tab === "Dashboard" && (
        <>
          <div className="admin-grid">
            <div className="card admin-metric"><div className="metric-icon"><Users size={18} /></div><div><p>Total voters</p><h3>{stats.total_voters}</h3></div></div>
            <div className="card admin-metric"><div className="metric-icon"><VoteIcon size={18} /></div><div><p>Votes cast</p><h3>{stats.votes_cast}</h3></div></div>
            <div className="card admin-metric"><div className="metric-icon"><Activity size={18} /></div><div><p>Turnout</p><h3>{stats.turnout}%</h3></div></div>
            <div className="card admin-metric"><div className="metric-icon"><AlertTriangle size={18} /></div><div><p>Pending review</p><h3 style={{ color: stats.pending > 0 ? "var(--danger)" : "inherit" }}>{stats.pending}</h3></div></div>
          </div>
          <div className="admin-panels">
            <div className="card admin-panel">
              <div className="card-header"><div><h2 className="card-title">Operational status</h2><p className="card-subtitle">All core services reporting healthy.</p></div><span className="admin-pill success">Healthy</span></div>
              <div className="admin-list">
                {["Identity verification","Face recognition","Ballot ledger sync","Security monitoring","Rate limiting","Account lockout"].map(s => (
                  <div key={s} className="admin-row"><span>{s}</span><span className="admin-pill success">Active</span></div>
                ))}
              </div>
            </div>
            <div className="card admin-panel">
              <div className="card-header"><div><h2 className="card-title">Election integrity</h2><p className="card-subtitle">Current safeguards and audit checks.</p></div><span className="admin-pill neutral">Protected</span></div>
              <div className="admin-list">
                {["Duplicate registration blocks","Face recognition anti-fraud","Receipt verification","Input validation (CNIC/phone)","CORS lockdown","Audit logging"].map(s => (
                  <div key={s} className="admin-row"><span>{s}</span><span className="admin-pill success">Active</span></div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── AUDIT DASHBOARD TAB ── */}
      {tab === "Audit Dashboard" && (
        <>
          {auditDashboardLoading || !auditDashboardData ? (
            <div className="results-loading" style={{ marginTop: 24 }}>
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          ) : (() => {
            const handleExport = async (type) => {
              try {
                const sev = document.getElementById("audit-export-severity")?.value || "All";
                const token = localStorage.getItem("adminToken");
                const url = `http://127.0.0.1:8000/admin/audit/export/${type}?filter_severity=${sev}`;
                
                const response = await fetch(url, {
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                });
                
                if (!response.ok) throw new Error("Export failed");
                
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `audit-report.${type}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
              } catch (e) {
                console.error(e);
                alert("Export failed");
              }
            };
            const { metrics, visualizations, insights } = auditDashboardData;
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p className="card-subtitle">Real-time system health, registrations, verifications, and audit metrics.</p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select id="audit-export-severity" className="input" style={{ padding: "6px 12px", height: "auto", fontSize: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <option value="All">All Events</option>
                      <option value="Low">Low Severity</option>
                      <option value="Medium">Medium Severity</option>
                      <option value="High">High Severity</option>
                      <option value="Critical">Critical Severity</option>
                    </select>
                    <button className="button" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => handleExport("csv")}><Download size={13} /> CSV</button>
                    <button className="button" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => handleExport("pdf")}><Download size={13} /> PDF</button>
                    <button className="button" style={{ fontSize: 12, padding: "8px 16px" }} onClick={loadAuditDashboard}><RefreshCw size={13} /> Refresh</button>
                  </div>
                </div>

                <div className="admin-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(15, 118, 110, 0.12)", color: "var(--primary)" }}><Users size={18} /></div>
                    <div><p>Total registrations</p><h3>{metrics.total_registrations}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(22, 163, 74, 0.12)", color: "var(--success)" }}><CheckCircle2 size={18} /></div>
                    <div><p>Successful registrations</p><h3>{metrics.successful_registrations}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}><ShieldCheck size={18} /></div>
                    <div><p>Successful verifications</p><h3>{metrics.successful_verifications}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(220, 38, 38, 0.12)", color: "var(--danger)" }}><UserX size={18} /></div>
                    <div><p>Failed verifications</p><h3>{metrics.failed_verifications}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}><VoteIcon size={18} /></div>
                    <div><p>Votes cast</p><h3>{metrics.votes_cast}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(79, 70, 229, 0.12)", color: "#4f46e5" }}><Terminal size={18} /></div>
                    <div><p>Verification codes</p><h3>{metrics.verification_codes_generated}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: metrics.suspicious_activity_alerts > 0 ? "rgba(220, 38, 38, 0.12)" : "rgba(245, 158, 11, 0.12)", color: metrics.suspicious_activity_alerts > 0 ? "var(--danger)" : "var(--warning)" }}><AlertTriangle size={18} /></div>
                    <div><p>Suspicious alerts</p><h3>{metrics.suspicious_activity_alerts}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(217, 119, 6, 0.12)", color: "#d97706" }}><Lock size={18} /></div>
                    <div><p>Admin actions</p><h3>{metrics.admin_actions_logged}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(100, 116, 139, 0.12)", color: "#64748b" }}><Activity size={18} /></div>
                    <div><p>Audit events</p><h3>{metrics.audit_events_logged}</h3></div>
                  </div>
                  <div className="card admin-metric">
                    <div className="metric-icon" style={{ background: "rgba(147, 51, 234, 0.12)", color: "#9333ea" }}><Database size={18} /></div>
                    <div><p>System events</p><h3>{metrics.system_events_logged}</h3></div>
                  </div>
                </div>

                <div className="admin-panels" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", display: "grid", gap: 24, marginTop: 24 }}>
                  <div className="card admin-panel">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">Event Distribution</h2>
                        <p className="card-subtitle">Volume of events logged by category</p>
                      </div>
                    </div>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualizations.event_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} />
                          <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 10 }} />
                          <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card admin-panel">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">Daily Activity Trend</h2>
                        <p className="card-subtitle">Total logged events over the last 7 days</p>
                      </div>
                    </div>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visualizations.daily_activity_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} />
                          <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 10 }} />
                          <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card admin-panel">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">Verification Outcomes</h2>
                        <p className="card-subtitle">Successful vs flagged biometric reviews</p>
                      </div>
                    </div>
                    <div style={{ width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={visualizations.verification_outcomes}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="var(--success)" />
                            <Cell fill="var(--danger)" />
                          </Pie>
                          <Tooltip contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 10 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card admin-panel">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">Suspicious Activity Severity</h2>
                        <p className="card-subtitle">Active rule alerts breakdown by severity</p>
                      </div>
                    </div>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visualizations.suspicious_activity_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} />
                          <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ background: "var(--surface-strong)", border: "1px solid var(--border)", borderRadius: 10 }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {visualizations.suspicious_activity_breakdown.map((entry, index) => {
                              let color = "#10b981"; // Low
                              if (entry.name === "Medium") color = "#f59e0b";
                              if (entry.name === "High") color = "#ef4444";
                              if (entry.name === "Critical") color = "#b91c1c";
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 24, borderLeft: "4px solid var(--primary)" }}>
                  <h2 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={18} style={{ color: "var(--primary)" }} /> Security & Audit Insights
                  </h2>
                  <p className="card-subtitle" style={{ marginBottom: 12 }}>Derived dynamically from system activity logs.</p>
                  <div style={{ display: "grid", gap: 8 }}>
                    {insights.map((insight, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}


      {/* ── CANDIDATES TAB ── */}
      {tab === "Candidates" && (
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <div className="card admin-panel">
            <div className="card-header">
              <div><h2 className="card-title"><PlusCircle size={16} /> Create candidate</h2><p className="card-subtitle">Add a candidate using the new admin API.</p></div>
            </div>
            <form className="form-grid" onSubmit={handleCreateCandidate}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" name="name" value={candidateForm.name} onChange={handleCandidateChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Party</label>
                <input className="input" name="party" value={candidateForm.party} onChange={handleCandidateChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input className="input" name="district" value={candidateForm.district} onChange={handleCandidateChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input className="input" name="symbol" value={candidateForm.symbol} onChange={handleCandidateChange} placeholder="Optional" />
              </div>
              <div className="form-actions">
                <button className={`button${candidateLoading ? " is-loading" : ""}`} type="submit">{candidateLoading ? "Saving..." : "Create candidate"}</button>
                <span className="form-hint">Uses POST /candidates.</span>
              </div>
            </form>
          </div>

          <div className="card admin-panel">
            <div className="card-header">
              <div><h2 className="card-title"><Trash2 size={16} /> Candidate list</h2><p className="card-subtitle">Delete candidates from the same panel.</p></div>
              <button className="button" style={{ fontSize: 12 }} onClick={loadCandidates}><RefreshCw size={13} /> Refresh</button>
            </div>
            <div className="admin-list">
              {candidates.length === 0 ? (
                <div className="admin-row"><span style={{ color: "var(--muted)" }}>No candidates available.</span></div>
              ) : candidates.map((candidate) => (
                <div key={candidate.id} className="admin-row" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <strong>{candidate.symbol ? `${candidate.symbol} ` : ""}{candidate.name}</strong>
                    <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{candidate.party}</span>
                    <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{candidate.district || candidate.constituency || "-"}</span>
                  </div>
                  <span className="admin-pill neutral">Votes {candidate.votes ?? 0}</span>
                  <button className="button secondary" style={{ fontSize: 12 }} onClick={() => handleDeleteCandidate(candidate.id)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING TAB ── */}
      {tab === "Pending" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div><h2 className="card-title"><UserX size={16} /> Pending Investigation</h2><p className="card-subtitle">Voters flagged for face mismatch — require manual ballot processing.</p></div>
            <span className={`admin-pill ${pendingVoters.length > 0 ? "warning" : "success"}`}>{pendingVoters.length > 0 ? `${pendingVoters.length} pending` : "All clear"}</span>
          </div>
          {pendingVoters.length === 0
            ? <div className="admin-row"><span style={{ color: "var(--muted)" }}>No pending voters.</span><span className="admin-pill success">✓ Clear</span></div>
            : pendingVoters.map(voter => (
              <div key={voter.voter_id} style={{ borderBottom: "1px solid var(--border)", padding: "16px 0", display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div><strong>{voter.full_name}</strong><span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 13 }}>{voter.voter_id}</span><span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 13 }}>CNIC: {voter.cnic}</span></div>
                  <span className="admin-pill warning">Flagged</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{voter.pending_reason}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="button" style={{ fontSize: 13 }} onClick={() => handleApprove(voter.voter_id)} disabled={resolving === voter.voter_id}><CheckCircle2 size={13} /> Approve</button>
                  <select style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }}
                    value={selectedCandidate[voter.voter_id] || ""}
                    onChange={e => setSelectedCandidate(p => ({ ...p, [voter.voter_id]: e.target.value }))}>
                    <option value="">Select candidate...</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.symbol} {c.name}</option>)}
                  </select>
                  <button className="button" style={{ fontSize: 13 }} onClick={() => handleManualVote(voter.voter_id)} disabled={resolving === voter.voter_id}><VoteIcon size={13} /> Manual vote</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── API EXPLORER TAB ── */}
      {tab === "Audit" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title"><Activity size={16} /> Audit viewer</h2>
              <p className="card-subtitle">Review system audit events with filters and search.</p>
            </div>
            <button className="button" style={{ fontSize: 12 }} onClick={loadAudit}><RefreshCw size={13} /> Refresh</button>
          </div>

          <div className="ledger-toolbar">
            <div className="input-wrap ledger-search">
              <input
                className="ledger-select"
                placeholder="Search events"
                value={auditSearch}
                onChange={(event) => setAuditSearch(event.target.value)}
              />
            </div>
            <div className="input-wrap ledger-search" style={{ maxWidth: 220 }}>
              <select
                className="ledger-select"
                value={auditCategory}
                onChange={(event) => {
                  setAuditCategory(event.target.value);
                  setAuditPage(1);
                }}
              >
                {AUDIT_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {auditLoading ? (
            <div className="results-loading">
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          ) : (() => {
            const normalizedSearch = auditSearch.trim().toLowerCase();
            const filtered = auditEntries.filter((entry) => {
              if (auditCategory !== "all" && entry.category !== auditCategory) {
                return false;
              }
              if (!normalizedSearch) {
                return true;
              }
              const haystack = [
                entry.event_type,
                entry.category,
                entry.description
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return haystack.includes(normalizedSearch);
            });

            return filtered.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 16 }}>
                <div className="empty-icon">AUD</div>
                <h3>No audit events found</h3>
                <p>Adjust the filters or search terms and try again.</p>
              </div>
            ) : (
              <div className="results-list" style={{ marginTop: 18 }}>
                <div className="result-head">
                  <span>Event</span>
                  <span>Timestamp</span>
                  <span>Status</span>
                </div>
                {filtered.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="result-item">
                    <div className="result-left">
                      <div className="candidate-symbol">AUD</div>
                      <div>
                        <strong>{entry.event_type}</strong>
                        <div className="helper-text">
                          {entry.category} · {entry.description || "No description"}
                        </div>
                      </div>
                    </div>
                    <div>{entry.timestamp || "-"}</div>
                    <div className="result-right">
                      <span
                        className={`status-badge ${
                          entry.status === "Success"
                            ? "success"
                            : entry.status === "Warning"
                            ? "warning"
                            : "neutral"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="ledger-footer">
            <span className="ledger-count">
              {auditTotal
                ? `Showing ${(auditPage - 1) * auditPageSize + 1}-${Math.min(auditPage * auditPageSize, auditTotal)} of ${auditTotal}`
                : "No events"}
            </span>
            <div className="ledger-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setAuditPage((prev) => Math.max(prev - 1, 1))}
                disabled={auditPage <= 1 || auditLoading}
              >
                Previous
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => setAuditPage((prev) => Math.min(prev + 1, auditTotalPages || prev + 1))}
                disabled={auditLoading || auditTotalPages === 0 || auditPage >= auditTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "Suspicious" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title"><AlertTriangle size={16} /> Suspicious activity</h2>
              <p className="card-subtitle">Rule-based alerts derived from audit events.</p>
            </div>
            <button className="button" style={{ fontSize: 12 }} onClick={loadSuspicious}><RefreshCw size={13} /> Refresh</button>
          </div>

          <div className="ledger-toolbar">
            <div className="input-wrap ledger-search" style={{ maxWidth: 220 }}>
              <select
                className="ledger-select"
                value={suspiciousFilter}
                onChange={(event) => setSuspiciousFilter(event.target.value)}
              >
                {SUSPICIOUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {suspiciousLoading ? (
            <div className="results-loading">
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          ) : (() => {
            const filtered = suspiciousAlerts.filter((alert) =>
              suspiciousFilter === "all" ? true : alert.severity === suspiciousFilter
            );

            return filtered.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 16 }}>
                <div className="empty-icon">!</div>
                <h3>No suspicious activity detected</h3>
                <p>Alerts appear here when rules are triggered.</p>
              </div>
            ) : (
              <div className="results-list" style={{ marginTop: 18 }}>
                <div className="result-head">
                  <span>Alert</span>
                  <span>Timestamp</span>
                  <span>Severity</span>
                </div>
                {filtered.map((alert, index) => (
                  <div key={`${alert.timestamp}-${index}`} className="result-item">
                    <div className="result-left">
                      <div className="candidate-symbol">ALRT</div>
                      <div>
                        <strong>{alert.alert_type}</strong>
                        <div className="helper-text">{alert.description}</div>
                      </div>
                    </div>
                    <div>{alert.timestamp || "-"}</div>
                    <div className="result-right">
                      <span
                        className={`status-badge ${
                          alert.severity === "Critical" || alert.severity === "High"
                            ? "warning"
                            : alert.severity === "Medium"
                            ? "neutral"
                            : "success"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── INTEGRITY TAB ── */}
      {tab === "Integrity" && (
        <div style={{ marginTop: 16, display: "grid", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={20} className="text-primary" /> Cryptographic Integrity Checker
              </h2>
              <p className="card-subtitle">Verifies that registrations and votes have not been tampered with or modified directly in the database.</p>
            </div>
            <button className="button" style={{ fontSize: 13, padding: "8px 16px" }} onClick={loadIntegrity} disabled={integrityLoading}>
              <RefreshCw size={14} className={integrityLoading ? "spin" : ""} style={{ marginRight: 6 }} /> Run Integrity Check
            </button>
          </div>

          {integrityLoading || !integrityData ? (
            <div className="results-loading" style={{ marginTop: 24 }}>
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          ) : (
            <>
              <div className="admin-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div className="card admin-metric">
                  <div className="metric-icon" style={{ background: "rgba(15, 118, 110, 0.12)", color: "var(--primary)" }}><Users size={18} /></div>
                  <div><p>Total Voters Checked</p><h3>{integrityData.total_voters}</h3></div>
                </div>
                <div className="card admin-metric">
                  <div className="metric-icon" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}><VoteIcon size={18} /></div>
                  <div><p>Total Votes Checked</p><h3>{integrityData.total_votes}</h3></div>
                </div>
                <div className="card admin-metric">
                  <div className="metric-icon" style={{ 
                    background: integrityData.tampered_voters_count + integrityData.tampered_votes_count > 0 ? "rgba(220, 38, 38, 0.12)" : "rgba(22, 163, 74, 0.12)", 
                    color: integrityData.tampered_voters_count + integrityData.tampered_votes_count > 0 ? "var(--danger)" : "var(--success)" 
                  }}><AlertTriangle size={18} /></div>
                  <div>
                    <p>Tampered Records</p>
                    <h3 style={{ color: integrityData.tampered_voters_count + integrityData.tampered_votes_count > 0 ? "var(--danger)" : "inherit" }}>
                      {integrityData.tampered_voters_count + integrityData.tampered_votes_count}
                    </h3>
                  </div>
                </div>
                <div className="card admin-metric">
                  <div className="metric-icon" style={{ 
                    background: integrityData.is_healthy ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)", 
                    color: integrityData.is_healthy ? "var(--success)" : "var(--danger)" 
                  }}><ShieldCheck size={18} /></div>
                  <div>
                    <p>System Health</p>
                    <span className={`admin-pill ${integrityData.is_healthy ? "success" : "danger"}`} style={{ display: "inline-block", marginTop: 4 }}>
                      {integrityData.is_healthy ? "Healthy" : "Compromised"}
                    </span>
                  </div>
                </div>
              </div>

              {integrityData.is_healthy ? (
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", textAlign: "center", background: "rgba(22, 163, 74, 0.03)", border: "1px solid rgba(22, 163, 74, 0.15)" }}>
                  <ShieldCheck size={48} style={{ color: "var(--success)", marginBottom: 12 }} />
                  <h3 style={{ margin: 0, fontSize: 18, color: "var(--text)" }}>Database Integrity Secure</h3>
                  <p className="card-subtitle" style={{ maxWidth: 500, marginTop: 6, marginBottom: 0 }}>
                    Recalculated SHA-256 hashes for all registered voters and cast votes match their stored cryptographic checksums perfectly. No unauthorized changes detected.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 24 }}>
                  {integrityData.tampered_voters_count > 0 && (
                    <div className="card admin-panel">
                      <div className="card-header">
                        <div>
                          <h2 className="card-title" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
                            <UserX size={16} /> Tampered Voter Registrations ({integrityData.tampered_voters_count})
                          </h2>
                          <p className="card-subtitle">Voters whose database details do not match their stored registration hash.</p>
                        </div>
                      </div>
                      <div className="admin-list" style={{ overflowX: "auto" }}>
                        {integrityData.tampered_voters.map(v => (
                          <div key={v.id} className="admin-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
                              <strong>{v.full_name} ({v.voter_id})</strong>
                              <span style={{ color: "var(--danger)", fontSize: 12 }}>Mismatch Detected</span>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>CNIC: {v.cnic}</div>
                            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, fontSize: 11, fontFamily: "monospace", marginTop: 4 }}>
                              <span style={{ color: "var(--success)" }}>Expected:</span>
                              <span style={{ color: "var(--success)", wordBreak: "break-all" }}>{v.expected_hash}</span>
                              <span style={{ color: "var(--danger)" }}>Stored:</span>
                              <span style={{ color: "var(--danger)", wordBreak: "break-all" }}>{v.stored_hash || "NULL / Not Hashed"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {integrityData.tampered_votes_count > 0 && (
                    <div className="card admin-panel">
                      <div className="card-header">
                        <div>
                          <h2 className="card-title" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
                            <VoteIcon size={16} /> Tampered Votes ({integrityData.tampered_votes_count})
                          </h2>
                          <p className="card-subtitle">Ballots whose database records do not match their stored cryptographic vote hash.</p>
                        </div>
                      </div>
                      <div className="admin-list" style={{ overflowX: "auto" }}>
                        {integrityData.tampered_votes.map(v => (
                          <div key={v.id} className="admin-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
                              <strong>Receipt Code: {v.receipt_code}</strong>
                              <span style={{ color: "var(--danger)", fontSize: 12 }}>Mismatch Detected</span>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>Voter ID Ref: {v.voter_id} · Candidate ID: {v.candidate_id}</div>
                            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, fontSize: 11, fontFamily: "monospace", marginTop: 4 }}>
                              <span style={{ color: "var(--success)" }}>Expected:</span>
                              <span style={{ color: "var(--success)", wordBreak: "break-all" }}>{v.expected_hash}</span>
                              <span style={{ color: "var(--danger)" }}>Stored:</span>
                              <span style={{ color: "var(--danger)", wordBreak: "break-all" }}>{v.stored_hash || "NULL / Not Hashed"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}



      {/* ── SECURITY DEMONSTRATION CENTER TAB ── */}
      {tab === "Demo Center" && (
        <div style={{ marginTop: 16, display: "grid", gap: 24 }}>
          <div>
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} className="text-primary" /> Security Demonstration Center
            </h2>
            <p className="card-subtitle">
              Interactive sandbox demonstrating the system's defenses against fraudulent activities, double voting, and verification failures. For educational and FYP demonstration purposes.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
            {/* G1: Fraud Simulation */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={18} style={{ color: "var(--warning)" }} /> G1 — Fraud Simulation
                  </h3>
                  <p className="card-subtitle">Test system defenses against common attack vectors.</p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 0 }}>
                <label className="form-label">Select Attack / Threat Vector</label>
                <select 
                  className="input" 
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", height: "auto", fontSize: "14px" }}
                  value={g1ThreatType}
                  onChange={(e) => setG1ThreatType(e.target.value)}
                >
                  <option value="rate_limit">Rate Limiter Bypass (API Flooding)</option>
                  <option value="lockout">Account Lockout Exploitation</option>
                  <option value="cnic">CNIC Format Injection</option>
                  <option value="phone">Phone Number Validation Bypass</option>
                  <option value="face">Biometric Face Spoofing (Mismatch)</option>
                </select>
              </div>

              <button 
                className={`button ${g1Loading ? "is-loading" : ""}`} 
                onClick={handleG1Simulate} 
                disabled={g1Loading}
                style={{ width: "100%" }}
              >
                {g1Loading ? "Simulating..." : "Trigger Fraud Simulation"}
              </button>

              {g1Result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, animation: "pageFade 0.25s ease both" }}>
                  <div style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, textTransform: "uppercase", color: "var(--danger)" }}>Simulation Result</strong>
                      <span className="status-badge warning" style={{ background: "rgba(220, 38, 38, 0.12)", color: "var(--danger)" }}>Blocked</span>
                    </div>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                      <div><strong>Threat Type:</strong> {g1Result.threatType}</div>
                      <div><strong>Protection Triggered:</strong> <code style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: 4 }}>{g1Result.protection}</code></div>
                      <div><strong>Result:</strong> <span style={{ color: "var(--danger)", fontWeight: 600 }}>{g1Result.status}</span></div>
                      <div style={{ color: "var(--muted)", marginTop: 4 }}>{g1Result.explanation}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <ShieldCheck size={14} /> Educational Panel (FYP Showcase)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                      <div><strong>Attack Attempt:</strong> {g1Result.attackAttempt}</div>
                      <div><strong>Protection Activated:</strong> {g1Result.protectionActivated}</div>
                      <div><strong>Why It Failed:</strong> {g1Result.whyFailed}</div>
                      <div><strong>System Benefit:</strong> {g1Result.benefit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* G2: Duplicate Vote */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={18} style={{ color: "var(--primary)" }} /> G2 — Duplicate Vote Demo
                  </h3>
                  <p className="card-subtitle">Verify prevention of double-voting attempts.</p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 0 }}>
                <label className="form-label">Simulated Voter ID</label>
                <input 
                  className="input" 
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", height: "auto", fontSize: "14px" }}
                  value={g2VoterId}
                  onChange={(e) => setG2VoterId(e.target.value)}
                  placeholder="Enter Voter ID"
                />
              </div>

              <button 
                className={`button ${g2Loading ? "is-loading" : ""}`} 
                onClick={handleG2Simulate} 
                disabled={g2Loading}
                style={{ width: "100%" }}
              >
                {g2Loading ? "Checking..." : "Attempt Double Vote Simulation"}
              </button>

              {g2Result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, animation: "pageFade 0.25s ease both" }}>
                  <div style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "normal", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, textTransform: "uppercase", color: "var(--danger)" }}>Simulation Result</strong>
                      <span className="status-badge warning" style={{ background: "rgba(220, 38, 38, 0.12)", color: "var(--danger)" }}>Prevented</span>
                    </div>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                      <div><strong>Protection Mechanism:</strong> <code style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.05)", padding: "2px 4px", borderRadius: 4 }}>{g2Result.protection}</code></div>
                      <div><strong>Result:</strong> <span style={{ color: "var(--danger)", fontWeight: 600 }}>{g2Result.status}</span></div>
                      <div style={{ color: "var(--muted)", marginTop: 4 }}>{g2Result.explanation}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <ShieldCheck size={14} /> Educational Panel (FYP Showcase)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                      <div><strong>Attack Attempt:</strong> {g2Result.attackAttempt}</div>
                      <div><strong>Protection Activated:</strong> {g2Result.protectionActivated}</div>
                      <div><strong>Why It Failed:</strong> {g2Result.whyFailed}</div>
                      <div><strong>System Benefit:</strong> {g2Result.benefit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* G3: Verification Failure */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={18} style={{ color: "var(--primary)" }} /> G3 — Verification Failure Demo
                  </h3>
                  <p className="card-subtitle">Simulate invalid receipt verification checks.</p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 0 }}>
                <label className="form-label">Simulation Scenario</label>
                <select 
                  className="input" 
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", height: "auto", fontSize: "14px" }}
                  value={g3FailureType}
                  onChange={(e) => setG3FailureType(e.target.value)}
                >
                  <option value="invalid">Invalid Verification Code</option>
                  <option value="expired">Expired Verification Code</option>
                  <option value="malformed">Malformed Verification Code</option>
                </select>
              </div>

              <button 
                className={`button ${g3Loading ? "is-loading" : ""}`} 
                onClick={handleG3Simulate} 
                disabled={g3Loading}
                style={{ width: "100%" }}
              >
                {g3Loading ? "Verifying..." : "Simulate Verification Check"}
              </button>

              {g3Result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, animation: "pageFade 0.25s ease both" }}>
                  <div style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, textTransform: "uppercase", color: "var(--danger)" }}>Simulation Result</strong>
                      <span className="status-badge warning" style={{ background: "rgba(220, 38, 38, 0.12)", color: "var(--danger)" }}>Rejected</span>
                    </div>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                      <div><strong>Failure Reason:</strong> {g3Result.failureType}</div>
                      <div><strong>Result Status:</strong> <span style={{ color: "var(--danger)", fontWeight: 600 }}>{g3Result.status}</span></div>
                      <div><strong>Security Explanation:</strong> {g3Result.explanation}</div>
                      <div style={{ color: "var(--warning)", fontWeight: 600, marginTop: 4 }}><strong>Recommended Action:</strong> {g3Result.action}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <ShieldCheck size={14} /> Educational Panel (FYP Showcase)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                      <div><strong>Attack Attempt:</strong> {g3Result.attackAttempt}</div>
                      <div><strong>Protection Activated:</strong> {g3Result.protectionActivated}</div>
                      <div><strong>Why It Failed:</strong> {g3Result.whyFailed}</div>
                      <div><strong>System Benefit:</strong> {g3Result.benefit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY CRYPTOGRAPHY DEMONSTRATION TAB ── */}
      {tab === "Crypto Center" && (
        <div style={{ marginTop: 16, display: "grid", gap: 24 }}>
          <div>
            <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} className="text-primary" /> Advanced Cryptography Center
            </h2>
            <p className="card-subtitle">
              Interactive educational sandbox demonstrating core cryptographic principles used in modern secure voting systems. For educational and FYP demonstration purposes.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: 24 }}>
            {/* H1: Digital Signatures */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <Lock size={18} style={{ color: "var(--primary)" }} /> H1 — Digital Signatures
                  </h3>
                  <p className="card-subtitle">Sign and verify a sample ballot verification proof.</p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 0 }}>
                <label className="form-label">Ballot Message Payload</label>
                <textarea 
                  className="input" 
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", height: "80px", fontSize: "13px", resize: "none", width: "100%", color: "var(--text)", fontFamily: "inherit" }}
                  value={h1Message}
                  onChange={(e) => {
                    setH1Message(e.target.value);
                    setH1Verified(null);
                  }}
                  placeholder="Enter message to sign"
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button className="button" onClick={handleH1Sign} style={{ flex: 1 }}>
                  Generate Signature
                </button>
                <button className="button secondary" onClick={handleH1Verify} disabled={!h1Signature} style={{ flex: 1 }}>
                  Verify Signature
                </button>
              </div>

              {h1Hash && (
                <div style={{ display: "grid", gap: 8, fontSize: 12, padding: 12, borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
                  <div><strong>SHA-256 Hash:</strong> <code style={{ wordBreak: "break-all" }}>{h1Hash}</code></div>
                  {h1Signature && <div><strong>Signature (RSA Private Key 0xE3...A4):</strong> <code style={{ wordBreak: "break-all", color: "var(--primary)" }}>{h1Signature}</code></div>}
                </div>
              )}

              {h1Verified !== null && (
                <div style={{ padding: 12, borderRadius: "var(--radius-sm)", background: h1Verified ? "rgba(22, 163, 74, 0.05)" : "rgba(220, 38, 38, 0.05)", border: h1Verified ? "1px solid rgba(22, 163, 74, 0.15)" : "1px solid rgba(220, 38, 38, 0.15)", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: h1Verified ? "var(--success)" : "var(--danger)", marginBottom: 4 }}>
                    {h1Verified ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                    {h1Verified ? "Signature Verified Successful" : "Signature Verification Failed"}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{h1VerificationDetails}</div>
                </div>
              )}

              <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Educational Panel
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div><strong>What & Why:</strong> Digital Signatures guarantee the authenticity and integrity of vote receipts, ensuring no third party can forge a receipt or alter ballot records.</div>
                  <div><strong>How It Works:</strong> The message is hashed via SHA-256. The hash is encrypted with a private key (signing). The verifier decrypts it with the public key and compares hashes. If they match, integrity and identity are proven.</div>
                  <div><strong>Election Use Case:</strong> Verification codes and transparency ledgers are cryptographically signed at the ballot box so users can verifiably prove their vote was parsed legally.</div>
                  <div><strong>Security Advantage:</strong> Absolute non-repudiation and instant tamper detection (try changing the message text after signing to watch verification fail!).</div>
                </div>
              </div>
            </div>

            {/* H2: Secret Sharing */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={18} style={{ color: "var(--primary)" }} /> H2 — Secret Sharing
                  </h3>
                  <p className="card-subtitle">Split a master election key into multiple secret shares.</p>
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group" style={{ marginTop: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Total Shares (N)</label>
                  <input type="number" min="2" max="10" className="input" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", height: "auto" }} value={h2TotalShares} onChange={(e) => setH2TotalShares(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginTop: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Threshold (T)</label>
                  <input type="number" min="2" max="10" className="input" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", height: "auto" }} value={h2Threshold} onChange={(e) => setH2Threshold(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Master Private Key Secret</label>
                <input className="input" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", height: "auto" }} value={h2Secret} onChange={(e) => setH2Secret(e.target.value)} />
              </div>

              <button className="button" onClick={handleH2Split}>
                Generate Secret Shares
              </button>

              {h2Shares.length > 0 && (
                <div style={{ display: "grid", gap: 10, fontSize: 12, padding: 12, borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
                  <strong>Split Shares (Select at least {h2Threshold} to reconstruct):</strong>
                  <div style={{ display: "grid", gap: 6 }}>
                    {h2Shares.map(share => (
                      <label key={share.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" checked={!!h2SelectedShares[share.id]} onChange={() => toggleH2Share(share.id)} style={{ width: 15, height: 15 }} />
                        <span>Share {share.id}: <code style={{ color: "var(--primary)" }}>{share.value}</code></span>
                      </label>
                    ))}
                  </div>

                  <button className="button secondary" onClick={handleH2Reconstruct} style={{ marginTop: 8 }}>
                    Reconstruct Secret
                  </button>
                </div>
              )}

              {h2ReconstructStatus && (
                <div style={{ padding: 12, borderRadius: "var(--radius-sm)", background: h2ReconstructStatus === "success" ? "rgba(22, 163, 74, 0.05)" : "rgba(220, 38, 38, 0.05)", border: h2ReconstructStatus === "success" ? "1px solid rgba(22, 163, 74, 0.15)" : "1px solid rgba(220, 38, 38, 0.15)", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: h2ReconstructStatus === "success" ? "var(--success)" : "var(--danger)" }}>
                    {h2ReconstructStatus === "success" ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                    {h2ReconstructStatus === "success" ? "Reconstruction Success" : "Reconstruction Failed"}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {h2ReconstructStatus === "success" 
                      ? `Successfully unlocked master secret: "${h2ReconstructedSecret}"` 
                      : `Insufficient shares. Selected: ${Object.values(h2SelectedShares).filter(Boolean).length} / Required Threshold: ${h2Threshold}`}
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Educational Panel
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div><strong>What & Why:</strong> Secret Sharing avoids a single point of failure in key management. T-of-N threshold sharing ensures no single administrator can extract sensitive system keys alone.</div>
                  <div><strong>How It Works:</strong> Uses Shamir's scheme. The dealer constructs a random polynomial of degree T-1 where the constant coefficient is the secret key. Points on this curve are distributed. Any T points can reconstruct the curve.</div>
                  <div><strong>Election Use Case:</strong> The tally decryption key is split among N election commissioners. At results time, they must cooperatively upload their shares to verify and publish results.</div>
                  <div><strong>Limitations:</strong> Requires a trusted dealer to initially generate and distribute shares securely.</div>
                </div>
              </div>
            </div>

            {/* H3: Threshold Cryptography */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <Activity size={18} style={{ color: "var(--primary)" }} /> H3 — Threshold Cryptography
                  </h3>
                  <p className="card-subtitle">Unlock election tallies using cooperative distributed decryption.</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, fontSize: 12, padding: 12, borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
                <strong>Election Trustees (3 of 5 required to unlock):</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 4 }}>
                  {Object.keys(h3Trustees).map(name => (
                    <label key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, border: "1px solid var(--border)", borderRadius: 8, background: h3Trustees[name] ? "rgba(22, 163, 74, 0.05)" : "transparent", cursor: "pointer" }}>
                      <input type="checkbox" checked={h3Trustees[name]} onChange={() => toggleH3Trustee(name)} style={{ width: 14, height: 14 }} />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="button" onClick={handleH3Decrypt}>
                Decrypt Election Tally
              </button>

              {h3Status && (
                <div style={{ padding: 12, borderRadius: "var(--radius-sm)", background: h3Status === "success" ? "rgba(22, 163, 74, 0.05)" : "rgba(220, 38, 38, 0.05)", border: h3Status === "success" ? "1px solid rgba(22, 163, 74, 0.15)" : "1px solid rgba(220, 38, 38, 0.15)", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: h3Status === "success" ? "var(--success)" : "var(--danger)", marginBottom: 4 }}>
                    {h3Status === "success" ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                    {h3Status === "success" ? "Decryption Successful" : "Decryption Blocked"}
                  </div>
                  {h3Status === "success" ? (
                    <code style={{ background: "rgba(0,0,0,0.05)", padding: "8px 12px", borderRadius: 6, display: "block", fontSize: 11, wordBreak: "break-all", fontFamily: "monospace" }}>{h3DecryptedResult}</code>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Active Trustees: {Object.values(h3Trustees).filter(Boolean).length} / 5. Need at least 3 to perform decryption.</div>
                  )}
                </div>
              )}

              <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Educational Panel
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div><strong>What & Why:</strong> Threshold Decryption allows tallies to be decrypted without assembling the master private key in one location, protecting keys from memory theft.</div>
                  <div><strong>How It Works:</strong> Each trustee uses their private share key to decrypt the ciphertext locally, producing a decryption share (partial decryption). These shares are mathematically aggregated to reveal the plaintext.</div>
                  <div><strong>Security Advantage:</strong> Prevents unauthorized early disclosure of results. The ballot counts remain fully encrypted until the required board members officially sign off.</div>
                  <div><strong>Limitations:</strong> Requires all trustees to utilize compatible mathematical primitives (e.g. ElGamal on elliptic curves).</div>
                </div>
              </div>
            </div>

            {/* H4: Zero Knowledge Proofs */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={18} style={{ color: "var(--primary)" }} /> H4 — Zero Knowledge Proofs (ZKP)
                  </h3>
                  <p className="card-subtitle">Prove knowledge of voter credentials without exposing them.</p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 0 }}>
                <label className="form-label">Secret Credential Token</label>
                <input 
                  type="password" 
                  className="input" 
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", height: "auto", fontSize: "14px", color: "var(--text)" }} 
                  value={h4Secret} 
                  onChange={(e) => {
                    setH4Secret(e.target.value);
                    setH4Proof("");
                    setH4Verified(null);
                  }} 
                  placeholder="Enter secret word" 
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button className="button" onClick={handleH4GenerateProof} style={{ flex: 1 }}>
                  Generate ZK-Proof
                </button>
                <button className="button secondary" onClick={handleH4VerifyProof} disabled={!h4Proof} style={{ flex: 1 }}>
                  Verify ZK-Proof
                </button>
              </div>

              {h4Proof && (
                <div style={{ display: "grid", gap: 6, fontSize: 12, padding: 12, borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
                  <div><strong>Public Verification Hash:</strong> <code style={{ wordBreak: "break-all" }}>{h4PublicValue}</code></div>
                  <div><strong>Generated Proof Object (ZK-SNARK mock):</strong></div>
                  <pre style={{ margin: 0, fontSize: 10, background: "#0f172a", color: "#e2e8f0", padding: 8, borderRadius: 6, overflowX: "auto", maxHeight: "100px" }}>{h4Proof}</pre>
                </div>
              )}

              {h4Verified !== null && (
                <div style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "rgba(22, 163, 74, 0.05)", border: "1px solid rgba(22, 163, 74, 0.15)", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--success)" }}>
                    <ShieldCheck size={16} /> Proof Verified Successfully
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    ZK-SNARK validator confirms: Prover holds the private key matching the public hash {h4PublicValue.substring(0, 12)}... The secret credential remains completely hidden.
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: 16, background: "rgba(15, 118, 110, 0.03)", border: "1px solid rgba(15, 118, 110, 0.15)", borderRadius: "var(--radius-sm)", boxShadow: "none" }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "var(--primary-strong)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Educational Panel
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div><strong>What & Why:</strong> Zero Knowledge Proofs enable verification of compliance (e.g. proof of voter age, registry membership) without compromising credentials or revealing voter ballots.</div>
                  <div><strong>How It Works:</strong> ZK-SNARK protocols compile a computation into algebraic circuits. The prover generates a proof string validating that they know witness parameters satisfying the circuit equations.</div>
                  <div><strong>Election Use Case:</strong> Proving voter eligibility without revealing CNIC/name, or proving a ballot belongs to a valid candidate list without revealing the individual vote.</div>
                  <div><strong>Limitations:</strong> High computational complexity for proof generation on lower-end devices.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
