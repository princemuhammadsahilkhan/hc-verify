--
-- PostgreSQL database dump
--

\restrict I0uK0fG511fNfr9VRcMihacpjzsFFppUTgeSNHHHGBE3N2MTHaPaVRkrLvsipa6

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    action character varying,
    details text,
    "timestamp" timestamp with time zone,
    severity character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: auditors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditors (
    auditor_id integer NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(100) NOT NULL,
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auditors OWNER TO postgres;

--
-- Name: auditors_auditor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditors_auditor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditors_auditor_id_seq OWNER TO postgres;

--
-- Name: auditors_auditor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditors_auditor_id_seq OWNED BY public.auditors.auditor_id;


--
-- Name: ballots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ballots (
    ballot_id integer NOT NULL,
    voter_id integer NOT NULL,
    "Name: encrypted_vote" text NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    encrypted_vote text,
    signature text,
    receipt_code character varying(255)
);


ALTER TABLE public.ballots OWNER TO postgres;

--
-- Name: ballots_ballot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ballots_ballot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ballots_ballot_id_seq OWNER TO postgres;

--
-- Name: ballots_ballot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ballots_ballot_id_seq OWNED BY public.ballots.ballot_id;


--
-- Name: blockchain_commitments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blockchain_commitments (
    commitment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    election_id uuid,
    district_id uuid,
    merkle_root character varying(255) NOT NULL,
    total_votes integer NOT NULL,
    transaction_hash character varying(255),
    block_number bigint,
    blockchain_network character varying(100),
    gas_fee numeric(12,6),
    submitted_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blockchain_commitments OWNER TO postgres;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    name character varying NOT NULL,
    party character varying NOT NULL,
    symbol character varying,
    district character varying,
    constituency character varying,
    votes integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.candidates OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidates_id_seq OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- Name: district_servers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.district_servers (
    server_id integer NOT NULL,
    city character varying(100) NOT NULL,
    private_key_share text,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.district_servers OWNER TO postgres;

--
-- Name: district_servers_server_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.district_servers_server_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.district_servers_server_id_seq OWNER TO postgres;

--
-- Name: district_servers_server_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.district_servers_server_id_seq OWNED BY public.district_servers.server_id;


--
-- Name: district_sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.district_sync_logs (
    sync_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_district uuid,
    target_district uuid,
    batch_id character varying(100),
    vote_count integer,
    sync_hash character varying(255),
    sync_signature text,
    sync_status character varying(50),
    synced_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.district_sync_logs OWNER TO postgres;

--
-- Name: districts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.districts (
    district_id uuid DEFAULT gen_random_uuid() NOT NULL,
    district_name character varying(150) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.districts OWNER TO postgres;

--
-- Name: elections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.elections (
    election_id uuid DEFAULT gen_random_uuid() NOT NULL,
    election_name character varying(200) NOT NULL,
    election_type character varying(100),
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.elections OWNER TO postgres;

--
-- Name: key_holders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.key_holders (
    holder_id uuid DEFAULT gen_random_uuid() NOT NULL,
    holder_name character varying(150),
    organization_name character varying(150),
    public_key text,
    email character varying(150),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.key_holders OWNER TO postgres;

--
-- Name: key_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.key_shares (
    share_id uuid DEFAULT gen_random_uuid() NOT NULL,
    election_id uuid,
    holder_id uuid,
    encrypted_share text NOT NULL,
    share_index integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.key_shares OWNER TO postgres;

--
-- Name: paper_ballots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_ballots (
    paper_ballot_id uuid DEFAULT gen_random_uuid() NOT NULL,
    ballot_id character varying(100) NOT NULL,
    station_id uuid,
    district_id uuid,
    paper_verified boolean DEFAULT false,
    sealed_box_number character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.paper_ballots OWNER TO postgres;

--
-- Name: polling_stations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.polling_stations (
    station_id uuid DEFAULT gen_random_uuid() NOT NULL,
    station_name character varying(150),
    district_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.polling_stations OWNER TO postgres;

--
-- Name: public_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_ledger (
    ledger_id integer NOT NULL,
    ballot_id integer NOT NULL,
    vote_hash text NOT NULL,
    merkle_root text,
    district_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.public_ledger OWNER TO postgres;

--
-- Name: public_ledger_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_ledger_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.public_ledger_ledger_id_seq OWNER TO postgres;

--
-- Name: public_ledger_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_ledger_ledger_id_seq OWNED BY public.public_ledger.ledger_id;


--
-- Name: security_incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_incidents (
    incident_id uuid DEFAULT gen_random_uuid() NOT NULL,
    district_id uuid,
    incident_type character varying(100),
    severity character varying(30),
    description text,
    resolved boolean DEFAULT false,
    resolved_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.security_incidents OWNER TO postgres;

--
-- Name: tally_engine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tally_engine (
    tally_id integer NOT NULL,
    threshold_key text,
    candidate_votes jsonb,
    tally_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying
);


ALTER TABLE public.tally_engine OWNER TO postgres;

--
-- Name: tally_engine_tally_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tally_engine_tally_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tally_engine_tally_id_seq OWNER TO postgres;

--
-- Name: tally_engine_tally_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tally_engine_tally_id_seq OWNED BY public.tally_engine.tally_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(150),
    email character varying(150),
    role character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verification_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_requests (
    request_id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_hash character varying(255),
    ip_address character varying(100),
    verified boolean DEFAULT false,
    verified_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.verification_requests OWNER TO postgres;

--
-- Name: voters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voters (
    id integer NOT NULL,
    voter_id character varying NOT NULL,
    full_name character varying NOT NULL,
    email character varying,
    password character varying,
    cnic character varying NOT NULL,
    district character varying,
    phone character varying NOT NULL,
    constituency character varying NOT NULL,
    has_voted boolean,
    is_verified boolean,
    face_embedding text,
    is_pending boolean,
    pending_reason character varying,
    registration_hash character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.voters OWNER TO postgres;

--
-- Name: voters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.voters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.voters_id_seq OWNER TO postgres;

--
-- Name: voters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.voters_id_seq OWNED BY public.voters.id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.votes (
    id integer NOT NULL,
    voter_id integer,
    candidate_id integer,
    receipt_code character varying,
    vote_hash character varying,
    blockchain_hash character varying,
    "timestamp" timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.votes OWNER TO postgres;

--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.votes_id_seq OWNER TO postgres;

--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: vvpat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vvpat (
    paper_ballot_id integer NOT NULL,
    candidate_choice character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vvpat OWNER TO postgres;

--
-- Name: vvpat_paper_ballot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vvpat_paper_ballot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vvpat_paper_ballot_id_seq OWNER TO postgres;

--
-- Name: vvpat_paper_ballot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vvpat_paper_ballot_id_seq OWNED BY public.vvpat.paper_ballot_id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auditors auditor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditors ALTER COLUMN auditor_id SET DEFAULT nextval('public.auditors_auditor_id_seq'::regclass);


--
-- Name: ballots ballot_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ballots ALTER COLUMN ballot_id SET DEFAULT nextval('public.ballots_ballot_id_seq'::regclass);


--
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- Name: district_servers server_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district_servers ALTER COLUMN server_id SET DEFAULT nextval('public.district_servers_server_id_seq'::regclass);


--
-- Name: public_ledger ledger_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_ledger ALTER COLUMN ledger_id SET DEFAULT nextval('public.public_ledger_ledger_id_seq'::regclass);


--
-- Name: tally_engine tally_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tally_engine ALTER COLUMN tally_id SET DEFAULT nextval('public.tally_engine_tally_id_seq'::regclass);


--
-- Name: voters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voters ALTER COLUMN id SET DEFAULT nextval('public.voters_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Name: vvpat paper_ballot_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vvpat ALTER COLUMN paper_ballot_id SET DEFAULT nextval('public.vvpat_paper_ballot_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auditors auditors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditors
    ADD CONSTRAINT auditors_pkey PRIMARY KEY (auditor_id);


--
-- Name: ballots ballots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ballots
    ADD CONSTRAINT ballots_pkey PRIMARY KEY (ballot_id);


--
-- Name: blockchain_commitments blockchain_commitments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_commitments
    ADD CONSTRAINT blockchain_commitments_pkey PRIMARY KEY (commitment_id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: district_servers district_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district_servers
    ADD CONSTRAINT district_servers_pkey PRIMARY KEY (server_id);


--
-- Name: district_sync_logs district_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district_sync_logs
    ADD CONSTRAINT district_sync_logs_pkey PRIMARY KEY (sync_id);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (district_id);


--
-- Name: elections elections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_pkey PRIMARY KEY (election_id);


--
-- Name: key_holders key_holders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.key_holders
    ADD CONSTRAINT key_holders_pkey PRIMARY KEY (holder_id);


--
-- Name: key_shares key_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.key_shares
    ADD CONSTRAINT key_shares_pkey PRIMARY KEY (share_id);


--
-- Name: paper_ballots paper_ballots_ballot_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_ballots
    ADD CONSTRAINT paper_ballots_ballot_id_key UNIQUE (ballot_id);


--
-- Name: paper_ballots paper_ballots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_ballots
    ADD CONSTRAINT paper_ballots_pkey PRIMARY KEY (paper_ballot_id);


--
-- Name: polling_stations polling_stations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polling_stations
    ADD CONSTRAINT polling_stations_pkey PRIMARY KEY (station_id);


--
-- Name: public_ledger public_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_ledger
    ADD CONSTRAINT public_ledger_pkey PRIMARY KEY (ledger_id);


--
-- Name: security_incidents security_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_pkey PRIMARY KEY (incident_id);


--
-- Name: tally_engine tally_engine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tally_engine
    ADD CONSTRAINT tally_engine_pkey PRIMARY KEY (tally_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: verification_requests verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_pkey PRIMARY KEY (request_id);


--
-- Name: voters voters_cnic_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voters
    ADD CONSTRAINT voters_cnic_key UNIQUE (cnic);


--
-- Name: voters voters_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voters
    ADD CONSTRAINT voters_email_key UNIQUE (email);


--
-- Name: voters voters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voters
    ADD CONSTRAINT voters_pkey PRIMARY KEY (id);


--
-- Name: voters voters_voter_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voters
    ADD CONSTRAINT voters_voter_id_key UNIQUE (voter_id);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: votes votes_receipt_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_receipt_code_key UNIQUE (receipt_code);


--
-- Name: vvpat vvpat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vvpat
    ADD CONSTRAINT vvpat_pkey PRIMARY KEY (paper_ballot_id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_candidates_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_candidates_id ON public.candidates USING btree (id);


--
-- Name: ix_voters_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_voters_id ON public.voters USING btree (id);


--
-- Name: ix_votes_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_votes_id ON public.votes USING btree (id);


--
-- Name: blockchain_commitments blockchain_commitments_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_commitments
    ADD CONSTRAINT blockchain_commitments_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: blockchain_commitments blockchain_commitments_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_commitments
    ADD CONSTRAINT blockchain_commitments_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(election_id);


--
-- Name: blockchain_commitments blockchain_commitments_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blockchain_commitments
    ADD CONSTRAINT blockchain_commitments_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(user_id);


--
-- Name: district_sync_logs district_sync_logs_source_district_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district_sync_logs
    ADD CONSTRAINT district_sync_logs_source_district_fkey FOREIGN KEY (source_district) REFERENCES public.districts(district_id);


--
-- Name: district_sync_logs district_sync_logs_target_district_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.district_sync_logs
    ADD CONSTRAINT district_sync_logs_target_district_fkey FOREIGN KEY (target_district) REFERENCES public.districts(district_id);


--
-- Name: ballots fk_ballots_voter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ballots
    ADD CONSTRAINT fk_ballots_voter FOREIGN KEY (voter_id) REFERENCES public.voters(id);


--
-- Name: key_shares key_shares_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.key_shares
    ADD CONSTRAINT key_shares_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(election_id);


--
-- Name: key_shares key_shares_holder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.key_shares
    ADD CONSTRAINT key_shares_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES public.key_holders(holder_id);


--
-- Name: paper_ballots paper_ballots_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_ballots
    ADD CONSTRAINT paper_ballots_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: paper_ballots paper_ballots_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_ballots
    ADD CONSTRAINT paper_ballots_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.polling_stations(station_id);


--
-- Name: polling_stations polling_stations_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polling_stations
    ADD CONSTRAINT polling_stations_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: security_incidents security_incidents_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(district_id);


--
-- Name: security_incidents security_incidents_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(user_id);


--
-- Name: votes votes_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id);


--
-- Name: votes votes_voter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.voters(id);


--
-- PostgreSQL database dump complete
--

\unrestrict I0uK0fG511fNfr9VRcMihacpjzsFFppUTgeSNHHHGBE3N2MTHaPaVRkrLvsipa6

