export const routes = {
  home: '/',
  coach: '/interview-coach',
  login: '/interview-coach/login',
  register: '/interview-coach/register',
  dashboard: '/interview-coach/dashboard',
  resume: '/interview-coach/resume',
  analysis: '/interview-coach/analysis',
  interviews: '/interview-coach/interviews',
  interview: (id: string) => `/interview-coach/interview/${id}`,
  results: (id: string) => `/interview-coach/results/${id}`,
  legacyInterview: (id: string) => `/interview-coach/interviews/${id}`,
} as const;
