export interface LinkSource { email: string; github: string; linkedin: string | null }
export interface SocialLink { label: string; href: string }

export function socialLinks(s: LinkSource): SocialLink[] {
  const links: SocialLink[] = [
    { label: 'Email', href: `mailto:${s.email}` },
    { label: 'GitHub', href: s.github },
  ];
  if (s.linkedin) links.push({ label: 'LinkedIn', href: s.linkedin });
  return links;
}
