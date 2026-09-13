-- ============================================================
-- CRDDMS Seed Data  (safe to run multiple times)
-- ============================================================

-- Departments (ON CONFLICT on unique department_code column)
INSERT INTO departments (department_code, department_name) VALUES
  ('CSE',   'Computer Science & Engineering'),
  ('ECE',   'Electronics & Communication Engineering'),
  ('EEE',   'Electrical & Electronics Engineering'),
  ('MECH',  'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('IT',    'Information Technology'),
  ('MBA',   'Master of Business Administration'),
  ('MCA',   'Master of Computer Applications'),
  ('ADMIN', 'Administration'),
  ('EXAM',  'Examination Branch')
ON CONFLICT (department_code) DO NOTHING;

-- Users (pre-hashed bcrypt credentials for initial deployment)
INSERT INTO users (name, email, password_hash, role, department_id) VALUES
  ('Super Administrator', 'superadmin@crddms.edu', '$2b$10$v7WZgXPGKwZNnuj2xtiEVews.Sebgr6J5mELZ1uZ8PqcV06vBVUsS', 'super_admin', NULL),
  ('Dr. Admin User',      'admin@crddms.edu',      '$2b$10$v7WZgXPGKwZNnuj2xtiEVews.Sebgr6J5mELZ1uZ8PqcV06vBVUsS', 'admin',       1),
  ('Dr. Ravi Kumar',      'ravi@crddms.edu',       '$2b$10$v7WZgXPGKwZNnuj2xtiEVews.Sebgr6J5mELZ1uZ8PqcV06vBVUsS', 'dept_head',   1),
  ('Prof. Priya Sharma',  'priya@crddms.edu',      '$2b$10$v7WZgXPGKwZNnuj2xtiEVews.Sebgr6J5mELZ1uZ8PqcV06vBVUsS', 'faculty',     2),
  ('Mr. Suresh Babu',     'suresh@crddms.edu',     '$2b$10$v7WZgXPGKwZNnuj2xtiEVews.Sebgr6J5mELZ1uZ8PqcV06vBVUsS', 'staff',       9),
  ('NAAC Reviewer',       'naac@crddms.edu',       '$2b$10$v7WZgXPGKwZNnuj2xtiEVews.Sebgr6J5mELZ1uZ8PqcV06vBVUsS', 'compliance_reviewer', NULL)
ON CONFLICT (email) DO NOTHING;

-- Students
INSERT INTO students (roll_number, name, department_id, admission_year, academic_year) VALUES
  ('21CSE001', 'Aarav Patel',   1, 2021, '2024-25'),
  ('21CSE002', 'Sneha Reddy',   1, 2021, '2024-25'),
  ('21ECE001', 'Kiran Varma',   2, 2021, '2024-25'),
  ('22IT001',  'Divya Lakshmi', 6, 2022, '2024-25'),
  ('22MBA001', 'Rahul Mehta',   7, 2022, '2024-25')
ON CONFLICT (roll_number) DO NOTHING;

-- Faculty
INSERT INTO faculty (employee_code, name, department_id, designation, qualification) VALUES
  ('FAC001', 'Dr. Ravi Kumar',     1, 'Professor',       'Ph.D Computer Science'),
  ('FAC002', 'Prof. Priya Sharma', 2, 'Associate Prof.', 'M.Tech Electronics'),
  ('FAC003', 'Dr. Anand Rao',      3, 'Professor',       'Ph.D Electrical Engg.'),
  ('FAC004', 'Ms. Kavitha Devi',   6, 'Assistant Prof.', 'M.Tech IT'),
  ('FAC005', 'Dr. Sunil Yadav',    7, 'Professor',       'Ph.D Management')
ON CONFLICT (employee_code) DO NOTHING;

-- Uploaded documents (use DO NOTHING only if rows already exist — guard by checking count)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM uploaded_documents) = 0 THEN
    INSERT INTO uploaded_documents
      (title, file_name, file_path, file_type, file_size, department_id, academic_year, category, uploaded_by, status, tags)
    VALUES
      ('CSE Student Marksheet 2024',   '21CSE001_marks.pdf', 'uploads/cse/2024-25/21CSE001_marks.pdf',  'pdf',  204800,  1, '2024-25', 'student_records',        2, 'approved',     '{"marks","CSE","2024-25"}'),
      ('Faculty Research Paper - AI',  'ravi_ai_paper.pdf',  'uploads/cse/2024-25/ravi_ai_paper.pdf',   'pdf',  512000,  1, '2024-25', 'faculty_records',         3, 'approved',     '{"research","AI","faculty"}'),
      ('NAAC Criterion 1 Evidence',    'naac_c1.pdf',        'uploads/admin/naac/naac_c1.pdf',          'pdf', 1048576,  9, '2024-25', 'accreditation_documents', 2, 'under_review', '{"NAAC","C1","accreditation"}'),
      ('End Semester Exam Schedule',   'exam_schedule.xlsx', 'uploads/exam/2024-25/exam_schedule.xlsx', 'xlsx', 163840, 10, '2024-25', 'examination_records',     5, 'approved',     '{"exam","schedule","2024-25"}'),
      ('MBA Admission Records 2022',   'mba_admit_2022.pdf', 'uploads/mba/2022-23/mba_admit_2022.pdf',  'pdf',  307200,  7, '2022-23', 'student_records',         2, 'archived',     '{"MBA","admission","2022"}'),
      ('ECE Lab Manual 2024',          'ece_lab_manual.pdf', 'uploads/ece/2024-25/ece_lab_manual.pdf',  'pdf',  409600,  2, '2024-25', 'faculty_records',         4, 'pending',      '{"ECE","lab","manual"}'),
      ('AICTE Compliance Report 2024', 'aicte_2024.pdf',     'uploads/admin/aicte/aicte_2024.pdf',      'pdf',  819200,  9, '2024-25', 'accreditation_documents', 2, 'approved',     '{"AICTE","compliance","2024"}'),
      ('Student Fee Receipts Q1 2024', 'fee_q1_2024.pdf',    'uploads/admin/finance/fee_q1_2024.pdf',   'pdf',  102400,  9, '2024-25', 'administrative_records',  5, 'approved',     '{"fee","finance","2024"}');
  END IF;
END $$;

-- OCR Extracted text (safe upsert using UNIQUE document_id)
INSERT INTO ocr_extracted_text (document_id, extracted_text, confidence_score)
SELECT 1, 'Student: Aarav Patel Roll No: 21CSE001 Marks: Mathematics 85/100, Data Structures 90/100, DBMS 78/100, Operating Systems 82/100', 94.5
WHERE EXISTS (SELECT 1 FROM uploaded_documents WHERE id = 1)
ON CONFLICT (document_id) DO NOTHING;

INSERT INTO ocr_extracted_text (document_id, extracted_text, confidence_score)
SELECT 3, 'NAAC Criterion 1: Curricular Aspects. The institution has well-defined academic programs aligned with the vision and mission.', 88.2
WHERE EXISTS (SELECT 1 FROM uploaded_documents WHERE id = 3)
ON CONFLICT (document_id) DO NOTHING;

INSERT INTO ocr_extracted_text (document_id, extracted_text, confidence_score)
SELECT 7, 'AICTE Compliance Report 2024 - Institution: CRDDMS College of Engineering. All parameters meet required standards.', 96.1
WHERE EXISTS (SELECT 1 FROM uploaded_documents WHERE id = 7)
ON CONFLICT (document_id) DO NOTHING;

-- Accreditation records (guard by checking count)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM accreditation_records) = 0 THEN
    INSERT INTO accreditation_records (document_id, authority, criteria_code, remarks)
    SELECT id, 'NAAC', 'C-1.1', 'Curricular Aspects - Curriculum Design and Development'
    FROM uploaded_documents WHERE title = 'NAAC Criterion 1 Evidence' LIMIT 1;

    INSERT INTO accreditation_records (document_id, authority, criteria_code, remarks)
    SELECT id, 'AICTE', 'F-2', 'Faculty Qualification Compliance 2024'
    FROM uploaded_documents WHERE title = 'AICTE Compliance Report 2024' LIMIT 1;
  END IF;
END $$;

-- Archive record (guard by checking count)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM archive_records) = 0 THEN
    INSERT INTO archive_records (document_id, archive_date, archive_reason, archived_by)
    SELECT id, NOW(), 'Academic year completed - moved to archive', 2
    FROM uploaded_documents WHERE title = 'MBA Admission Records 2022' LIMIT 1;
  END IF;
END $$;

-- Audit logs (guard by checking count)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM audit_logs) = 0 THEN
    INSERT INTO audit_logs (user_id, action, document_id, ip_address, details) VALUES
      (2, 'login',   NULL, '192.168.1.10', '{"browser":"Chrome","os":"Windows"}'),
      (2, 'upload',  1,    '192.168.1.10', '{"file":"21CSE001_marks.pdf"}'),
      (3, 'view',    1,    '192.168.1.11', '{"page":"document_detail"}'),
      (2, 'approve', 1,    '192.168.1.10', '{"prev_status":"under_review","new_status":"approved"}'),
      (6, 'search',  NULL, '192.168.1.15', '{"query":"NAAC compliance","results":2}'),
      (2, 'upload',  3,    '192.168.1.10', '{"file":"naac_c1.pdf"}');
  END IF;
END $$;
