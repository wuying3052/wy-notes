--
-- PostgreSQL database dump
--

\restrict CmbDyYPbnmgJcrSLvOeWXubmnxlNjPa5KU0xgWtvg5VBqHNTqjSAp2Hen9Qe8uU

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "public";


--
-- Name: cleanup_soft_deleted_records(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."cleanup_soft_deleted_records"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM articles WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM projects WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM resources WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM comments WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, role, status)
    VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'name', NEW.email), 'user', 'pending')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


--
-- Name: is_active_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."is_active_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    );
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin') 
        AND status = 'active'
    );
END;
$$;


--
-- Name: log_operation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."log_operation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    sys_action VARCHAR(50);
    sys_details JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        sys_action := 'CREATE';
        sys_details := jsonb_build_object('new', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            sys_action := 'DELETE';
        ELSIF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
            sys_action := 'RESTORE';
        ELSE
            sys_action := 'UPDATE';
        END IF;
        sys_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        sys_action := 'PURGE';
        sys_details := jsonb_build_object('old', row_to_json(OLD));
    END IF;

    INSERT INTO logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), sys_action, TG_TABLE_NAME, coalesce(NEW.id, OLD.id), sys_details);

    RETURN NULL;
END;
$$;


--
-- Name: set_audit_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."set_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        NEW.created_by = auth.uid();
    END IF;
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


--
-- Name: sync_article_category(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."sync_article_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        SELECT name INTO NEW.category FROM public.categories
        WHERE id = NEW.category_id AND kind = 'article';
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: sync_resource_category(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."sync_resource_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        SELECT name INTO NEW.category FROM public.categories
        WHERE id = NEW.category_id AND kind = 'resource';
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "cover_image" "text",
    "category_id" "uuid",
    "category" character varying(100),
    "tags" "text"[],
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "categories_kind_check" CHECK (("kind" = ANY (ARRAY['article'::"text", 'resource'::"text"])))
);


--
-- Name: articles_with_category; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."articles_with_category" AS
 SELECT "a"."id",
    "a"."title",
    "a"."slug",
    "a"."excerpt",
    "a"."content",
    "a"."cover_image",
    "a"."category_id",
    "a"."category",
    "a"."tags",
    "a"."published",
    "a"."published_at",
    "a"."created_by",
    "a"."updated_by",
    "a"."deleted_at",
    "a"."created_at",
    "a"."updated_at",
    "c"."name" AS "category_name"
   FROM ("public"."articles" "a"
     LEFT JOIN "public"."categories" "c" ON (("a"."category_id" = "c"."id")));


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(50) NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'creator'::"text", 'admin'::"text", 'super_admin'::"text"]))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text"])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "long_description" "text",
    "cover_image" "text",
    "client" "text",
    "year" integer,
    "tags" "text"[],
    "demo_url" character varying(500),
    "repo_url" character varying(500),
    "display_order" integer DEFAULT 0,
    "published" boolean DEFAULT false,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "url" character varying(500) NOT NULL,
    "icon" "text",
    "category_id" "uuid",
    "category" character varying(100),
    "tags" "text"[],
    "display_order" integer DEFAULT 0,
    "created_by" "uuid",
    "updated_by" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: resources_with_category; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW "public"."resources_with_category" AS
 SELECT "r"."id",
    "r"."title",
    "r"."description",
    "r"."url",
    "r"."icon",
    "r"."category_id",
    "r"."category",
    "r"."tags",
    "r"."display_order",
    "r"."created_by",
    "r"."updated_by",
    "r"."deleted_at",
    "r"."created_at",
    "r"."updated_at",
    "c"."name" AS "category_name"
   FROM ("public"."resources" "r"
     LEFT JOIN "public"."categories" "c" ON (("r"."category_id" = "c"."id")));


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."articles" ("id", "title", "slug", "excerpt", "content", "cover_image", "category_id", "category", "tags", "published", "published_at", "created_by", "updated_by", "deleted_at", "created_at", "updated_at") FROM stdin;
203bed45-afd1-421b-a878-acd64bb2bb8e	欢迎来到我的数字花园	welcome-to-my-digital-garden	记录分享的初衷。	# Hello World	https://prwgljpabykyabejpgue.supabase.co/storage/v1/object/public/wyNotes/alqm5mqtn8j_1769272371898.jpg	b1244eed-e098-40cc-88b8-779fd516f588	碎碎念	{first}	t	2026-01-24 16:33:19.032+00	43a63ed6-b668-403a-91ec-c36b64499a6f	\N	\N	2026-01-24 16:03:58.260971+00	2026-01-25 06:42:17.610205+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."categories" ("id", "kind", "name", "display_order", "created_at", "updated_at") FROM stdin;
a90c7a1c-3058-47f1-a793-e383a30058d0	article	前端开发	1	2026-01-24 16:03:57.749453+00	2026-01-24 16:03:57.749453+00
789563e6-e25c-4b2a-bfd6-fe2c92010436	article	后端架构	2	2026-01-24 16:03:57.749453+00	2026-01-24 16:03:57.749453+00
24de5dff-5157-4005-bce3-d4aacd612d5d	article	全栈技术	3	2026-01-24 16:03:57.749453+00	2026-01-24 16:03:57.749453+00
b1244eed-e098-40cc-88b8-779fd516f588	article	碎碎念	4	2026-01-24 16:03:57.749453+00	2026-01-24 16:03:57.749453+00
51615b53-31a3-4bfd-ab3a-ef413dfb4340	article	面试指南	5	2026-01-24 16:03:57.749453+00	2026-01-24 16:03:57.749453+00
334e6c44-530b-4cc8-8cc2-1df208e131cf	article	工具推荐	6	2026-01-24 16:03:57.749453+00	2026-01-24 16:03:57.749453+00
668d7024-110e-4129-8ea7-274e80dcd164	resource	开发工具	1	2026-01-24 16:03:57.954698+00	2026-01-24 16:03:57.954698+00
5a70755e-b2ed-4c78-8dc8-db375d7c07bc	resource	设计资源	2	2026-01-24 16:03:57.954698+00	2026-01-24 16:03:57.954698+00
75f2a395-252e-4924-abfd-98770a69c7c1	resource	在线学习	3	2026-01-24 16:03:57.954698+00	2026-01-24 16:03:57.954698+00
23ae5ea3-13e8-46e6-8db9-ec9cf057cd9e	resource	开源库	4	2026-01-24 16:03:57.954698+00	2026-01-24 16:03:57.954698+00
e02649e3-f1b3-4442-aa70-40669c88b3b8	resource	实用网站	5	2026-01-24 16:03:57.954698+00	2026-01-24 16:03:57.954698+00
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."comments" ("id", "article_id", "author_id", "parent_id", "content", "deleted_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."logs" ("id", "user_id", "action", "entity_type", "entity_id", "details", "ip_address", "user_agent", "created_at") FROM stdin;
5564bb32-1c6d-409c-89e9-53d9a4553297	\N	CREATE	articles	203bed45-afd1-421b-a878-acd64bb2bb8e	{"new": {"id": "203bed45-afd1-421b-a878-acd64bb2bb8e", "slug": "welcome-to-my-digital-garden", "tags": null, "title": "欢迎来到我的数字花园", "content": "# Hello World", "excerpt": "记录分享的初衷。", "category": "碎碎念", "published": true, "created_at": "2026-01-24T16:03:58.260971+00:00", "created_by": null, "deleted_at": null, "updated_at": "2026-01-24T16:03:58.260971+00:00", "updated_by": null, "category_id": "b1244eed-e098-40cc-88b8-779fd516f588", "cover_image": null, "published_at": "2026-01-24T16:03:58.260971+00:00"}}	\N	\N	2026-01-24 16:03:58.260971+00
f29017f6-4ede-4a02-8c7a-2ae0bf8448ea	43a63ed6-b668-403a-91ec-c36b64499a6f	UPDATE	articles	203bed45-afd1-421b-a878-acd64bb2bb8e	{"new": {"id": "203bed45-afd1-421b-a878-acd64bb2bb8e", "slug": "welcome-to-my-digital-garden", "tags": ["first"], "title": "欢迎来到我的数字花园", "content": "# Hello World", "excerpt": "记录分享的初衷。", "category": "碎碎念", "published": true, "created_at": "2026-01-24T16:03:58.260971+00:00", "created_by": null, "deleted_at": null, "updated_at": "2026-01-24T16:33:18.85017+00:00", "updated_by": "43a63ed6-b668-403a-91ec-c36b64499a6f", "category_id": "b1244eed-e098-40cc-88b8-779fd516f588", "cover_image": "https://prwgljpabykyabejpgue.supabase.co/storage/v1/object/public/wyNotes/alqm5mqtn8j_1769272371898.jpg", "published_at": "2026-01-24T16:33:19.032+00:00"}, "old": {"id": "203bed45-afd1-421b-a878-acd64bb2bb8e", "slug": "welcome-to-my-digital-garden", "tags": null, "title": "欢迎来到我的数字花园", "content": "# Hello World", "excerpt": "记录分享的初衷。", "category": "碎碎念", "published": true, "created_at": "2026-01-24T16:03:58.260971+00:00", "created_by": null, "deleted_at": null, "updated_at": "2026-01-24T16:03:58.260971+00:00", "updated_by": null, "category_id": "b1244eed-e098-40cc-88b8-779fd516f588", "cover_image": null, "published_at": "2026-01-24T16:03:58.260971+00:00"}}	\N	\N	2026-01-24 16:33:18.85017+00
2fc5c381-f837-4369-8256-92be6ea7e5ca	\N	UPDATE	articles	203bed45-afd1-421b-a878-acd64bb2bb8e	{"new": {"id": "203bed45-afd1-421b-a878-acd64bb2bb8e", "slug": "welcome-to-my-digital-garden", "tags": ["first"], "title": "欢迎来到我的数字花园", "content": "# Hello World", "excerpt": "记录分享的初衷。", "category": "碎碎念", "published": true, "created_at": "2026-01-24T16:03:58.260971+00:00", "created_by": "43a63ed6-b668-403a-91ec-c36b64499a6f", "deleted_at": null, "updated_at": "2026-01-25T06:42:17.610205+00:00", "updated_by": null, "category_id": "b1244eed-e098-40cc-88b8-779fd516f588", "cover_image": "https://prwgljpabykyabejpgue.supabase.co/storage/v1/object/public/wyNotes/alqm5mqtn8j_1769272371898.jpg", "published_at": "2026-01-24T16:33:19.032+00:00"}, "old": {"id": "203bed45-afd1-421b-a878-acd64bb2bb8e", "slug": "welcome-to-my-digital-garden", "tags": ["first"], "title": "欢迎来到我的数字花园", "content": "# Hello World", "excerpt": "记录分享的初衷。", "category": "碎碎念", "published": true, "created_at": "2026-01-24T16:03:58.260971+00:00", "created_by": null, "deleted_at": null, "updated_at": "2026-01-24T16:33:18.85017+00:00", "updated_by": "43a63ed6-b668-403a-91ec-c36b64499a6f", "category_id": "b1244eed-e098-40cc-88b8-779fd516f588", "cover_image": "https://prwgljpabykyabejpgue.supabase.co/storage/v1/object/public/wyNotes/alqm5mqtn8j_1769272371898.jpg", "published_at": "2026-01-24T16:33:19.032+00:00"}}	\N	\N	2026-01-25 06:42:17.610205+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."profiles" ("user_id", "display_name", "avatar_url", "role", "status", "created_at", "updated_at") FROM stdin;
43a63ed6-b668-403a-91ec-c36b64499a6f	wuying	https://prwgljpabykyabejpgue.supabase.co/storage/v1/object/public/wyNotes/avatars/43a63ed6-b668-403a-91ec-c36b64499a6f/i12vmnezo3_1769272174072.bin	super_admin	active	2026-01-24 16:03:58.056538+00	2026-01-24 16:29:34.480284+00
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."projects" ("id", "title", "slug", "description", "long_description", "cover_image", "client", "year", "tags", "demo_url", "repo_url", "display_order", "published", "created_by", "updated_by", "deleted_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."resources" ("id", "title", "description", "url", "icon", "category_id", "category", "tags", "display_order", "created_by", "updated_by", "deleted_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");


--
-- Name: projects projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_slug_key" UNIQUE ("slug");


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");


--
-- Name: idx_articles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_articles_slug" ON "public"."articles" USING "btree" ("slug");


--
-- Name: idx_categories_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_categories_kind" ON "public"."categories" USING "btree" ("kind");


--
-- Name: idx_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_logs_created_at" ON "public"."logs" USING "btree" ("created_at" DESC);


--
-- Name: idx_projects_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_projects_slug" ON "public"."projects" USING "btree" ("slug");


--
-- Name: articles tr_articles_audit_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_articles_audit_fields" BEFORE INSERT OR UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."set_audit_fields"();


--
-- Name: articles tr_articles_cat_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_articles_cat_sync" BEFORE INSERT OR UPDATE OF "category_id" ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_article_category"();


--
-- Name: articles tr_articles_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_articles_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."log_operation"();


--
-- Name: articles tr_articles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_articles_updated" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: categories tr_categories_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_categories_updated" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: comments tr_comments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_comments_updated" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: profiles tr_profiles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: projects tr_projects_audit_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_projects_audit_fields" BEFORE INSERT OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_audit_fields"();


--
-- Name: projects tr_projects_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_projects_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."log_operation"();


--
-- Name: projects tr_projects_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_projects_updated" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: resources tr_resources_audit_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_resources_audit_fields" BEFORE INSERT OR UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."set_audit_fields"();


--
-- Name: resources tr_resources_cat_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_resources_cat_sync" BEFORE INSERT OR UPDATE OF "category_id" ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."sync_resource_category"();


--
-- Name: resources tr_resources_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_resources_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."log_operation"();


--
-- Name: resources tr_resources_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "tr_resources_updated" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();


--
-- Name: articles articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;


--
-- Name: articles articles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: articles articles_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: comments comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;


--
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: projects projects_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: resources resources_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;


--
-- Name: resources resources_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: resources resources_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: articles Admin manage articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage articles" ON "public"."articles" TO "authenticated" USING ("public"."is_admin"());


--
-- Name: categories Admin manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage categories" ON "public"."categories" TO "authenticated" USING ("public"."is_admin"());


--
-- Name: profiles Admin manage profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"());


--
-- Name: projects Admin manage projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage projects" ON "public"."projects" TO "authenticated" USING ("public"."is_admin"());


--
-- Name: resources Admin manage resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage resources" ON "public"."resources" TO "authenticated" USING ("public"."is_admin"());


--
-- Name: logs Admin read logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin read logs" ON "public"."logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());


--
-- Name: comments Auth insert comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth insert comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: comments Owner delete comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "author_id") OR "public"."is_admin"()));


--
-- Name: profiles Public read active profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active profiles" ON "public"."profiles" FOR SELECT USING ((("status" = 'active'::"text") OR ("auth"."uid"() = "user_id")));


--
-- Name: categories Public read categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read categories" ON "public"."categories" FOR SELECT USING (true);


--
-- Name: comments Public read comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read comments" ON "public"."comments" FOR SELECT USING (("deleted_at" IS NULL));


--
-- Name: articles Public read published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published articles" ON "public"."articles" FOR SELECT USING ((("published" = true) AND ("deleted_at" IS NULL)));


--
-- Name: projects Public read published projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published projects" ON "public"."projects" FOR SELECT USING ((("published" = true) AND ("deleted_at" IS NULL)));


--
-- Name: resources Public read resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read resources" ON "public"."resources" FOR SELECT USING (("deleted_at" IS NULL));


--
-- Name: logs System insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System insert logs" ON "public"."logs" FOR INSERT TO "authenticated" WITH CHECK (true);


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

--
-- Name: logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

--
-- Name: resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict CmbDyYPbnmgJcrSLvOeWXubmnxlNjPa5KU0xgWtvg5VBqHNTqjSAp2Hen9Qe8uU

