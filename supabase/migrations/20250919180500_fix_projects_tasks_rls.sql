-- Drop existing RLS policies for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Drop existing RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Create new RLS policies for projects (allow all users to view/manage all projects)
CREATE POLICY "Users can view all projects"
    ON public.projects
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update all projects"
    ON public.projects
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete all projects"
    ON public.projects
    FOR DELETE
    USING (true);

-- Create new RLS policies for tasks (allow all users to view/manage all tasks)
CREATE POLICY "Users can view all tasks"
    ON public.tasks
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert tasks"
    ON public.tasks
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update all tasks"
    ON public.tasks
    FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete all tasks"
    ON public.tasks
    FOR DELETE
    USING (true);
