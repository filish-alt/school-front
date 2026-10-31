const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

interface NullableString {
  String: string;
  Valid: boolean;
}

interface NullableInt {
  Int64: number;
  Valid: boolean;
}

interface NullableTime {
  Time: string;
  Valid: boolean;
}

export const unwrapString = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    if ('Valid' in v) {
      return v.Valid ? String(v.String ?? '') : '';
    }
    if ('String' in v) return String(v.String ?? '');
  }
  return '';
};

export const unwrapInt = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  if (typeof v === 'object') {
    if ('Valid' in v) {
      return v.Valid ? Number(v.Int64 ?? 0) : 0;
    }
    if ('Int64' in v) return Number(v.Int64 ?? 0);
  }
  return 0;
};

export const unwrapTime = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if ('Valid' in v) {
      return v.Valid ? String(v.Time ?? '') : '';
    }
    if ('Time' in v) return String(v.Time ?? '');
  }
  return '';
};

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

async function downloadBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  changePassword: (old_password: string, new_password: string) =>
    request<any>('/api/v1/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ old_password, new_password }),
    }),

  // Super Admin - Tenants
  getTenants: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/superadmin/tenants?page=${page}&page_size=${pageSize}`),
  getTenant: (id: string) =>
    request<any>(`/api/v1/superadmin/tenants/${id}`),
  createTenant: (data: { name: string; admin_username?: string; address: string; phone: string }) =>
    request<{ id: string; admin_username: string; admin_password: string }>('/api/v1/superadmin/tenants', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateTenant: (data: { id: string; name: string; address: string; phone: string }) =>
    request<any>('/api/v1/superadmin/tenants', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteTenant: (id: string) =>
    request<any>(`/api/v1/superadmin/tenants/${id}`, { method: 'DELETE' }),
  activateTenant: (id: string) =>
    request<any>(`/api/v1/superadmin/tenants/${id}/activate`, { method: 'POST' }),
  deactivateTenant: (id: string) =>
    request<any>(`/api/v1/superadmin/tenants/${id}/deactivate`, { method: 'POST' }),

  // Super Admin - Students
  getStudentsSuperAdmin: (tenantId: string, page = 1, pageSize = 100) =>
    request<any[]>(`/api/v1/superadmin/students?tenant_id=${tenantId}&page=${page}&page_size=${pageSize}`),
  createStudentSuperAdmin: (data: { tenant_id: string; student_code: string; first_name: string; last_name: string; email: string; section_id?: string; department_id?: string }) =>
    request<{ student_id: string; username: string; password: string }>('/api/v1/superadmin/students', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateStudentSuperAdmin: (id: string, data: any) =>
    request<any>(`/api/v1/superadmin/students/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteStudentSuperAdmin: (id: string) =>
    request<any>(`/api/v1/superadmin/students/${id}`, { method: 'DELETE' }),
  importStudentsSuperAdmin: (tenantId: string, file: File) => {
    const formData = new FormData();
    formData.append('tenant_id', tenantId);
    formData.append('file', file);
    return request<any>('/api/v1/superadmin/students/import', {
      method: 'POST', body: formData,
    });
  },

  // Super Admin - Sections (tenant-scoped)
  getSectionsSuperAdmin: (tenantId: string, page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/superadmin/sections?tenant_id=${tenantId}&page=${page}&page_size=${pageSize}`),

  // School Admin - Departments
  getDepartments: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/school/departments?page=${page}&page_size=${pageSize}`),
  createDepartment: (data: { name: string }) =>
    request<{ id: string }>('/api/v1/school/departments', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateDepartment: (data: { id: string; name: string }) =>
    request<any>('/api/v1/school/departments', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteDepartment: (id: string) =>
    request<any>(`/api/v1/school/departments/${id}`, { method: 'DELETE' }),

  // School Admin - Sections
  getSections: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/school/sections?page=${page}&page_size=${pageSize}`),
  createSection: (data: { name: string; grade_level: string; academic_year: string }) =>
    request<{ id: string }>('/api/v1/school/sections', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateSection: (data: { id: string; name: string }) =>
    request<any>('/api/v1/school/sections', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteSection: (id: string) =>
    request<any>(`/api/v1/school/sections/${id}`, { method: 'DELETE' }),

  // School Admin - Subjects
  getSubjects: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/school/subjects?page=${page}&page_size=${pageSize}`),
  createSubject: (data: { name: string }) =>
    request<{ id: string }>('/api/v1/school/subjects', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateSubject: (data: { id: string; name: string }) =>
    request<any>('/api/v1/school/subjects', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteSubject: (id: string) =>
    request<any>(`/api/v1/school/subjects/${id}`, { method: 'DELETE' }),

  // School Admin - Teachers & Staff
  getTeachers: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/school/teachers?page=${page}&page_size=${pageSize}`),
  createTeacher: (data: { first_name: string; last_name: string; email: string; teacher_code?: string; role_name?: string; department_id?: string }) =>
    request<{ teacher_id: string; username: string; password: string; role_name?: string }>('/api/v1/school/teachers', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateTeacher: (data: { id: string; first_name?: string; last_name?: string; role_name?: string; department_id?: string }) =>
    request<any>('/api/v1/school/teachers', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteTeacher: (id: string) =>
    request<any>(`/api/v1/school/teachers/${id}`, { method: 'DELETE' }),

  // School Admin - Assignments
  getAssignments: () =>
    request<any[]>('/api/v1/school/assignments'),
  createAssignment: (data: { teacher_id: string; subject_id: string; section_id: string }) =>
    request<any>('/api/v1/school/assignments', {
      method: 'POST', body: JSON.stringify(data),
    }),
  deleteAssignment: (data: { teacher_id: string; subject_id: string; section_id: string }) =>
    request<any>('/api/v1/school/assignments', {
      method: 'DELETE', body: JSON.stringify(data),
    }),

  // School Admin - Violations
  getViolations: () =>
    request<any[]>('/api/v1/school/violations'),

  // Teacher - Question Banks
  getQuestionBanks: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/teacher/question-banks?page=${page}&page_size=${pageSize}`),
  createQuestionBank: (data: { subject_id: string; title: string }) =>
    request<{ id: string }>('/api/v1/teacher/question-banks', {
      method: 'POST', body: JSON.stringify(data),
    }),

  // Teacher - Questions
  getQuestions: (bankId: string, page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/teacher/questions?bank_id=${bankId}&page=${page}&page_size=${pageSize}`),
  createQuestion: (data: { question_bank_id: string; type: string; question_text: string; marks: number; difficulty_level: string; image_url?: string }) =>
    request<{ id: string }>('/api/v1/teacher/questions', {
      method: 'POST', body: JSON.stringify(data),
    }),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string }>('/api/v1/school/upload', {
      method: 'POST', body: formData,
    });
  },
  uploadQuestionImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string }>('/api/v1/teacher/upload', {
      method: 'POST', body: formData,
    });
  },
  updateQuestion: (data: { id: string; question_text?: string; type?: string; marks?: number; difficulty_level?: string; image_url?: string }) =>
    request<any>('/api/v1/teacher/questions', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteQuestion: (id: string) =>
    request<any>(`/api/v1/teacher/questions/${id}`, { method: 'DELETE' }),
  importQuestions: (bankId: string, file: File) => {
    const formData = new FormData();
    formData.append('bank_id', bankId);
    formData.append('file', file);
    return request<any>('/api/v1/teacher/questions/import', {
      method: 'POST', body: formData,
    });
  },

  // Teacher - Options
  getOptions: (questionId: string, page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/teacher/options?question_id=${questionId}&page=${page}&page_size=${pageSize}`),
  createOption: (data: { question_id: string; option_text: string; is_correct: boolean }) =>
    request<{ id: string }>('/api/v1/teacher/options', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateOption: (data: { id: string; option_text: string; is_correct: boolean }) =>
    request<any>('/api/v1/teacher/options', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteOption: (id: string) =>
    request<any>(`/api/v1/teacher/options/${id}`, { method: 'DELETE' }),

  // Teacher - Exams
  getExams: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/teacher/exams?page=${page}&page_size=${pageSize}`),
  getExam: (id: string) =>
    request<any>(`/api/v1/teacher/exams/${id}`),
  createExam: (data: { title: string; subject_id: string; section_id: string; duration_minutes: number; start_time: string; end_time: string }) =>
    request<{ id: string }>('/api/v1/teacher/exams', {
      method: 'POST', body: JSON.stringify(data),
    }),
  updateExam: (data: { id: string; title?: string; shuffle_options?: boolean }) =>
    request<any>('/api/v1/teacher/exams', {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  updateExamStatus: (id: string, status: string) =>
    request<any>(`/api/v1/teacher/exams/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
  addExamQuestions: (data: { exam_id: string; questions: { question_id: string; marks: number; order_index: number }[]; shuffle_options?: boolean }) =>
    request<any>('/api/v1/teacher/exams/questions', {
      method: 'POST', body: JSON.stringify(data),
    }),
  addRandomExamQuestions: (data: { exam_id: string; question_bank_id: string; count: number; marks: number; shuffle_options?: boolean }) =>
    request<any>('/api/v1/teacher/exams/questions/random', {
      method: 'POST', body: JSON.stringify(data),
    }),
  deleteExamQuestion: (examQuestionId: string, examId: string) =>
    request<any>(`/api/v1/teacher/exams/questions/${examQuestionId}?exam_id=${examId}`, { method: 'DELETE' }),
  getExamQuestions: (examId: string) =>
    request<any>(`/api/v1/teacher/exams/${examId}/questions`),
  getExamMarks: (examId: string) =>
    request<any>(`/api/v1/teacher/exams/${examId}/marks`),
  downloadExamMarks: (examId: string) =>
    downloadBlob(`/api/v1/teacher/exams/${examId}/marks/download`),
  getTeacherStudents: (page = 1, pageSize = 20) =>
    request<any[]>(`/api/v1/teacher/students?page=${page}&page_size=${pageSize}`),

  // Teacher - My Assignments
  getMyAssignments: () =>
    request<any[]>('/api/v1/teacher/my-assignments'),

  // Teacher helper: get subjects/sections from my assignments
  getTeacherSubjects: async () => {
    const assignments = await api.getMyAssignments().catch(() => [] as any[]);
    const map = new Map<string, string>();
    (assignments || []).forEach((a: any) => { if (a.subject_id) map.set(a.subject_id, a.subject_name); });
    return Array.from(map, ([subject_id, subject_name]) => ({ subject_id, subject_name }));
  },
  getTeacherSections: async () => {
    const assignments = await api.getMyAssignments().catch(() => [] as any[]);
    const map = new Map<string, string>();
    (assignments || []).forEach((a: any) => { if (a.section_id) map.set(a.section_id, a.section_name); });
    return Array.from(map, ([section_id, section_name]) => ({ section_id, section_name }));
  },

  // Student - Exams
  getStudentExams: () =>
    request<any[]>('/api/v1/student/exams'),
  getStudentExam: (id: string) =>
    request<any>(`/api/v1/student/exams/${id}`),

  // Student - Sessions
  getStudentSessions: () =>
    request<any[]>('/api/v1/student/sessions'),
  startSession: (examId: string) =>
    request<{ id: string }>('/api/v1/student/sessions/start', {
      method: 'POST', body: JSON.stringify({ exam_id: examId }),
    }),
  submitAnswer: (data: { session_id: string; question_id: string; selected_option_id: string }) =>
    request<any>('/api/v1/student/sessions/answers', {
      method: 'POST', body: JSON.stringify(data),
    }),
  submitSession: (sessionId: string) =>
    request<any>('/api/v1/student/sessions/submit', {
      method: 'POST', body: JSON.stringify({ session_id: sessionId }),
    }),
  getSession: (sessionId: string) =>
    request<any>(`/api/v1/student/sessions/${sessionId}`),

  // Super Admin & School - Academic Years & Settings
  getAcademicYears: (tenantId?: string) => {
    const token = getToken();
    const claims = parseJwt(token || '');
    const role = claims?.role;
    if (role && role !== 'super_admin') {
      return request<any[]>('/api/v1/school/academic-years');
    }
    return request<any[]>(`/api/v1/superadmin/academic-years${tenantId ? `?tenant_id=${tenantId}` : ''}`);
  },
  createAcademicYear: (data: { tenant_id?: string; year_name: string; start_date?: string; end_date?: string }) =>
    request<{ id: string }>('/api/v1/superadmin/academic-years', {
      method: 'POST', body: JSON.stringify(data),
    }),
  setActiveAcademicYear: (id: string) =>
    request<any>(`/api/v1/superadmin/academic-years/${id}/activate`, { method: 'POST' }),
  deleteAcademicYear: (id: string) =>
    request<any>(`/api/v1/superadmin/academic-years/${id}`, { method: 'DELETE' }),

  getSystemSettings: () => {
    return request<any[]>('/api/v1/settings');
  },
  saveSystemSetting: (data: { key: string; value: string }) => {
    return request<any>('/api/v1/settings', {
      method: 'POST', body: JSON.stringify(data),
    });
  },

  // Super Admin - Audit Logs & Backups
  getAuditLogs: (page = 1, pageSize = 50) =>
    request<any[]>(`/api/v1/superadmin/audit-logs?page=${page}&page_size=${pageSize}`),
  createBackup: () =>
    request<{ status: string; path: string }>('/api/v1/superadmin/backups', { method: 'POST' }),
  getBackups: () =>
    request<any[]>('/api/v1/superadmin/backups'),

  // School - Timetables & Schedules
  createSchedule: (data: { teacher_id: string; subject_id?: string; section_id?: string; day_of_week: string; start_time: string; end_time: string; room?: string; activity_type?: string }) =>
    request<{ id: string }>('/api/v1/school/schedules', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getTeacherSchedules: (teacherId: string) =>
    request<any[]>(`/api/v1/school/schedules/teacher/${teacherId}`),
  getSectionSchedules: (sectionId: string) =>
    request<any[]>(`/api/v1/school/schedules/section/${sectionId}`),
  deleteSchedule: (id: string) =>
    request<any>(`/api/v1/school/schedules/${id}`, { method: 'DELETE' }),

  // School - Results & Transfer Sheet
  calculateResults: (data: { section_id: string; subject_id: string; academic_year_id?: string }) =>
    request<any>('/api/v1/school/results/calculate', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getTransferSheet: (sectionId: string) =>
    request<any[]>(`/api/v1/school/results/transfer-sheet/${sectionId}`),

  // School - Complaints
  getSchoolComplaints: (status?: string) =>
    request<any[]>(`/api/v1/school/complaints${status ? `?status=${status}` : ''}`),
  resolveComplaint: (id: string, data: { status: string; response: string }) =>
    request<any>(`/api/v1/school/complaints/${id}/resolve`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),

  // Teacher - Coursework (Continuous Assessment)
  createCoursework: (data: { subject_id: string; section_id: string; title: string; type: string; max_marks: number; weight_percentage: number; due_date?: string; academic_year_id?: string }) =>
    request<{ id: string }>('/api/v1/teacher/coursework', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getMyCoursework: () =>
    request<any[]>('/api/v1/teacher/my-coursework'),
  getCourseworkBySectionSubject: (sectionId: string, subjectId: string) =>
    request<any[]>(`/api/v1/teacher/coursework?section_id=${sectionId}&subject_id=${subjectId}`),
  saveCourseworkMark: (data: { coursework_id: string; student_id: string; marks_obtained: number; remarks?: string }) =>
    request<any>('/api/v1/teacher/coursework/marks', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getCourseworkMarks: (courseworkId: string) =>
    request<any[]>(`/api/v1/teacher/coursework/${courseworkId}/marks`),

  // Teacher - Live Controls & Security
  updateExamControls: (examId: string, data: { is_started?: boolean; is_visible?: boolean; is_locked?: boolean; status?: string; approval_status?: string; access_code?: string }) =>
    request<any>(`/api/v1/teacher/exams/${examId}/controls`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  addExamExtension: (data: { exam_id: string; student_id?: string; extended_minutes: number; reason: string }) =>
    request<any>('/api/v1/teacher/exams/extensions', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getExamExtensions: (examId: string) =>
    request<any[]>(`/api/v1/teacher/exams/${examId}/extensions`),
  addRemoteAuthorization: (data: { exam_id: string; student_id: string; valid_until: string; reason: string }) =>
    request<any>('/api/v1/teacher/exams/remote-authorizations', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getRemoteAuthorizations: (examId: string) =>
    request<any[]>(`/api/v1/teacher/exams/${examId}/remote-authorizations`),
  dropExamQuestion: (data: { exam_id: string; question_id: string; reason: string; credit_type?: string }) =>
    request<any>('/api/v1/teacher/exams/drop-question', {
      method: 'POST', body: JSON.stringify(data),
    }),
  correctAnswerKey: (data: { exam_id: string; question_id: string; old_answer?: string; new_answer: string; reason: string }) =>
    request<any>('/api/v1/teacher/exams/correct-key', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getEmergencyExamPackage: (examId: string) =>
    request<any>(`/api/v1/teacher/exams/${examId}/emergency-package`),
  getMySchedule: () =>
    request<any[]>('/api/v1/teacher/my-schedule'),

  // Matching Pairs
  setMatchPairs: (questionId: string, pairs: { left_prompt: string; right_match: string; order_index?: number }[]) =>
    request<any>(`/api/v1/teacher/questions/${questionId}/match-pairs`, {
      method: 'POST', body: JSON.stringify(pairs),
    }),
  getMatchPairs: (questionId: string) =>
    request<any[]>(`/api/v1/teacher/questions/${questionId}/match-pairs`),

  // Student - Marks & Results
  getMyMarks: () =>
    request<any[]>('/api/v1/student/my-marks'),
  getMyResults: () =>
    request<any[]>('/api/v1/student/my-results'),

  // Student - Complaints
  createComplaint: (data: { subject_id?: string; exam_id?: string; coursework_id?: string; question_id?: string; category: string; description: string }) =>
    request<{ id: string }>('/api/v1/student/complaints', {
      method: 'POST', body: JSON.stringify(data),
    }),
  getMyComplaints: () =>
    request<any[]>('/api/v1/student/my-complaints'),
};
