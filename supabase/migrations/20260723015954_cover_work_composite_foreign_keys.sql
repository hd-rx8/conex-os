create index work_lists_folder_space_idx
  on public.lists(folder_id, space_id);

create index work_subtasks_parent_task_idx
  on public.subtasks(parent_subtask_id, task_id);
