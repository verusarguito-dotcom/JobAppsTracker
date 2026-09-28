export type ApplicationStatus =
  | 'bookmarked'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn';

export interface Application {
  id: string;
  company_name: string;
  position_title: string;
  status: ApplicationStatus;
  job_type: 'remote' | 'onsite' | 'hybrid' | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  job_url: string | null;
  source: string | null;
  deadline_date: string | null;
  applied_date: string | null;
  follow_up_date: string | null;
  recruiter_name: string | null;
  recruiter_contact: string | null;
  cv_version: string | null;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationLog {
  id: number;
  application_id: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}
