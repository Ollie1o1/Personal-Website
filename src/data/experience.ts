// Source: ~/Desktop/hello/OliverRaczka_Resume.tex (Experience + Education sections).
export interface Role {
  when: string;
  title: string;
  org?: string;
  detail: string;
}

export const experience: Role[] = [
  {
    when: 'May 2024 — Present',
    title: 'Freelance Web Developer',
    detail:
      'Build and maintain websites for small-business clients with React and Node.js/Express, from scoping through deployment and post-launch support.',
  },
  {
    when: 'Apr 2025 — Present',
    title: 'Sales Representative',
    org: 'Desjardins',
    detail: 'Consult with clients daily, diagnosing their needs and explaining financial products and trade-offs clearly.',
  },
  {
    when: 'Jan 2024 — Jan 2025',
    title: 'Event Marketing Intern',
    org: 'Desjardins',
    detail: 'Coordinated cross-team logistics and one-on-one client consultations across concurrent events.',
  },
];

export const education = {
  school: 'University of Guelph',
  degree: 'Bachelor of Computing, Computer Science',
  when: 'Expected Apr 2028',
  coursework: ['Operating Systems', 'Data Structures', 'Algorithms', 'Statistics II', 'Calculus II', 'Discrete Structures'],
};
