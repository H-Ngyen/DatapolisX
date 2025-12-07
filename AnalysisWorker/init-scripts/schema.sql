--
-- PostgreSQL database dump
--

\restrict 87uN6QhK7Ioys6Y0q1dYbYNpVMCaZpm0Pghu3wet10NttCEgjCbnBEosPuW1ZwZ

-- Dumped from database version 17.7 (178558d)
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg24.04+1)

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
-- Name: camera_detections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.camera_detections (
    id integer NOT NULL,
    minio_key character varying(255) NOT NULL,
    camera_id character varying(50) NOT NULL,
    detections jsonb,
    total_objects integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.camera_detections OWNER TO neondb_owner;

--
-- Name: camera_detections_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.camera_detections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_detections_id_seq OWNER TO neondb_owner;

--
-- Name: camera_detections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.camera_detections_id_seq OWNED BY public.camera_detections.id;


--
-- Name: camera_predictions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.camera_predictions (
    id integer NOT NULL,
    camera_id character varying(50) NOT NULL,
    forecast_timestamp timestamp with time zone NOT NULL,
    predicted_total_objects double precision NOT NULL,
    minutes_resample smallint NOT NULL,
    prediction_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    forecast_hour smallint,
    forecast_dayofweek smallint,
    forecast_is_weekend boolean,
    forecast_dayofyear smallint,
    forecast_weekofyear smallint,
    forecast_month smallint
);


ALTER TABLE public.camera_predictions OWNER TO neondb_owner;

--
-- Name: camera_predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.camera_predictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camera_predictions_id_seq OWNER TO neondb_owner;

--
-- Name: camera_predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.camera_predictions_id_seq OWNED BY public.camera_predictions.id;


--
-- Name: camera_detections id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.camera_detections ALTER COLUMN id SET DEFAULT nextval('public.camera_detections_id_seq'::regclass);


--
-- Name: camera_predictions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.camera_predictions ALTER COLUMN id SET DEFAULT nextval('public.camera_predictions_id_seq'::regclass);


--
-- Name: camera_detections camera_detections_minio_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.camera_detections
    ADD CONSTRAINT camera_detections_minio_key_key UNIQUE (minio_key);


--
-- Name: camera_detections camera_detections_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.camera_detections
    ADD CONSTRAINT camera_detections_pkey PRIMARY KEY (id);


--
-- Name: camera_predictions camera_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.camera_predictions
    ADD CONSTRAINT camera_predictions_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 87uN6QhK7Ioys6Y0q1dYbYNpVMCaZpm0Pghu3wet10NttCEgjCbnBEosPuW1ZwZ

