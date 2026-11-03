-- Demo content for GU Tech LMS.
-- Run after both migrations. Uses existing profiles only; does not create users
-- or alter profiles/roles. Safe to run more than once.

do $$
declare
  v_admin_id uuid;
  v_actor_id uuid;
  v_teacher_id uuid;
  v_student_id uuid;
begin
  select p.id
  into v_admin_id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where r.role = 'admin'
  order by p.created_at
  limit 1;

  select p.id
  into v_teacher_id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where r.role = 'teacher'
  order by p.created_at
  limit 1;

  select p.id
  into v_student_id
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where r.role = 'student'
  order by p.created_at
  limit 1;

  select id into v_actor_id
  from public.profiles
  order by created_at
  limit 1;

  if v_actor_id is null then
    raise exception 'Create at least one Auth user with a public.profiles row before running the demo seed.';
  end if;

  v_teacher_id := coalesce(v_teacher_id, v_admin_id, v_actor_id);
  v_student_id := coalesce(v_student_id, v_actor_id);

  insert into public.courses (id, code, title, description)
  values
    ('10000000-0000-4000-8000-000000000001', 'DEMO-CS101', 'Introduction to Computer Science', 'Programming fundamentals, problem solving, and computational thinking.'),
    ('10000000-0000-4000-8000-000000000002', 'DEMO-DS201', 'Data Structures and Algorithms', 'Core data structures, algorithm design, and complexity analysis.'),
    ('10000000-0000-4000-8000-000000000003', 'DEMO-WEB301', 'Modern Web Development', 'Build accessible, responsive web applications using modern browser technologies.')
  on conflict (id) do update set
    code = excluded.code,
    title = excluded.title,
    description = excluded.description,
    is_archived = false;

  insert into public.course_teachers (course_id, teacher_id)
  values
    ('10000000-0000-4000-8000-000000000001', v_teacher_id),
    ('10000000-0000-4000-8000-000000000002', v_teacher_id),
    ('10000000-0000-4000-8000-000000000003', v_teacher_id)
  on conflict do nothing;

  insert into public.enrollments (course_id, student_id)
  values
    ('10000000-0000-4000-8000-000000000001', v_student_id),
    ('10000000-0000-4000-8000-000000000002', v_student_id),
    ('10000000-0000-4000-8000-000000000003', v_student_id)
  on conflict do nothing;

  insert into public.announcements (id, course_id, author_id, title, body, is_pinned, created_at)
  values
    ('60000000-0000-4000-8000-000000000001', null, v_actor_id, 'Welcome to the new semester', 'Welcome to GU Tech. Check your course pages for schedules, resources, and assessment dates. Please contact your instructor if you need help accessing a class.', true, now() - interval '2 days'),
    ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', v_teacher_id, 'Week 1: Getting started', 'Our first session introduces problem decomposition, algorithms, and the course development environment. Please bring a laptop if possible.', false, now() - interval '1 day'),
    ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', v_teacher_id, 'Lab groups and office hours', 'Lab groups will meet on Tuesday and Thursday this week. Office hours are Wednesday from 14:00 to 16:00.', false, now() - interval '5 hours')
  on conflict (id) do update set
    course_id = excluded.course_id,
    author_id = excluded.author_id,
    title = excluded.title,
    body = excluded.body,
    is_pinned = excluded.is_pinned,
    created_at = excluded.created_at;

  insert into public.assignments (id, course_id, created_by, title, instructions, max_marks, due_at, allow_late)
  values
    ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', v_teacher_id, 'Algorithm Design Reflection', 'Describe how you would break a campus-room booking problem into smaller steps. Include pseudocode and explain one edge case.', 20, now() + interval '7 days', false),
    ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', v_teacher_id, 'Compare Two Data Structures', 'Compare an array and a linked list for insertion, lookup, and memory usage. Use a short example to support your answer.', 15, now() + interval '10 days', true),
    ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', v_teacher_id, 'Accessible Course Card', 'Create a semantic course card with a heading, descriptive text, and a keyboard-accessible link. Explain two accessibility choices.', 25, now() + interval '14 days', false)
  on conflict (id) do update set
    course_id = excluded.course_id,
    created_by = excluded.created_by,
    title = excluded.title,
    instructions = excluded.instructions,
    max_marks = excluded.max_marks,
    due_at = excluded.due_at,
    allow_late = excluded.allow_late;

  insert into public.submissions (assignment_id, student_id, text_answer)
  values (
    '20000000-0000-4000-8000-000000000001',
    v_student_id,
    'I would first collect the available rooms and requested time slots, then check each request against room capacity and existing bookings. One edge case is two requests arriving for the same room and time; the booking should be accepted only once.'
  )
  on conflict (assignment_id, student_id) do nothing;

  insert into public.quizzes (id, course_id, created_by, title, description, time_limit_minutes, opens_at, closes_at, is_published)
  values
    ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', v_teacher_id, 'Programming Fundamentals Check-in', 'A short check-in on algorithms, variables, and basic programming concepts.', 20, now() - interval '1 day', now() + interval '14 days', true),
    ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', v_teacher_id, 'Data Structures Quiz', 'Review the properties and typical uses of common data structures.', 25, now() - interval '1 day', now() + interval '14 days', true)
  on conflict (id) do update set
    course_id = excluded.course_id,
    created_by = excluded.created_by,
    title = excluded.title,
    description = excluded.description,
    time_limit_minutes = excluded.time_limit_minutes,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at,
    is_published = excluded.is_published;

  insert into public.quiz_questions (id, quiz_id, position, type, prompt, options, marks)
  values
    ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1, 'mcq_single', 'Which step should come first when designing an algorithm?', '[{"id":"a","text":"Write the final code"},{"id":"b","text":"Understand and define the problem"},{"id":"c","text":"Choose a font"}]'::jsonb, 2),
    ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 2, 'true_false', 'A variable can hold a value that changes while a program runs.', '[{"id":"t","text":"True"},{"id":"f","text":"False"}]'::jsonb, 1),
    ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 3, 'mcq_multi', 'Which are common properties of a well-designed algorithm?', '[{"id":"a","text":"Clear steps"},{"id":"b","text":"A defined result"},{"id":"c","text":"Unnecessary ambiguity"}]'::jsonb, 2),
    ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 1, 'mcq_single', 'Which data structure follows the last-in, first-out principle?', '[{"id":"a","text":"Queue"},{"id":"b","text":"Stack"},{"id":"c","text":"Graph"}]'::jsonb, 2),
    ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000002', 2, 'mcq_single', 'Which structure is designed for first-in, first-out processing?', '[{"id":"a","text":"Queue"},{"id":"b","text":"Tree"},{"id":"c","text":"Stack"}]'::jsonb, 2),
    ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000002', 3, 'true_false', 'Binary search on a sorted array runs in logarithmic time.', '[{"id":"t","text":"True"},{"id":"f","text":"False"}]'::jsonb, 1)
  on conflict (id) do update set
    quiz_id = excluded.quiz_id,
    position = excluded.position,
    type = excluded.type,
    prompt = excluded.prompt,
    options = excluded.options,
    marks = excluded.marks;

  insert into public.quiz_answers (question_id, correct_option_ids)
  values
    ('40000000-0000-4000-8000-000000000001', array['b']),
    ('40000000-0000-4000-8000-000000000002', array['t']),
    ('40000000-0000-4000-8000-000000000003', array['a', 'b']),
    ('40000000-0000-4000-8000-000000000004', array['b']),
    ('40000000-0000-4000-8000-000000000005', array['a']),
    ('40000000-0000-4000-8000-000000000006', array['t'])
  on conflict (question_id) do update set correct_option_ids = excluded.correct_option_ids;

  insert into public.quiz_attempts (quiz_id, student_id, started_at, submitted_at, answers, score)
  values
    (
      '30000000-0000-4000-8000-000000000001',
      v_student_id,
      now() - interval '3 hours',
      now() - interval '2 hours 40 minutes',
      '{"40000000-0000-4000-8000-000000000001":["b"],"40000000-0000-4000-8000-000000000002":["t"],"40000000-0000-4000-8000-000000000003":["a","b"]}'::jsonb,
      5
    ),
    (
      '30000000-0000-4000-8000-000000000002',
      v_student_id,
      now() - interval '2 hours',
      now() - interval '1 hour 40 minutes',
      '{"40000000-0000-4000-8000-000000000004":["b"],"40000000-0000-4000-8000-000000000005":["a"],"40000000-0000-4000-8000-000000000006":["t"]}'::jsonb,
      5
    )
  on conflict (quiz_id, student_id) do update set
    started_at = excluded.started_at,
    submitted_at = excluded.submitted_at,
    answers = excluded.answers,
    score = excluded.score;

  insert into public.chat_messages (id, course_id, sender_id, body, created_at)
  values
    ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', v_teacher_id, 'Welcome to CS101! Please introduce yourself and share one thing you hope to learn this term.', now() - interval '2 hours'),
    ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', v_student_id, 'I am looking forward to improving my problem-solving skills and learning how to write cleaner code.', now() - interval '90 minutes'),
    ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', v_teacher_id, 'That is a great goal. We will practice breaking larger problems into manageable steps in our first lab.', now() - interval '1 hour'),
    ('70000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', v_student_id, 'Would you recommend drawing a diagram before implementing a linked list?', now() - interval '35 minutes')
  on conflict (id) do update set
    course_id = excluded.course_id,
    sender_id = excluded.sender_id,
    body = excluded.body,
    created_at = excluded.created_at;

  insert into public.complaints (id, raised_by, course_id, category, subject, description, status, admin_response, resolved_by, created_at)
  values
    ('50000000-0000-4000-8000-000000000001', v_student_id, '10000000-0000-4000-8000-000000000001', 'technical', 'Unable to open a course resource', 'The resource page displays the file, but the download does not start in my browser. I have tried refreshing and signing in again.', 'open', null, null, now() - interval '1 day'),
    ('50000000-0000-4000-8000-000000000002', v_student_id, '10000000-0000-4000-8000-000000000002', 'academic', 'Clarification on lab submission format', 'Could you confirm whether the complexity analysis should be included in the written report or submitted as a separate file?', 'in_review', 'The teaching team is checking the lab instructions and will post a clarification shortly.', null, now() - interval '2 days'),
    ('50000000-0000-4000-8000-000000000003', v_student_id, null, 'facility', 'Study room opening hours', 'The posted study room hours appear to differ from the schedule on the door. Please confirm the current hours.', 'resolved', 'The room is open from 08:00 to 18:00 on weekdays. The posted schedule has been updated.', v_admin_id, now() - interval '4 days'),
    ('50000000-0000-4000-8000-000000000004', v_student_id, '10000000-0000-4000-8000-000000000003', 'other', 'Sample closed request', 'This sample record demonstrates how a completed request appears in the complaint list.', 'rejected', 'This was added as demo content and does not require action.', v_admin_id, now() - interval '5 days')
  on conflict (id) do update set
    raised_by = excluded.raised_by,
    course_id = excluded.course_id,
    category = excluded.category,
    subject = excluded.subject,
    description = excluded.description,
    status = excluded.status,
    admin_response = excluded.admin_response,
    resolved_by = excluded.resolved_by,
    created_at = excluded.created_at;
end
$$;
