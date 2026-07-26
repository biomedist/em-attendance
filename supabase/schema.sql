-- Run this in Supabase Dashboard → SQL Editor
-- 기존 테이블 삭제 (재생성)
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS offerings CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Groups (A–E)
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students (add/remove per group later via UI)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly attendance (Sunday date as week key)
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, week_date)
);

-- Weekly offering per group
CREATE TABLE IF NOT EXISTS offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_date DATE NOT NULL UNIQUE,
  amount INT NOT NULL DEFAULT 0,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notices & events
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('event', 'announcement', 'holiday')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_week ON attendance_records(week_date);
CREATE INDEX IF NOT EXISTS idx_offerings_week ON offerings(week_date);
CREATE INDEX IF NOT EXISTS idx_notices_date ON notices(date);

-- Open access (no login for now)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "public write groups" ON groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read students" ON students FOR SELECT USING (true);
CREATE POLICY "public write students" ON students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read attendance" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "public write attendance" ON attendance_records FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read offerings" ON offerings FOR SELECT USING (true);
CREATE POLICY "public write offerings" ON offerings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read notices" ON notices FOR SELECT USING (true);
CREATE POLICY "public write notices" ON notices FOR ALL USING (true) WITH CHECK (true);

-- Seed groups A–E
INSERT INTO groups (id, name, teacher, sort_order) VALUES
  ('A', 'Group A', 'Yunjung Lee', 1),
  ('B', 'Group B', 'Ms.Cho', 2),
  ('C', 'Group C', 'Sumi Yang', 3),
  ('D', 'Group D', 'Youngsu Lee', 4),
  ('E', 'Group E', 'Youngin Kim', 5),
  ('TEACHER', 'Teachers', NULL, 6)
ON CONFLICT (id) DO NOTHING;

-- Sample students (mixed grades)
INSERT INTO students (group_id, name, grade, sort_order) VALUES
  ('A', 'Minjun Kim', '1st', 1),
  ('A', 'Seoyeon Lee', 'K', 2),
  ('A', 'Jiho Park', '1st', 3),
  ('A', 'Yuna Choi', 'K', 4),
  ('B', 'Siwoo Yoon', '3rd', 1),
  ('B', 'Sua Lim', '2nd', 2),
  ('B', 'YeJun Han', '3rd', 3),
  ('C', 'Harin Song', '5th', 1),
  ('C', 'Junseo Ryu', '4th', 2),
  ('D', 'Eunwoo Hong', '7th', 1),
  ('D', 'Daeun Shin', '6th', 2),
  ('E', 'Hyunwoo Cho', '9th', 1),
  ('E', 'Soyul Kwon', '8th', 2);
  ('TEACHER', 'Jean Jung', NULL, 1),
  ('TEACHER', 'Yunjun Lee', NULL, 2),
  ('TEACHER', 'Ms.Cho', NULL, 3),
  ('TEACHER', 'Sumi Yang', NULL, 4),
  ('TEACHER', 'Youngsu Lee', NULL, 5),
  ('TEACHER', 'Youngin Kim', NULL, 6),
  ('TEACHER', 'Dongi Shin', NULL, 7),
  ('TEACHER', 'Jieun Kim', NULL, 8),
  ('TEACHER', 'Hyein Kim', NULL, 9),
  ('TEACHER', 'Ahyun Kim', NULL, 10);

-- Sample notices
INSERT INTO notices (date, title, description, type) VALUES
  ('2026-04-20', 'Easter Day Egg Hunting', 'Held in the church garden. Please prepare snacks.', 'event'),
  ('2026-06-08', 'Outdoor Worship', 'Han River Park. Departure 9:30 AM by bus.', 'event'),
  ('2026-07-13', 'Summer VBS Registration', 'VBS runs 7/20–7/24. Registration closes 7/5.', 'announcement'),
  ('2026-12-20', 'Christmas Special Service', 'Nativity sketch & worship. Families welcome.', 'event'),
  ('2026-01-01', 'New Year Sunday — No Class', NULL, 'holiday');
