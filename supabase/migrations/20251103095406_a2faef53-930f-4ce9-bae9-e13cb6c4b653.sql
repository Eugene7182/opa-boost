-- Create training_materials table
CREATE TABLE public.training_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'video', 'document', 'presentation', 'quiz'
  file_url TEXT,
  category TEXT,
  duration_minutes INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES profiles(id) NOT NULL,
  material_id UUID REFERENCES training_materials(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  online_link TEXT,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  region_id UUID REFERENCES regions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_participants table
CREATE TABLE public.training_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  attendance_status TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'attended', 'absent', 'completed'
  completion_percentage INTEGER DEFAULT 0,
  quiz_score INTEGER,
  feedback TEXT,
  attended_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create training_progress table
CREATE TABLE public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  material_id UUID REFERENCES training_materials(id) NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, material_id)
);

-- Enable RLS
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_materials
CREATE POLICY "Admin and office can manage training materials"
  ON public.training_materials FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

CREATE POLICY "Trainers can manage their own materials"
  ON public.training_materials FOR ALL
  USING (has_role(auth.uid(), 'trainer') AND created_by = auth.uid());

CREATE POLICY "Everyone can view active training materials"
  ON public.training_materials FOR SELECT
  USING (active = true);

-- RLS Policies for training_sessions
CREATE POLICY "Admin and office can manage all training sessions"
  ON public.training_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

CREATE POLICY "Trainers can manage their own sessions"
  ON public.training_sessions FOR ALL
  USING (has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid());

CREATE POLICY "Supervisors can view sessions in their region"
  ON public.training_sessions FOR SELECT
  USING (
    has_role(auth.uid(), 'supervisor') AND 
    region_id IN (SELECT region_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view sessions they're registered for"
  ON public.training_sessions FOR SELECT
  USING (
    id IN (SELECT session_id FROM training_participants WHERE user_id = auth.uid())
  );

-- RLS Policies for training_participants
CREATE POLICY "Admin and office can manage all participants"
  ON public.training_participants FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

CREATE POLICY "Trainers can manage participants in their sessions"
  ON public.training_participants FOR ALL
  USING (
    session_id IN (SELECT id FROM training_sessions WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Users can view their own participation"
  ON public.training_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can register for sessions"
  ON public.training_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for training_progress
CREATE POLICY "Admin and office can view all progress"
  ON public.training_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'office'));

CREATE POLICY "Trainers can view progress for their materials"
  ON public.training_progress FOR SELECT
  USING (
    has_role(auth.uid(), 'trainer') AND
    material_id IN (SELECT id FROM training_materials WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can manage their own progress"
  ON public.training_progress FOR ALL
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_training_materials_updated_at
  BEFORE UPDATE ON public.training_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_progress_updated_at
  BEFORE UPDATE ON public.training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_training_materials_active ON public.training_materials(active);
CREATE INDEX idx_training_materials_category ON public.training_materials(category);
CREATE INDEX idx_training_sessions_trainer ON public.training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_scheduled ON public.training_sessions(scheduled_at);
CREATE INDEX idx_training_sessions_status ON public.training_sessions(status);
CREATE INDEX idx_training_participants_session ON public.training_participants(session_id);
CREATE INDEX idx_training_participants_user ON public.training_participants(user_id);
CREATE INDEX idx_training_progress_user ON public.training_progress(user_id);
CREATE INDEX idx_training_progress_material ON public.training_progress(material_id);