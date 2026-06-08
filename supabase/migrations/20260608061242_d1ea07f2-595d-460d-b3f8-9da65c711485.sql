
-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.habit_category AS ENUM ('coding','reading','gym','running','meditation','fasting','custom');
CREATE TYPE public.checkin_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.shield_tier AS ENUM ('bronze','silver','gold');
CREATE TYPE public.shield_status AS ENUM ('active','used','expired');
CREATE TYPE public.app_role AS ENUM ('admin','user');

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  consistency_score INT NOT NULL DEFAULT 0,
  verification_accuracy INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER ROLES
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =====================================================
-- HABITS
-- =====================================================
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category habit_category NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_habits_user ON public.habits(user_id) WHERE archived = false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CHECK-INS
-- =====================================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  category habit_category NOT NULL,
  check_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  status checkin_status NOT NULL DEFAULT 'pending',
  verification_score INT,
  confidence_score INT,
  ai_feedback JSONB,
  proof_data JSONB,
  proof_image_url TEXT,
  credits_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, check_date)
);
CREATE INDEX idx_checkins_user_date ON public.check_ins(user_id, check_date DESC);
CREATE INDEX idx_checkins_habit_date ON public.check_ins(habit_id, check_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON public.check_ins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CREDIT BALANCES (per category)
-- =====================================================
CREATE TABLE public.credit_balances (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category habit_category NOT NULL,
  balance INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);
GRANT SELECT, INSERT, UPDATE ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own balances" ON public.credit_balances FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category habit_category NOT NULL,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- SHIELDS
-- =====================================================
CREATE TABLE public.shields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category habit_category NOT NULL,
  tier shield_tier NOT NULL,
  status shield_status NOT NULL DEFAULT 'active',
  protects_days INT NOT NULL,
  cost INT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX idx_shields_user_status ON public.shields(user_id, status);
GRANT SELECT, INSERT, UPDATE ON public.shields TO authenticated;
GRANT ALL ON public.shields TO service_role;
ALTER TABLE public.shields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shields" ON public.shields FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- BADGES
-- =====================================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
GRANT SELECT ON public.badges TO anon;
GRANT SELECT, INSERT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges public read" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users insert own badges" ON public.badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_habits_updated BEFORE UPDATE ON public.habits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'username',
             split_part(NEW.email, '@', 1),
             'user'),
    '[^a-z0-9_]', '', 'g'));
  IF length(base_username) < 3 THEN base_username := 'user' || substr(NEW.id::text, 1, 6); END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', base_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Credit awarding helper
CREATE OR REPLACE FUNCTION public.award_credits(
  _user_id UUID, _category habit_category, _amount INT, _reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.credit_balances (user_id, category, balance, lifetime_earned)
  VALUES (_user_id, _category, _amount, GREATEST(_amount, 0))
  ON CONFLICT (user_id, category) DO UPDATE
  SET balance = credit_balances.balance + _amount,
      lifetime_earned = credit_balances.lifetime_earned + GREATEST(_amount, 0),
      updated_at = now();
  INSERT INTO public.credit_transactions (user_id, category, amount, reason)
  VALUES (_user_id, _category, _amount, _reason);
END; $$;

-- On verified check-in: award credits, update streak, recompute consistency
CREATE OR REPLACE FUNCTION public.handle_verified_checkin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  award INT := 10;
  streak_count INT;
  verified_count INT;
  total_count INT;
  prev_date DATE;
  longest INT;
BEGIN
  IF NEW.status <> 'verified' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'verified' THEN RETURN NEW; END IF;

  IF NEW.verification_score IS NOT NULL AND NEW.verification_score >= 90 THEN
    award := award + 5;
  END IF;

  -- Compute current streak across all habits (consecutive days with any verified checkin)
  SELECT count(*) INTO streak_count FROM (
    SELECT DISTINCT check_date FROM public.check_ins
    WHERE user_id = NEW.user_id AND status = 'verified'
      AND check_date <= NEW.check_date
    ORDER BY check_date DESC
  ) d;

  -- Walk back consecutive days
  WITH consecutive AS (
    SELECT check_date,
           row_number() OVER (ORDER BY check_date DESC) AS rn
    FROM (SELECT DISTINCT check_date FROM public.check_ins
          WHERE user_id = NEW.user_id AND status = 'verified'
            AND check_date <= NEW.check_date) d
  )
  SELECT count(*) INTO streak_count FROM consecutive
  WHERE check_date = NEW.check_date - (rn - 1);

  -- Milestone bonuses
  IF streak_count = 7 THEN award := award + 50; END IF;
  IF streak_count = 30 THEN award := award + 200; END IF;
  IF streak_count = 100 THEN award := award + 1000; END IF;

  NEW.credits_awarded := award;
  PERFORM public.award_credits(NEW.user_id, NEW.category, award, 'Verified check-in');

  -- Update profile streaks & XP
  SELECT longest_streak INTO longest FROM public.profiles WHERE id = NEW.user_id;
  UPDATE public.profiles SET
    current_streak = streak_count,
    longest_streak = GREATEST(longest, streak_count),
    xp = xp + award,
    level = 1 + ((xp + award) / 500)
  WHERE id = NEW.user_id;

  -- Verification accuracy + consistency
  SELECT count(*) FILTER (WHERE status = 'verified'),
         count(*)
  INTO verified_count, total_count
  FROM public.check_ins WHERE user_id = NEW.user_id;

  UPDATE public.profiles SET
    verification_accuracy = CASE WHEN total_count > 0 THEN (verified_count * 100 / total_count) ELSE 0 END,
    consistency_score = LEAST(100,
      (CASE WHEN total_count > 0 THEN (verified_count * 60 / total_count) ELSE 0 END)
      + LEAST(40, streak_count)
    )
  WHERE id = NEW.user_id;

  -- Award streak badges
  IF streak_count >= 7 THEN
    INSERT INTO public.badges(user_id, badge_key) VALUES (NEW.user_id, 'streak_7') ON CONFLICT DO NOTHING;
  END IF;
  IF streak_count >= 30 THEN
    INSERT INTO public.badges(user_id, badge_key) VALUES (NEW.user_id, 'streak_30') ON CONFLICT DO NOTHING;
  END IF;
  IF streak_count >= 100 THEN
    INSERT INTO public.badges(user_id, badge_key) VALUES (NEW.user_id, 'streak_100') ON CONFLICT DO NOTHING;
  END IF;
  IF streak_count >= 365 THEN
    INSERT INTO public.badges(user_id, badge_key) VALUES (NEW.user_id, 'streak_365') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_verified_checkin
BEFORE INSERT OR UPDATE ON public.check_ins
FOR EACH ROW EXECUTE FUNCTION public.handle_verified_checkin();

-- Expire old shields helper
CREATE OR REPLACE FUNCTION public.expire_old_shields() RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.shields SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
$$;
