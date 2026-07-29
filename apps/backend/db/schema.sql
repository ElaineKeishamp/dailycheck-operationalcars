--
-- PostgreSQL database dump
--

\restrict 2Exm9mw2Mc5VPdbHDqmQf2PVcjv7GEcPaErPTJg5l0TtShep7X5qzoVhyIg0gjI

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-28 13:51:56

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

--
-- TOC entry 2 (class 3079 OID 17435)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 17543)
-- Name: check_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.check_photos (
    check_photos_id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_id uuid NOT NULL,
    part_type character varying(20) NOT NULL,
    part_index integer,
    r2_key text NOT NULL,
    thumbnail_key text NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_photos_part_index_check CHECK (((((part_type)::text = 'ban'::text) AND ((part_index IS NULL) OR ((part_index >= 1) AND (part_index <= 4)))) OR (((part_type)::text <> 'ban'::text) AND (part_index IS NULL)))),
    CONSTRAINT check_photos_part_type_check CHECK (((part_type)::text = ANY ((ARRAY['odo'::character varying, 'body_kiri'::character varying, 'body_kanan'::character varying, 'kap'::character varying, 'depan'::character varying, 'belakang'::character varying, 'interior'::character varying, 'ban'::character varying, 'lainnya'::character varying])::text[])))
);


ALTER TABLE public.check_photos OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17513)
-- Name: daily_checks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_checks (
    daily_id uuid DEFAULT gen_random_uuid() NOT NULL,
    users_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    actual_driver_name character varying(100),
    check_date date DEFAULT CURRENT_DATE NOT NULL,
    gps_lat numeric(10,8),
    gps_long numeric(11,8),
    gps_address text,
    status character varying(20) DEFAULT 'incomplete'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT daily_checks_status_check CHECK (((status)::text = ANY ((ARRAY['submitted'::character varying, 'incomplete'::character varying])::text[])))
);


ALTER TABLE public.daily_checks OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17473)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    users_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    is_shared_account boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    must_change_password boolean DEFAULT false CONSTRAINT users_must_change__password_not_null NOT NULL,
    reset_token text,
    reset_token_expires timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'driver'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17496)
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    vehicle_id uuid DEFAULT gen_random_uuid() NOT NULL,
    plate_number character varying(20) NOT NULL,
    brand character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT vehicles_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- TOC entry 4940 (class 2606 OID 17558)
-- Name: check_photos check_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.check_photos
    ADD CONSTRAINT check_photos_pkey PRIMARY KEY (check_photos_id);


--
-- TOC entry 4933 (class 2606 OID 17530)
-- Name: daily_checks daily_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT daily_checks_pkey PRIMARY KEY (daily_id);


--
-- TOC entry 4938 (class 2606 OID 17572)
-- Name: daily_checks unique_vehicle_perday; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT unique_vehicle_perday UNIQUE (vehicle_id, check_date);


--
-- TOC entry 4925 (class 2606 OID 17495)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4927 (class 2606 OID 17493)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (users_id);


--
-- TOC entry 4929 (class 2606 OID 17510)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 4931 (class 2606 OID 17512)
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- TOC entry 4941 (class 1259 OID 17567)
-- Name: idx_check_photos_daily; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_check_photos_daily ON public.check_photos USING btree (daily_id);


--
-- TOC entry 4942 (class 1259 OID 17568)
-- Name: idx_check_photos_part_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_check_photos_part_type ON public.check_photos USING btree (part_type);


--
-- TOC entry 4943 (class 1259 OID 17569)
-- Name: unique_check_photos_daily_ban_slot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_check_photos_daily_ban_slot ON public.check_photos USING btree (daily_id, part_type, part_index) WHERE (((part_type)::text = 'ban'::text) AND (part_index IS NOT NULL));


--
-- TOC entry 4944 (class 1259 OID 17570)
-- Name: unique_check_photos_daily_non_ban_slot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_check_photos_daily_non_ban_slot ON public.check_photos USING btree (daily_id, part_type) WHERE ((part_type)::text <> 'ban'::text);


--
-- TOC entry 4934 (class 1259 OID 17564)
-- Name: idx_daily_checks_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_checks_date ON public.daily_checks USING btree (check_date);


--
-- TOC entry 4935 (class 1259 OID 17566)
-- Name: idx_daily_checks_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_checks_user ON public.daily_checks USING btree (users_id);


--
-- TOC entry 4936 (class 1259 OID 17565)
-- Name: idx_daily_checks_vehicle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_checks_vehicle ON public.daily_checks USING btree (vehicle_id);


--
-- TOC entry 4945 (class 2606 OID 17559)
-- Name: check_photos check_photos_daily_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.check_photos
    ADD CONSTRAINT check_photos_daily_id_fkey FOREIGN KEY (daily_id) REFERENCES public.daily_checks(daily_id) ON DELETE CASCADE;


--
-- TOC entry 4943 (class 2606 OID 17533)
-- Name: daily_checks daily_checks_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT daily_checks_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(users_id) ON DELETE CASCADE;


--
-- TOC entry 4944 (class 2606 OID 17538)
-- Name: daily_checks daily_checks_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT daily_checks_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT;


-- Completed on 2026-07-28 13:51:56

--
-- PostgreSQL database dump complete
--

\unrestrict 2Exm9mw2Mc5VPdbHDqmQf2PVcjv7GEcPaErPTJg5l0TtShep7X5qzoVhyIg0gjI

