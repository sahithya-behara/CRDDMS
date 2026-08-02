-- ============================================================
-- CRDDMS PostgreSQL Schema
-- ============================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id              SERIAL PRIMARY KEY,
  department_code VARCHAR(10)  NOT NULL UNIQUE,
  department_name VARCHAR(100) NOT NULL,
  storage_limit   BIGINT       DEFAULT 10737418240, -- 10 GB in bytes
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  role            VARCHAR(30)   NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('super_admin','admin','dept_head','faculty','staff','compliance_reviewer')),
  department_id   INT           REFERENCES departments(id) ON DELETE SET NULL,
  is_active       BOOLEAN       DEFAULT TRUE,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id             SERIAL PRIMARY KEY,
  roll_number    VARCHAR(20)   NOT NULL UNIQUE,
  name           VARCHAR(100)  NOT NULL,
  department_id  INT           REFERENCES departments(id) ON DELETE SET NULL,
  admission_year INT,
  academic_year  VARCHAR(10),
  contact_info   JSONB         DEFAULT '{}'
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id             SERIAL PRIMARY KEY,
  employee_code  VARCHAR(20)   NOT NULL UNIQUE,
  name           VARCHAR(100)  NOT NULL,
  department_id  INT           REFERENCES departments(id) ON DELETE SET NULL,
  designation    VARCHAR(80),
  qualification  VARCHAR(150)
);

-- Uploaded Documents
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(200)  NOT NULL,
  file_name      VARCHAR(300)  NOT NULL,
  file_path      TEXT          NOT NULL,
  file_type      VARCHAR(20),
  file_size      BIGINT,
  department_id  INT           REFERENCES departments(id) ON DELETE SET NULL,
  academic_year  VARCHAR(10),
  category       VARCHAR(60)   NOT NULL
                 CHECK (category IN ('student_records','faculty_records','examination_records',
                                     'administrative_records','accreditation_documents')),
  uploaded_by    INT           REFERENCES users(id) ON DELETE SET NULL,
  status         VARCHAR(20)   DEFAULT 'pending'
                 CHECK (status IN ('pending','under_review','approved','rejected','archived')),
  is_authorized  BOOLEAN       DEFAULT TRUE,
  tags           TEXT[]        DEFAULT '{}',
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- OCR Extracted Text
CREATE TABLE IF NOT EXISTS ocr_extracted_text (
  id               SERIAL PRIMARY KEY,
  document_id      INT          REFERENCES uploaded_documents(id) ON DELETE CASCADE UNIQUE,
  extracted_text   TEXT,
  confidence_score NUMERIC(5,2) DEFAULT 0,
  processed_at     TIMESTAMPTZ  DEFAULT NOW(),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- Accreditation / Compliance Records
CREATE TABLE IF NOT EXISTS accreditation_records (
  id             SERIAL PRIMARY KEY,
  document_id    INT         REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  authority      VARCHAR(20) NOT NULL CHECK (authority IN ('NAAC','NBA','AICTE','UGC')),
  criteria_code  VARCHAR(30),
  remarks        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Archive Records
CREATE TABLE IF NOT EXISTS archive_records (
  id              SERIAL PRIMARY KEY,
  document_id     INT          REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  archive_date    TIMESTAMPTZ  DEFAULT NOW(),
  archive_reason  TEXT,
  archived_by     INT          REFERENCES users(id) ON DELETE SET NULL
);

-- Audit Logs (immutable — no UPDATE/DELETE allowed via app)
CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INT          REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(30)  NOT NULL,
  document_id  INT          REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  ip_address   VARCHAR(50),
  details      JSONB        DEFAULT '{}',
  timestamp    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_docs_dept     ON uploaded_documents(department_id);
CREATE INDEX IF NOT EXISTS idx_docs_status   ON uploaded_documents(status);
CREATE INDEX IF NOT EXISTS idx_docs_category ON uploaded_documents(category);
CREATE INDEX IF NOT EXISTS idx_docs_year     ON uploaded_documents(academic_year);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_ts      ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ocr_doc       ON ocr_extracted_text(document_id);

-- Full-text search index on OCR text
CREATE INDEX IF NOT EXISTS idx_ocr_text_fts ON ocr_extracted_text
  USING GIN(to_tsvector('english', COALESCE(extracted_text,'')));
