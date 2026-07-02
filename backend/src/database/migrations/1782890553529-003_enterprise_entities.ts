import { MigrationInterface, QueryRunner } from "typeorm";

export class EnterpriseEntities1782890553529 implements MigrationInterface {
    name = 'EnterpriseEntities1782890553529';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Countries
        await queryRunner.query(`
            CREATE TABLE "countries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "code" character varying(5) NOT NULL,
                "flag" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_countries" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_countries_code" UNIQUE ("code")
            )
        `);

        // Permissions
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "resource" character varying(100) NOT NULL,
                "action" character varying(50) NOT NULL,
                "description" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_permissions_name" UNIQUE ("name")
            )
        `);

        // Roles
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(50) NOT NULL,
                "description" character varying(255),
                "is_system" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_roles_name" UNIQUE ("name")
            )
        `);

        // Departments
        await queryRunner.query(`
            CREATE TABLE "departments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "country_id" uuid NOT NULL,
                "code" character varying(20),
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_departments" PRIMARY KEY ("id")
            )
        `);

        // Cities
        await queryRunner.query(`
            CREATE TABLE "cities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "department_id" uuid NOT NULL,
                "code" character varying(20),
                "latitude" double precision,
                "longitude" double precision,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_cities" PRIMARY KEY ("id")
            )
        `);

        // Role_Permissions (junction)
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
            )
        `);

        // API Keys
        await queryRunner.query(`
            CREATE TABLE "api_keys" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "key" character varying(255) NOT NULL,
                "user_id" uuid,
                "client_id" character varying(255),
                "is_active" boolean NOT NULL DEFAULT true,
                "rate_limit" integer NOT NULL DEFAULT 1000,
                "allowed_ips" jsonb,
                "expires_at" TIMESTAMP,
                "last_used_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_api_keys" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_api_keys_key" UNIQUE ("key")
            )
        `);

        // AI Models
        await queryRunner.query(`
            CREATE TABLE "ai_models" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "type" character varying(30) NOT NULL,
                "version" character varying(20) NOT NULL,
                "status" character varying(20) NOT NULL,
                "accuracy" double precision,
                "parameters" jsonb,
                "metrics" jsonb,
                "trained_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_ai_models" PRIMARY KEY ("id")
            )
        `);

        // Alert Configs
        await queryRunner.query(`
            CREATE TABLE "alert_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "metric" character varying(50) NOT NULL,
                "operator" character varying(5) NOT NULL,
                "threshold" double precision NOT NULL,
                "duration" integer NOT NULL DEFAULT 300,
                "channels" jsonb NOT NULL DEFAULT '["email"]',
                "is_active" boolean NOT NULL DEFAULT true,
                "cooldown" integer NOT NULL DEFAULT 3600,
                "last_triggered_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_alert_configs" PRIMARY KEY ("id")
            )
        `);

        // Advertisements
        await queryRunner.query(`
            CREATE TABLE "advertisements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "type" character varying(20) NOT NULL,
                "platform" character varying(30) NOT NULL,
                "code" text,
                "image_url" character varying(500),
                "link_url" character varying(500),
                "width" integer,
                "height" integer,
                "is_active" boolean NOT NULL DEFAULT true,
                "start_date" TIMESTAMP,
                "end_date" TIMESTAMP,
                "total_clicks" integer NOT NULL DEFAULT 0,
                "total_impressions" integer NOT NULL DEFAULT 0,
                "ctr" double precision NOT NULL DEFAULT 0,
                "revenue" double precision NOT NULL DEFAULT 0,
                "daily_revenue" jsonb,
                "monthly_revenue" jsonb,
                "campaign_name" character varying(255),
                "budget" double precision,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_advertisements" PRIMARY KEY ("id")
            )
        `);

        // RINEX Statistics
        await queryRunner.query(`
            CREATE TABLE "rinex_statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "date" date NOT NULL,
                "total_files" integer NOT NULL,
                "by_version" jsonb NOT NULL,
                "by_constellation" jsonb NOT NULL,
                "total_observations" integer NOT NULL,
                "total_epochs" integer NOT NULL,
                "total_satellites" integer NOT NULL,
                "avg_satellites" double precision NOT NULL,
                "max_simultaneous" integer NOT NULL,
                "avg_interval" double precision NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_rinex_statistics" PRIMARY KEY ("id")
            )
        `);

        // Quality Scores
        await queryRunner.query(`
            CREATE TABLE "quality_scores" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "processing_id" uuid,
                "file_name" character varying(255) NOT NULL,
                "score" double precision NOT NULL,
                "category" character varying(20) NOT NULL,
                "observations" integer NOT NULL,
                "epochs" integer NOT NULL,
                "satellites" integer NOT NULL,
                "gaps" integer,
                "multipath" double precision,
                "snr" double precision,
                "completeness" double precision,
                "issues" jsonb,
                "recommendations" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_quality_scores" PRIMARY KEY ("id")
            )
        `);

        // Anomaly Detections
        await queryRunner.query(`
            CREATE TABLE "anomaly_detections" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying(30) NOT NULL,
                "entity_id" uuid,
                "value" double precision NOT NULL,
                "expected_min" double precision NOT NULL,
                "expected_max" double precision NOT NULL,
                "deviation" double precision NOT NULL,
                "severity" character varying(10) NOT NULL,
                "detected_at" TIMESTAMP NOT NULL,
                "resolved_at" TIMESTAMP,
                "details" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_anomaly_detections" PRIMARY KEY ("id")
            )
        `);

        // Processing Statistics
        await queryRunner.query(`
            CREATE TABLE "processing_statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "date" date NOT NULL,
                "total_processings" integer NOT NULL DEFAULT 0,
                "success_count" integer NOT NULL DEFAULT 0,
                "error_count" integer NOT NULL DEFAULT 0,
                "total_time" double precision NOT NULL DEFAULT 0,
                "avg_time" double precision NOT NULL DEFAULT 0,
                "total_observations" integer NOT NULL DEFAULT 0,
                "total_epochs" integer NOT NULL DEFAULT 0,
                "total_files" integer NOT NULL DEFAULT 0,
                "by_module" jsonb,
                "by_rinex_version" jsonb,
                "by_constellation" jsonb,
                "by_country" jsonb,
                "by_city" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_processing_statistics" PRIMARY KEY ("id")
            )
        `);

        // Processing History
        await queryRunner.query(`
            CREATE TABLE "processing_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "file_name" character varying(255) NOT NULL,
                "file_type" character varying(20) NOT NULL,
                "file_version" character varying(10),
                "file_size" bigint,
                "duration" integer,
                "constellations" jsonb,
                "observations" integer NOT NULL DEFAULT 0,
                "epochs" integer NOT NULL DEFAULT 0,
                "avg_satellites" double precision,
                "max_simultaneous" integer,
                "receiver" character varying(255),
                "antenna" character varying(255),
                "interval" double precision,
                "result" text,
                "time" double precision,
                "status" character varying(20) NOT NULL,
                "errors" text,
                "is_ppp" boolean NOT NULL DEFAULT false,
                "station_id" uuid,
                "country" character varying(100),
                "department" character varying(100),
                "city" character varying(100),
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_processing_history" PRIMARY KEY ("id")
            )
        `);

        // Activity Logs
        await queryRunner.query(`
            CREATE TABLE "activity_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "action" character varying(50) NOT NULL,
                "entity" character varying(100),
                "entity_id" character varying(50),
                "details" jsonb,
                "ip" character varying(45),
                "user_agent" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id")
            )
        `);

        // AI Predictions
        await queryRunner.query(`
            CREATE TABLE "ai_predictions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "model_id" uuid NOT NULL,
                "type" character varying(50) NOT NULL,
                "input_data" jsonb NOT NULL,
                "output_data" jsonb NOT NULL,
                "confidence" double precision,
                "status" character varying(20) NOT NULL,
                "processing_time" double precision,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_ai_predictions" PRIMARY KEY ("id")
            )
        `);

        // User Visits
        await queryRunner.query(`
            CREATE TABLE "user_visits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "page" character varying(255) NOT NULL,
                "referrer" text,
                "ip" character varying(45) NOT NULL,
                "user_agent" text NOT NULL,
                "duration" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_user_visits" PRIMARY KEY ("id")
            )
        `);

        // System Configurations
        await queryRunner.query(`
            CREATE TABLE "system_configurations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "key" character varying(100) NOT NULL,
                "value" text NOT NULL,
                "type" character varying(20) NOT NULL,
                "description" text,
                "category" character varying(30) NOT NULL,
                "is_public" boolean NOT NULL DEFAULT false,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_system_configurations" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_system_configurations_key" UNIQUE ("key")
            )
        `);

        // Subscriptions
        await queryRunner.query(`
            CREATE TABLE "subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "plan" character varying(20) NOT NULL,
                "status" character varying(20) NOT NULL,
                "start_date" TIMESTAMP NOT NULL,
                "end_date" TIMESTAMP,
                "trial_end_date" TIMESTAMP,
                "auto_renew" boolean NOT NULL DEFAULT true,
                "price" double precision NOT NULL DEFAULT 0,
                "currency" character varying(3) NOT NULL DEFAULT 'COP',
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
            )
        `);

        // Station Statistics
        await queryRunner.query(`
            CREATE TABLE "station_statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "station_id" uuid,
                "station_code" character varying(50),
                "total_processings" integer NOT NULL DEFAULT 0,
                "avg_time" double precision NOT NULL DEFAULT 0,
                "total_campaigns" integer NOT NULL DEFAULT 0,
                "total_files" integer NOT NULL DEFAULT 0,
                "total_observations" integer NOT NULL DEFAULT 0,
                "total_satellites" integer NOT NULL DEFAULT 0,
                "total_ppp" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_station_statistics" PRIMARY KEY ("id")
            )
        `);

        // Sessions
        await queryRunner.query(`
            CREATE TABLE "sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token" text NOT NULL,
                "ip" character varying(45) NOT NULL,
                "user_agent" text NOT NULL,
                "device" character varying(100),
                "os" character varying(50),
                "browser" character varying(50),
                "language" character varying(20),
                "timezone" character varying(50),
                "is_active" boolean NOT NULL DEFAULT true,
                "login_at" TIMESTAMP NOT NULL,
                "logout_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_sessions" PRIMARY KEY ("id")
            )
        `);

        // Server Metrics
        await queryRunner.query(`
            CREATE TABLE "server_metrics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "timestamp" TIMESTAMP NOT NULL,
                "cpu_usage" double precision NOT NULL,
                "ram_usage" double precision NOT NULL,
                "ram_total" bigint,
                "ram_used" bigint,
                "disk_usage" double precision NOT NULL,
                "disk_total" bigint,
                "disk_used" bigint,
                "storage_used" bigint,
                "api_response_time" double precision NOT NULL,
                "active_connections" integer NOT NULL,
                "total_requests" integer NOT NULL,
                "error_count" integer NOT NULL,
                "db_connections" integer,
                "db_size" bigint,
                "latency" double precision,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_server_metrics" PRIMARY KEY ("id")
            )
        `);

        // Satellite Statistics
        await queryRunner.query(`
            CREATE TABLE "satellite_statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "constellation" character varying(20) NOT NULL,
                "date" date NOT NULL,
                "total_files" integer NOT NULL,
                "total_observations" integer NOT NULL,
                "total_epochs" integer NOT NULL,
                "avg_satellites" double precision NOT NULL,
                "max_satellites" integer NOT NULL,
                "availability" double precision NOT NULL,
                "usage_frequency" double precision NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_satellite_statistics" PRIMARY KEY ("id")
            )
        `);

        // Receiver Statistics
        await queryRunner.query(`
            CREATE TABLE "receiver_statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "receiver" character varying(255) NOT NULL,
                "manufacturer" character varying(255),
                "model" character varying(255),
                "total_uses" integer NOT NULL,
                "avg_time" double precision NOT NULL,
                "total_files" integer NOT NULL,
                "total_observations" integer NOT NULL,
                "total_satellites" integer NOT NULL,
                "last_used" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_receiver_statistics" PRIMARY KEY ("id")
            )
        `);

        // Payments
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "subscription_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "amount" double precision NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'COP',
                "method" character varying(20) NOT NULL,
                "status" character varying(20) NOT NULL,
                "invoice_url" character varying(500),
                "description" character varying(255),
                "paid_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_payments" PRIMARY KEY ("id")
            )
        `);

        // Notifications
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "type" character varying(20) NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "link" character varying(500),
                "is_read" boolean NOT NULL DEFAULT false,
                "category" character varying(30) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);

        // Downloads
        await queryRunner.query(`
            CREATE TABLE "downloads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "file_name" character varying(255) NOT NULL,
                "file_type" character varying(50) NOT NULL,
                "file_size" bigint,
                "processing_id" uuid,
                "ip" character varying(45),
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_downloads" PRIMARY KEY ("id")
            )
        `);

        // Data Warehouse
        await queryRunner.query(`
            CREATE TABLE "data_warehouse" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "period" character varying(10) NOT NULL,
                "date" date NOT NULL,
                "metric" character varying(100) NOT NULL,
                "value" double precision NOT NULL,
                "dimension" character varying(100),
                "dimension_value" character varying(100),
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_data_warehouse" PRIMARY KEY ("id")
            )
        `);

        // API Usage Logs
        await queryRunner.query(`
            CREATE TABLE "api_usage_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "api_key_id" uuid NOT NULL,
                "endpoint" character varying(255) NOT NULL,
                "method" character varying(10) NOT NULL,
                "status_code" integer NOT NULL,
                "ip" character varying(45) NOT NULL,
                "response_time" double precision NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_api_usage_logs" PRIMARY KEY ("id")
            )
        `);

        // Antenna Statistics
        await queryRunner.query(`
            CREATE TABLE "antenna_statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "antenna" character varying(255) NOT NULL,
                "manufacturer" character varying(255),
                "model" character varying(255),
                "total_uses" integer NOT NULL,
                "avg_time" double precision NOT NULL,
                "total_files" integer NOT NULL,
                "total_observations" integer NOT NULL,
                "last_used" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_antenna_statistics" PRIMARY KEY ("id")
            )
        `);

        // Alert Events
        await queryRunner.query(`
            CREATE TABLE "alert_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "config_id" uuid NOT NULL,
                "metric" character varying(50) NOT NULL,
                "value" double precision NOT NULL,
                "threshold" double precision NOT NULL,
                "severity" character varying(10) NOT NULL,
                "message" text NOT NULL,
                "sent_at" TIMESTAMP NOT NULL,
                "acknowledged_at" TIMESTAMP,
                "acknowledged_by" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_alert_events" PRIMARY KEY ("id")
            )
        `);

        // Advertisement Clicks
        await queryRunner.query(`
            CREATE TABLE "advertisement_clicks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "advertisement_id" uuid NOT NULL,
                "user_id" uuid,
                "ip" character varying(45) NOT NULL,
                "user_agent" text,
                "referrer" text,
                "page" character varying(255),
                "clicked_at" TIMESTAMP NOT NULL,
                "revenue" double precision NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_advertisement_clicks" PRIMARY KEY ("id")
            )
        `);

        // -- Foreign Keys --

        await queryRunner.query(`
            ALTER TABLE "departments"
            ADD CONSTRAINT "FK_departments_country"
            FOREIGN KEY ("country_id") REFERENCES "countries"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cities"
            ADD CONSTRAINT "FK_cities_department"
            FOREIGN KEY ("department_id") REFERENCES "departments"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_role_permissions_role"
            FOREIGN KEY ("role_id") REFERENCES "roles"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_role_permissions_permission"
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "processing_history"
            ADD CONSTRAINT "FK_processing_history_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "ai_predictions"
            ADD CONSTRAINT "FK_ai_predictions_model"
            FOREIGN KEY ("model_id") REFERENCES "ai_models"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "alert_events"
            ADD CONSTRAINT "FK_alert_events_config"
            FOREIGN KEY ("config_id") REFERENCES "alert_configs"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "api_usage_logs"
            ADD CONSTRAINT "FK_api_usage_logs_api_key"
            FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "advertisement_clicks"
            ADD CONSTRAINT "FK_advertisement_clicks_ad"
            FOREIGN KEY ("advertisement_id") REFERENCES "advertisements"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_payments_subscription"
            FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "user_visits"
            ADD CONSTRAINT "FK_user_visits_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "sessions"
            ADD CONSTRAINT "FK_sessions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "subscriptions"
            ADD CONSTRAINT "FK_subscriptions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_payments_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "activity_logs"
            ADD CONSTRAINT "FK_activity_logs_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notifications_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "downloads"
            ADD CONSTRAINT "FK_downloads_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Add new columns to existing users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "surname" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "university" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_count" integer DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "visit_count" integer DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_processing_time" double precision DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "storage_used" double precision DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_ip" character varying(45)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_user_agent" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enterprise_last_login_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`);

        // Add foreign keys for users table
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_country" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_city" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_enterprise_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys from users table
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_enterprise_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_city"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_department"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_country"`);
        await queryRunner.query(`ALTER TABLE "downloads" DROP CONSTRAINT IF EXISTS "FK_downloads_user"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "FK_activity_logs_user"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_user"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_user"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "FK_sessions_user"`);
        await queryRunner.query(`ALTER TABLE "user_visits" DROP CONSTRAINT IF EXISTS "FK_user_visits_user"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_subscription"`);
        await queryRunner.query(`ALTER TABLE "advertisement_clicks" DROP CONSTRAINT IF EXISTS "FK_advertisement_clicks_ad"`);
        await queryRunner.query(`ALTER TABLE "api_usage_logs" DROP CONSTRAINT IF EXISTS "FK_api_usage_logs_api_key"`);
        await queryRunner.query(`ALTER TABLE "alert_events" DROP CONSTRAINT IF EXISTS "FK_alert_events_config"`);
        await queryRunner.query(`ALTER TABLE "ai_predictions" DROP CONSTRAINT IF EXISTS "FK_ai_predictions_model"`);
        await queryRunner.query(`ALTER TABLE "processing_history" DROP CONSTRAINT IF EXISTS "FK_processing_history_user"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_permission"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_role"`);
        await queryRunner.query(`ALTER TABLE "cities" DROP CONSTRAINT IF EXISTS "FK_cities_department"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "FK_departments_country"`);

        await queryRunner.query(`DROP TABLE IF EXISTS "advertisement_clicks"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "alert_events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "antenna_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_usage_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "data_warehouse"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "downloads"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "receiver_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "satellite_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "server_metrics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "station_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "system_configurations"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_visits"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ai_predictions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "processing_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "processing_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "anomaly_detections"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "quality_scores"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "rinex_statistics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "advertisements"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "alert_configs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ai_models"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "countries"`);
    }
}
