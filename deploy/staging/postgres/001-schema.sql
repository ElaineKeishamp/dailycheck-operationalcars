CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

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

CREATE TABLE public.vehicles (
    vehicle_id uuid DEFAULT gen_random_uuid() NOT NULL,
    plate_number character varying(20) NOT NULL,
    brand character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT vehicles_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);

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

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (users_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT daily_checks_pkey PRIMARY KEY (daily_id);

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT unique_vehicle_perday UNIQUE (vehicle_id, check_date);

ALTER TABLE ONLY public.check_photos
    ADD CONSTRAINT check_photos_pkey PRIMARY KEY (check_photos_id);

CREATE INDEX idx_daily_checks_date ON public.daily_checks USING btree (check_date);

CREATE INDEX idx_daily_checks_user ON public.daily_checks USING btree (users_id);

CREATE INDEX idx_daily_checks_vehicle ON public.daily_checks USING btree (vehicle_id);

CREATE INDEX idx_check_photos_daily ON public.check_photos USING btree (daily_id);

CREATE INDEX idx_check_photos_part_type ON public.check_photos USING btree (part_type);

CREATE UNIQUE INDEX unique_check_photos_daily_ban_slot ON public.check_photos USING btree (daily_id, part_type, part_index) WHERE (((part_type)::text = 'ban'::text) AND (part_index IS NOT NULL));

CREATE UNIQUE INDEX unique_check_photos_daily_non_ban_slot ON public.check_photos USING btree (daily_id, part_type) WHERE ((part_type)::text <> 'ban'::text);

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT daily_checks_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(users_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.daily_checks
    ADD CONSTRAINT daily_checks_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.check_photos
    ADD CONSTRAINT check_photos_daily_id_fkey FOREIGN KEY (daily_id) REFERENCES public.daily_checks(daily_id) ON DELETE CASCADE;
