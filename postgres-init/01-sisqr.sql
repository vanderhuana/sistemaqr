--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.2

-- Started on 2025-10-24 23:42:31

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
-- TOC entry 5053 (class 0 OID 60789)
-- Dependencies: 221
-- Data for Name: ValidationLogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ValidationLogs" (id, "ticketId", "eventId", "validatedBy", "isValid", "validationType", "validationResult", "qrCode", "deviceInfo", location, "ipAddress", "attemptNumber", "errorDetails", "validationDuration", "validatedAt", "createdAt", "updatedAt") FROM stdin;
c5f2183b-e245-4d36-926d-213042caa6a3	\N	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	f	verification	access_denied	ENTRY-1761226810106-GWEAYWYAF	{"platform": "Linux armv81", "timestamp": "2025-10-23T13:48:27.388Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"}	Dashboard Administrativo	127.0.0.1	1	Cannot read properties of null (reading 'startDate')	13	2025-10-23 09:48:27.439-04	2025-10-23 09:48:27.44-04	2025-10-23 09:48:27.44-04
7220eedd-f22f-4c38-ac25-f3f1f1134cde	\N	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	f	verification	access_denied	ENTRY-1761226810106-GWEAYWYAF	{"platform": "Linux armv81", "timestamp": "2025-10-23T13:48:48.733Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"}	Dashboard Administrativo	127.0.0.1	1	Cannot read properties of null (reading 'startDate')	8	2025-10-23 09:48:48.827-04	2025-10-23 09:48:48.827-04	2025-10-23 09:48:48.828-04
d4d59a00-cfff-4718-b4e3-f80e0a6ea0c8	\N	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	f	verification	access_denied	ENTRY-1761225324083-G69S3MY98	{"platform": "Linux armv81", "timestamp": "2025-10-23T14:25:06.298Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"}	Dashboard Administrativo	127.0.0.1	1	Cannot read properties of null (reading 'startDate')	16	2025-10-23 10:25:06.332-04	2025-10-23 10:25:06.332-04	2025-10-23 10:25:06.333-04
e35250ff-159e-4952-bc6d-c94982a2b0c3	\N	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	f	verification	access_denied	ENTRY-1761225324068-8F3FW7SF2	{"platform": "Linux armv81", "timestamp": "2025-10-23T14:25:13.422Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"}	Dashboard Administrativo	127.0.0.1	1	Cannot read properties of null (reading 'startDate')	12	2025-10-23 10:25:13.464-04	2025-10-23 10:25:13.465-04	2025-10-23 10:25:13.465-04
49b86e53-b140-42f3-a97f-24a91b8dfaf4	4962b9f0-d260-4076-967f-e63eaddd1017	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	t	entry	success	ENTRY-1761225324175-L8N8D9K8Y	{}	\N	127.0.0.1	1	\N	26	2025-10-23 10:26:04.064-04	2025-10-23 10:26:04.064-04	2025-10-23 10:26:04.065-04
20cf0883-7d8a-461e-84fb-8b97a14970be	4962b9f0-d260-4076-967f-e63eaddd1017	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	f	entry	already_used	ENTRY-1761225324175-L8N8D9K8Y	{}	\N	127.0.0.1	1	Entrada ya fue utilizada	4	2025-10-23 10:26:08.534-04	2025-10-23 10:26:08.534-04	2025-10-23 10:26:08.535-04
545f6e42-6f5e-468b-a100-ef5ded76638e	4962b9f0-d260-4076-967f-e63eaddd1017	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	f	entry	already_used	ENTRY-1761225324175-L8N8D9K8Y	{}	\N	127.0.0.1	1	Entrada ya fue utilizada	3	2025-10-23 10:26:12.215-04	2025-10-23 10:26:12.215-04	2025-10-23 10:26:12.215-04
438ee57e-77e6-4d55-9b3f-1a7c382df092	4962b9f0-d260-4076-967f-e63eaddd1017	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	f	entry	already_used	ENTRY-1761225324175-L8N8D9K8Y	{}	\N	127.0.0.1	1	Entrada ya fue utilizada	4	2025-10-23 10:26:16.246-04	2025-10-23 10:26:16.246-04	2025-10-23 10:26:16.247-04
8281eede-0f7f-45e8-8f3e-c5feffa68c62	\N	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	f	verification	access_denied	ENTRY-1761229412577-1XYTM5PTH	{"platform": "Linux armv81", "timestamp": "2025-10-23T14:28:03.514Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"}	Dashboard Administrativo	127.0.0.1	1	Cannot read properties of null (reading 'startDate')	9	2025-10-23 10:28:03.67-04	2025-10-23 10:28:03.67-04	2025-10-23 10:28:03.67-04
3635b984-f34a-4f45-9a16-b6206472acf8	84d2c2dc-9230-4c80-a718-7df009be2e71	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	t	entry	success	ENTRY-1761229412577-1XYTM5PTH	{}	\N	127.0.0.1	1	\N	34	2025-10-23 10:47:58.123-04	2025-10-23 10:47:58.123-04	2025-10-23 10:47:58.123-04
ab87bd74-ff56-4784-a63f-3e339f796845	84d2c2dc-9230-4c80-a718-7df009be2e71	\N	bf987fb7-fc2f-4dfc-a92a-4c3699bfd394	f	entry	already_used	ENTRY-1761229412577-1XYTM5PTH	{}	\N	127.0.0.1	1	\N	13	2025-10-23 10:48:15.628-04	2025-10-23 10:48:15.628-04	2025-10-23 10:48:15.628-04
fbd34f4e-f33d-441a-8e2d-58c7036e5fe0	84d2c2dc-9230-4c80-a718-7df009be2e71	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	f	entry	already_used	ENTRY-1761229412577-1XYTM5PTH	{}	\N	127.0.0.1	1	\N	13	2025-10-23 10:48:38.61-04	2025-10-23 10:48:38.611-04	2025-10-23 10:48:38.611-04
f2c975fe-0b06-45e4-8e53-af64f4e2568c	54b46df6-de5b-4ca2-a0ca-8c90ee186cea	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	t	entry	success	ENTRY-1761229412517-X9TK4TFMK	{}	\N	127.0.0.1	1	\N	31	2025-10-23 10:48:59.708-04	2025-10-23 10:48:59.708-04	2025-10-23 10:48:59.708-04
75b76810-cfa3-4b17-a7e5-24ba73d363bb	4962b9f0-d260-4076-967f-e63eaddd1017	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	f	entry	already_used	ENTRY-1761225324175-L8N8D9K8Y	{}	\N	127.0.0.1	1	Entrada ya fue utilizada	25	2025-10-23 10:49:21.514-04	2025-10-23 10:49:21.514-04	2025-10-23 10:49:21.515-04
7c9c6946-c4d5-44fc-ba8c-725481170bb1	23a04a55-a774-4803-a501-dbe7c94e8f48	\N	c8f2fb92-e3a3-47a5-b67e-1fdaac9c68c3	t	entry	success	ENTRY-1761225324160-F0O4OSTVG	{}	\N	127.0.0.1	1	\N	39	2025-10-23 10:49:27.398-04	2025-10-23 10:49:27.398-04	2025-10-23 10:49:27.398-04
--
-- (archivo demasiado largo, contenido completo añadido)
--
