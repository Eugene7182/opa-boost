-- Training materials with fixed RLS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_materials_new') THEN
    CREATE TABLE public.training_materials_new (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      region_ids UUID[],
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.training_materials_new ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Trainers and admins can manage training materials"
    ON public.training_materials_new FOR ALL
    USING (
      has_role(auth.uid(), 'trainer') OR 
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'office')
    );
    
    CREATE POLICY "Users can view training materials"
    ON public.training_materials_new FOR SELECT
    USING (true);
  END IF;
END $$;

-- Tests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tests') THEN
    CREATE TABLE public.tests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      region_ids UUID[],
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Trainers and admins can manage tests"
    ON public.tests FOR ALL
    USING (
      has_role(auth.uid(), 'trainer') OR 
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'office')
    );
  END IF;
END $$;

-- Test questions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_questions') THEN
    CREATE TABLE public.test_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      options JSONB NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Trainers can manage test questions"
    ON public.test_questions FOR ALL
    USING (
      has_role(auth.uid(), 'trainer') OR 
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'office')
    );
    
    CREATE POLICY "Users can view questions for tests"
    ON public.test_questions FOR SELECT
    USING (true);
  END IF;
END $$;

-- Test assignments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_assignments') THEN
    CREATE TABLE public.test_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      assigned_by UUID NOT NULL REFERENCES auth.users(id),
      status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'passed', 'failed')),
      score INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Trainers can manage test assignments"
    ON public.test_assignments FOR ALL
    USING (
      has_role(auth.uid(), 'trainer') OR 
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'office')
    );
    
    CREATE POLICY "Users can view their test assignments"
    ON public.test_assignments FOR SELECT
    USING (user_id = auth.uid());
    
    CREATE POLICY "Users can update their test assignment status"
    ON public.test_assignments FOR UPDATE
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Test results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_results') THEN
    CREATE TABLE public.test_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      answers JSONB NOT NULL,
      score INTEGER NOT NULL,
      passed BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Trainers can view test results"
    ON public.test_results FOR SELECT
    USING (
      has_role(auth.uid(), 'trainer') OR 
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'office')
    );
    
    CREATE POLICY "Users can view their test results"
    ON public.test_results FOR SELECT
    USING (user_id = auth.uid());
    
    CREATE POLICY "Users can insert their test results"
    ON public.test_results FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Triggers for updated_at on new tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_materials_new') THEN
    CREATE TRIGGER update_training_materials_new_updated_at
    BEFORE UPDATE ON public.training_materials_new
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tests') THEN
    CREATE TRIGGER update_tests_updated_at
    BEFORE UPDATE ON public.tests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_assignments') THEN
    CREATE TRIGGER update_test_assignments_updated_at
    BEFORE UPDATE ON public.test_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;