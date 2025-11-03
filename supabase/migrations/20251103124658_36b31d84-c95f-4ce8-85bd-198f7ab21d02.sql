-- Add policy for trainers to create tasks
CREATE POLICY "Trainers can create and manage their tasks" 
ON public.tasks 
FOR ALL
USING (has_role(auth.uid(), 'trainer'::app_role) AND (created_by = auth.uid()));