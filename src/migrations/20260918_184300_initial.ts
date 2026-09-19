import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('uk', 'en');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_courses_level" AS ENUM('beginner', 'medium', 'advanced');
  CREATE TYPE "public"."enum_courses_access_type" AS ENUM('telegram', 'canva', 'both');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_orders_items_kind" AS ENUM('product', 'course');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid', 'partial', 'cancelled', 'refunded');
  CREATE TYPE "public"."enum_orders_delivery_method" AS ENUM('np_branch', 'np_locker', 'np_courier', 'ukrposhta');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('card', 'cod');
  CREATE TYPE "public"."enum_orders_fulfillment_status" AS ENUM('new', 'packing', 'shipped', 'done', 'cancelled');
  CREATE TYPE "public"."enum_carts_items_kind" AS ENUM('product', 'course');
  CREATE TYPE "public"."enum_customers_delivery_method" AS ENUM('np_branch', 'np_locker', 'np_courier', 'ukrposhta');
  CREATE TYPE "public"."enum_customers_payment_method" AS ENUM('card', 'cod');
  CREATE TYPE "public"."enum_customers_receipt_channel" AS ENUM('email', 'sms');
  CREATE TYPE "public"."enum_promo_codes_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_promo_codes_applies_to" AS ENUM('all', 'courses', 'products');
  CREATE TYPE "public"."enum_broadcasts_audience" AS ENUM('subscribers', 'customers', 'all');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_subscribers_source" AS ENUM('footer', 'checkout', 'manual');
  CREATE TYPE "public"."enum_settings_prepayment_type" AS ENUM('fixed', 'percent');
  CREATE TABLE "products_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color_id" integer,
  	"size_id" integer,
  	"sku" varchar,
  	"price" numeric,
  	"stock" numeric DEFAULT 0 NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"price" numeric NOT NULL,
  	"old_price" numeric,
  	"generate_stock" numeric DEFAULT 1,
  	"generate_variants" boolean DEFAULT false,
  	"stock" numeric DEFAULT 0,
  	"is_kit" boolean DEFAULT false,
  	"category_id" integer,
  	"status" "enum_products_status" DEFAULT 'draft',
  	"featured" boolean,
  	"slug" varchar,
  	"price_from" numeric,
  	"in_stock" boolean,
  	"total_stock" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"title" varchar NOT NULL,
  	"short_description" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"colors_id" integer,
  	"sizes_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"parent_id" integer,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "colors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"hex" varchar DEFAULT '#CBBFB2' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "colors_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sizes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sizes_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_lessons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"canva_url" varchar
  );
  
  CREATE TABLE "courses_lessons_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_faq_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer,
  	"price" numeric NOT NULL,
  	"old_price" numeric,
  	"level" "enum_courses_level",
  	"access_type" "enum_courses_access_type" DEFAULT 'telegram' NOT NULL,
  	"telegram_chat_id" varchar,
  	"canva_url" varchar,
  	"direction_id" integer NOT NULL,
  	"status" "enum_courses_status" DEFAULT 'draft',
  	"featured" boolean,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_locales" (
  	"title" varchar NOT NULL,
  	"tagline" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "course_directions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"image_id" integer,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "course_directions_locales" (
  	"title" varchar NOT NULL,
  	"tagline" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_orders_items_kind" NOT NULL,
  	"title" varchar NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"price" numeric NOT NULL,
  	"product_id" integer,
  	"course_id" integer,
  	"variant_id" varchar,
  	"variant_label" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar NOT NULL,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'pending',
  	"customer_id" integer,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"delivery_method" "enum_orders_delivery_method",
  	"delivery_city" varchar,
  	"delivery_branch" varchar,
  	"delivery_postcode" varchar,
  	"comment" varchar,
  	"subtotal" numeric NOT NULL,
  	"discount" numeric DEFAULT 0,
  	"delivery_cost" numeric DEFAULT 0,
  	"total" numeric NOT NULL,
  	"promo_code_id" integer,
  	"prepaid_amount" numeric DEFAULT 0,
  	"payment_method" "enum_orders_payment_method",
  	"payment_reference" varchar,
  	"fiscal_receipt" varchar,
  	"fulfillment_status" "enum_orders_fulfillment_status" DEFAULT 'new',
  	"tracking_number" varchar,
  	"access_granted" boolean,
  	"meta_fbp" varchar,
  	"meta_fbc" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "carts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_carts_items_kind" NOT NULL,
  	"item_id" varchar NOT NULL,
  	"variant_id" varchar,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "carts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"customer_id" integer,
  	"email" varchar,
  	"reminder_sent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers_access" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"related_order_id" integer,
  	"granted_at" timestamp(3) with time zone,
  	"telegram_invite_link" varchar
  );
  
  CREATE TABLE "customers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"phone" varchar,
  	"delivery_method" "enum_customers_delivery_method",
  	"delivery_city" varchar,
  	"delivery_branch" varchar,
  	"payment_method" "enum_customers_payment_method",
  	"receipt_channel" "enum_customers_receipt_channel" DEFAULT 'email',
  	"card_mask" varchar,
  	"subscribed_to_newsletter" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "customers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "promo_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"type" "enum_promo_codes_type" DEFAULT 'percent' NOT NULL,
  	"value" numeric NOT NULL,
  	"applies_to" "enum_promo_codes_applies_to" DEFAULT 'all',
  	"valid_from" timestamp(3) with time zone,
  	"valid_until" timestamp(3) with time zone,
  	"usage_limit" numeric,
  	"min_order_total" numeric,
  	"used_count" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "broadcasts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"audience" "enum_broadcasts_audience" DEFAULT 'subscribers',
  	"also_telegram" boolean DEFAULT false,
  	"send" boolean DEFAULT false,
  	"sent_at" timestamp(3) with time zone,
  	"sent_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author_name" varchar NOT NULL,
  	"city" varchar,
  	"rating" numeric DEFAULT 5 NOT NULL,
  	"text" varchar NOT NULL,
  	"product_id" integer,
  	"course_id" integer,
  	"status" "enum_reviews_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"cover_id" integer,
  	"og_image_id" integer,
  	"status" "enum_pages_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar NOT NULL,
  	"intro" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"cover_id" integer,
  	"og_image_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_posts_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"source" "enum_subscribers_source" DEFAULT 'footer',
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"categories_id" integer,
  	"colors_id" integer,
  	"sizes_id" integer,
  	"courses_id" integer,
  	"course_directions_id" integer,
  	"orders_id" integer,
  	"carts_id" integer,
  	"customers_id" integer,
  	"promo_codes_id" integer,
  	"broadcasts_id" integer,
  	"reviews_id" integer,
  	"pages_id" integer,
  	"posts_id" integer,
  	"subscribers_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"customers_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "about_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "about_values_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_locales" (
  	"label" varchar,
  	"title" varchar NOT NULL,
  	"lead" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_media_id" integer,
  	"phone" varchar,
  	"email" varchar,
  	"instagram" varchar,
  	"telegram" varchar,
  	"free_delivery_from" numeric,
  	"prepayment_type" "enum_settings_prepayment_type" DEFAULT 'fixed',
  	"prepayment_amount" numeric DEFAULT 200,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"announcement" varchar,
  	"hero_title" varchar,
  	"hero_subtitle" varchar,
  	"delivery_info" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_size_id_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."sizes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_colors_fk" FOREIGN KEY ("colors_id") REFERENCES "public"."colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_sizes_fk" FOREIGN KEY ("sizes_id") REFERENCES "public"."sizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "colors_locales" ADD CONSTRAINT "colors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sizes_locales" ADD CONSTRAINT "sizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_lessons" ADD CONSTRAINT "courses_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_lessons_locales" ADD CONSTRAINT "courses_lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_faq" ADD CONSTRAINT "courses_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_faq_locales" ADD CONSTRAINT "courses_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_direction_id_course_directions_id_fk" FOREIGN KEY ("direction_id") REFERENCES "public"."course_directions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_directions" ADD CONSTRAINT "course_directions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_directions_locales" ADD CONSTRAINT "course_directions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "customers_access" ADD CONSTRAINT "customers_access_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "customers_access" ADD CONSTRAINT "customers_access_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "customers_access" ADD CONSTRAINT "customers_access_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_sessions" ADD CONSTRAINT "customers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_rels" ADD CONSTRAINT "customers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_rels" ADD CONSTRAINT "customers_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_rels" ADD CONSTRAINT "customers_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews_rels" ADD CONSTRAINT "reviews_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews_rels" ADD CONSTRAINT "reviews_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_texts" ADD CONSTRAINT "posts_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_colors_fk" FOREIGN KEY ("colors_id") REFERENCES "public"."colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sizes_fk" FOREIGN KEY ("sizes_id") REFERENCES "public"."sizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_directions_fk" FOREIGN KEY ("course_directions_id") REFERENCES "public"."course_directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_fk" FOREIGN KEY ("carts_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promo_codes_fk" FOREIGN KEY ("promo_codes_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_broadcasts_fk" FOREIGN KEY ("broadcasts_id") REFERENCES "public"."broadcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_values" ADD CONSTRAINT "about_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_values_locales" ADD CONSTRAINT "about_values_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about" ADD CONSTRAINT "about_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_locales" ADD CONSTRAINT "about_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_variants_order_idx" ON "products_variants" USING btree ("_order");
  CREATE INDEX "products_variants_parent_id_idx" ON "products_variants" USING btree ("_parent_id");
  CREATE INDEX "products_variants_color_idx" ON "products_variants" USING btree ("color_id");
  CREATE INDEX "products_variants_size_idx" ON "products_variants" USING btree ("size_id");
  CREATE INDEX "products_variants_image_idx" ON "products_variants" USING btree ("image_id");
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX "products_status_idx" ON "products" USING btree ("status");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_price_from_idx" ON "products" USING btree ("price_from");
  CREATE INDEX "products_in_stock_idx" ON "products" USING btree ("in_stock");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "products_rels_colors_id_idx" ON "products_rels" USING btree ("colors_id");
  CREATE INDEX "products_rels_sizes_id_idx" ON "products_rels" USING btree ("sizes_id");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "colors_slug_idx" ON "colors" USING btree ("slug");
  CREATE INDEX "colors_updated_at_idx" ON "colors" USING btree ("updated_at");
  CREATE INDEX "colors_created_at_idx" ON "colors" USING btree ("created_at");
  CREATE UNIQUE INDEX "colors_locales_locale_parent_id_unique" ON "colors_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "sizes_slug_idx" ON "sizes" USING btree ("slug");
  CREATE INDEX "sizes_updated_at_idx" ON "sizes" USING btree ("updated_at");
  CREATE INDEX "sizes_created_at_idx" ON "sizes" USING btree ("created_at");
  CREATE UNIQUE INDEX "sizes_locales_locale_parent_id_unique" ON "sizes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_lessons_order_idx" ON "courses_lessons" USING btree ("_order");
  CREATE INDEX "courses_lessons_parent_id_idx" ON "courses_lessons" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_lessons_locales_locale_parent_id_unique" ON "courses_lessons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_faq_order_idx" ON "courses_faq" USING btree ("_order");
  CREATE INDEX "courses_faq_parent_id_idx" ON "courses_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_faq_locales_locale_parent_id_unique" ON "courses_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_cover_idx" ON "courses" USING btree ("cover_id");
  CREATE INDEX "courses_direction_idx" ON "courses" USING btree ("direction_id");
  CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_media_id_idx" ON "courses_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "course_directions_slug_idx" ON "course_directions" USING btree ("slug");
  CREATE INDEX "course_directions_image_idx" ON "course_directions" USING btree ("image_id");
  CREATE INDEX "course_directions_updated_at_idx" ON "course_directions" USING btree ("updated_at");
  CREATE INDEX "course_directions_created_at_idx" ON "course_directions" USING btree ("created_at");
  CREATE UNIQUE INDEX "course_directions_locales_locale_parent_id_unique" ON "course_directions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_items_course_idx" ON "orders_items" USING btree ("course_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_promo_code_idx" ON "orders" USING btree ("promo_code_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "carts_items_order_idx" ON "carts_items" USING btree ("_order");
  CREATE INDEX "carts_items_parent_id_idx" ON "carts_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "carts_token_idx" ON "carts" USING btree ("token");
  CREATE INDEX "carts_customer_idx" ON "carts" USING btree ("customer_id");
  CREATE INDEX "carts_updated_at_idx" ON "carts" USING btree ("updated_at");
  CREATE INDEX "carts_created_at_idx" ON "carts" USING btree ("created_at");
  CREATE INDEX "customers_access_order_idx" ON "customers_access" USING btree ("_order");
  CREATE INDEX "customers_access_parent_id_idx" ON "customers_access" USING btree ("_parent_id");
  CREATE INDEX "customers_access_course_idx" ON "customers_access" USING btree ("course_id");
  CREATE INDEX "customers_access_related_order_idx" ON "customers_access" USING btree ("related_order_id");
  CREATE INDEX "customers_sessions_order_idx" ON "customers_sessions" USING btree ("_order");
  CREATE INDEX "customers_sessions_parent_id_idx" ON "customers_sessions" USING btree ("_parent_id");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE INDEX "customers_rels_order_idx" ON "customers_rels" USING btree ("order");
  CREATE INDEX "customers_rels_parent_idx" ON "customers_rels" USING btree ("parent_id");
  CREATE INDEX "customers_rels_path_idx" ON "customers_rels" USING btree ("path");
  CREATE INDEX "customers_rels_courses_id_idx" ON "customers_rels" USING btree ("courses_id");
  CREATE INDEX "customers_rels_products_id_idx" ON "customers_rels" USING btree ("products_id");
  CREATE UNIQUE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");
  CREATE INDEX "promo_codes_updated_at_idx" ON "promo_codes" USING btree ("updated_at");
  CREATE INDEX "promo_codes_created_at_idx" ON "promo_codes" USING btree ("created_at");
  CREATE INDEX "broadcasts_updated_at_idx" ON "broadcasts" USING btree ("updated_at");
  CREATE INDEX "broadcasts_created_at_idx" ON "broadcasts" USING btree ("created_at");
  CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");
  CREATE INDEX "reviews_course_idx" ON "reviews" USING btree ("course_id");
  CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "reviews_rels_order_idx" ON "reviews_rels" USING btree ("order");
  CREATE INDEX "reviews_rels_parent_idx" ON "reviews_rels" USING btree ("parent_id");
  CREATE INDEX "reviews_rels_path_idx" ON "reviews_rels" USING btree ("path");
  CREATE INDEX "reviews_rels_media_id_idx" ON "reviews_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_cover_idx" ON "pages" USING btree ("cover_id");
  CREATE INDEX "pages_og_image_idx" ON "pages" USING btree ("og_image_id");
  CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_cover_idx" ON "posts" USING btree ("cover_id");
  CREATE INDEX "posts_og_image_idx" ON "posts" USING btree ("og_image_id");
  CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_texts_order_parent" ON "posts_texts" USING btree ("order","parent_id");
  CREATE INDEX "posts_texts_locale_parent" ON "posts_texts" USING btree ("locale","parent_id");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_products_id_idx" ON "posts_rels" USING btree ("products_id");
  CREATE INDEX "posts_rels_courses_id_idx" ON "posts_rels" USING btree ("courses_id");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_colors_id_idx" ON "payload_locked_documents_rels" USING btree ("colors_id");
  CREATE INDEX "payload_locked_documents_rels_sizes_id_idx" ON "payload_locked_documents_rels" USING btree ("sizes_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_course_directions_id_idx" ON "payload_locked_documents_rels" USING btree ("course_directions_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_carts_id_idx" ON "payload_locked_documents_rels" USING btree ("carts_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_promo_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("promo_codes_id");
  CREATE INDEX "payload_locked_documents_rels_broadcasts_id_idx" ON "payload_locked_documents_rels" USING btree ("broadcasts_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_customers_id_idx" ON "payload_preferences_rels" USING btree ("customers_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "about_values_order_idx" ON "about_values" USING btree ("_order");
  CREATE INDEX "about_values_parent_id_idx" ON "about_values" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_values_locales_locale_parent_id_unique" ON "about_values_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_photo_idx" ON "about" USING btree ("photo_id");
  CREATE UNIQUE INDEX "about_locales_locale_parent_id_unique" ON "about_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "settings_hero_media_idx" ON "settings" USING btree ("hero_media_id");
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_variants" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "colors" CASCADE;
  DROP TABLE "colors_locales" CASCADE;
  DROP TABLE "sizes" CASCADE;
  DROP TABLE "sizes_locales" CASCADE;
  DROP TABLE "courses_lessons" CASCADE;
  DROP TABLE "courses_lessons_locales" CASCADE;
  DROP TABLE "courses_faq" CASCADE;
  DROP TABLE "courses_faq_locales" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_locales" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "course_directions" CASCADE;
  DROP TABLE "course_directions_locales" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "carts_items" CASCADE;
  DROP TABLE "carts" CASCADE;
  DROP TABLE "customers_access" CASCADE;
  DROP TABLE "customers_sessions" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "customers_rels" CASCADE;
  DROP TABLE "promo_codes" CASCADE;
  DROP TABLE "broadcasts" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "reviews_rels" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "posts_texts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "about_values" CASCADE;
  DROP TABLE "about_values_locales" CASCADE;
  DROP TABLE "about" CASCADE;
  DROP TABLE "about_locales" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_courses_level";
  DROP TYPE "public"."enum_courses_access_type";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum_orders_items_kind";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_delivery_method";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_fulfillment_status";
  DROP TYPE "public"."enum_carts_items_kind";
  DROP TYPE "public"."enum_customers_delivery_method";
  DROP TYPE "public"."enum_customers_payment_method";
  DROP TYPE "public"."enum_customers_receipt_channel";
  DROP TYPE "public"."enum_promo_codes_type";
  DROP TYPE "public"."enum_promo_codes_applies_to";
  DROP TYPE "public"."enum_broadcasts_audience";
  DROP TYPE "public"."enum_reviews_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum_subscribers_source";
  DROP TYPE "public"."enum_settings_prepayment_type";`)
}
