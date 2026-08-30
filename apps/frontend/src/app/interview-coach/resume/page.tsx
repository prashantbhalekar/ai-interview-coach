'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ApiClientError, apiRequest, apiUpload } from '@/lib/api-client';
import type { ResumeStatusResponse, ResumeUploadResponse } from '@/lib/contracts';
import { routes } from '@/lib/routes';

const STORAGE_KEY = 'aiic.resumeContext.v1';

interface PersistedResumeContext {
  resumeId: string;
  resumeFileName: string;
  resumeStatus: string;
  resumeText: string;
  jobDescription: string;
  updatedAt: string;
}

export default function ResumePage() {
  const [resumeStatus, setResumeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [jobStatus, setJobStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeErrorMessage, setResumeErrorMessage] = useState('Unable to upload resume.');
  const [jobErrorMessage, setJobErrorMessage] = useState('Unable to save job context.');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PersistedResumeContext>;
      setResumeName(parsed.resumeFileName ?? '');
      setResumeText(parsed.resumeText ?? '');
      setJobDescription(parsed.jobDescription ?? '');
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function getAccessToken(): string | null {
    return localStorage.getItem('aiic.accessToken');
  }

  function persistContext(context: PersistedResumeContext): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  }

  async function waitForStableResumeStatus(
    token: string,
    resumeId: string,
  ): Promise<ResumeStatusResponse | null> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const status = await apiRequest<ResumeStatusResponse>(`/resumes/${resumeId}/status`, {
          token,
        });

        if (status.status === 'QUEUED' || status.status === 'PROCESSING') {
          await new Promise((resolve) => setTimeout(resolve, 700));
          continue;
        }

        return status;
      } catch {
        return null;
      }
    }

    return null;
  }

  async function handleResumeUpload(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setResumeStatus('loading');
    setResumeErrorMessage('Unable to upload resume.');

    const token = getAccessToken();
    if (!token) {
      setResumeErrorMessage('Please log in before uploading a resume.');
      setResumeStatus('error');
      return;
    }

    if (!resumeFile || !resumeName.toLowerCase().endsWith('.pdf')) {
      setResumeErrorMessage('Only PDF files are accepted in this MVP phase.');
      setResumeStatus('error');
      return;
    }

    if (resumeText.trim().length < 120) {
      setResumeErrorMessage(
        'Add resume text (at least 120 characters) before uploading so analysis can run reliably.',
      );
      setResumeStatus('error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);

      const upload = await apiUpload<ResumeUploadResponse>('/resumes/upload', formData, {
        token,
      });
      const status = await waitForStableResumeStatus(token, upload.resumeId);

      persistContext({
        resumeId: upload.resumeId,
        resumeFileName: upload.fileName,
        resumeStatus: status?.status ?? upload.status,
        resumeText,
        jobDescription,
        updatedAt: new Date().toISOString(),
      });

      setResumeStatus('success');
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setResumeErrorMessage(error.message);
      }
      setResumeStatus('error');
    }
  }

  async function handleJobSave(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setJobStatus('loading');
    setJobErrorMessage('Unable to save job context.');

    if (jobDescription.trim().length < 80) {
      setJobErrorMessage(
        'Provide at least a short paragraph so AI can match role expectations accurately.',
      );
      setJobStatus('error');
      return;
    }

    if (resumeText.trim().length < 120) {
      setJobErrorMessage(
        'Add resume text (at least 120 characters) to save analysis-ready context.',
      );
      setJobStatus('error');
      return;
    }

    let existing: Partial<PersistedResumeContext> = {};
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw) as Partial<PersistedResumeContext>;
      } catch {
        existing = {};
      }
    }

    persistContext({
      resumeId: existing.resumeId ?? '',
      resumeFileName: existing.resumeFileName ?? resumeName,
      resumeStatus: existing.resumeStatus ?? 'READY',
      resumeText,
      jobDescription,
      updatedAt: new Date().toISOString(),
    });

    setJobStatus('success');
  }

  return (
    <AppShell>
      <section className="stack">
        <div>
          <h1 className="page-title">Resume and Job Context</h1>
          <p className="page-subtitle">
            Upload a PDF resume and add target job description to generate focused insights.
          </p>
        </div>
        <section className="info-grid">
          <Card title="Upload Resume" eyebrow="Step 1">
            <form className="form-grid" onSubmit={handleResumeUpload}>
              <label>
                Resume PDF
                <input
                  className="input"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setResumeFile(file);
                    setResumeName(file?.name ?? '');
                  }}
                />
              </label>
              <label>
                Resume Text
                <textarea
                  className="textarea"
                  placeholder="Paste resume text (minimum 120 characters) so AI can run structured analysis..."
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  required
                  minLength={120}
                />
              </label>
              {resumeStatus === 'idle' && !resumeName ? (
                <EmptyState
                  title="No resume uploaded yet"
                  message="Upload a PDF to begin context-aware interview preparation."
                />
              ) : null}
              {resumeStatus === 'loading' ? (
                <LoadingState label="Uploading and validating resume..." />
              ) : null}
              {resumeStatus === 'success' ? (
                <FeedbackState
                  variant="success"
                  title="Resume uploaded"
                  message="Resume metadata is queued and context is saved. Proceed to analysis when job details are ready."
                />
              ) : null}
              {resumeStatus === 'error' ? (
                <FeedbackState variant="error" title="Upload failed" message={resumeErrorMessage} />
              ) : null}
              <Button type="submit" disabled={resumeStatus === 'loading'}>
                {resumeStatus === 'loading' ? 'Uploading...' : 'Upload Resume'}
              </Button>
            </form>
          </Card>
          <Card title="Job Description" eyebrow="Step 2">
            <form className="form-grid" onSubmit={handleJobSave}>
              <label>
                Paste Job Description
                <textarea
                  className="textarea"
                  placeholder="Paste the role requirements, responsibilities, and preferred skills..."
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                />
              </label>
              {jobStatus === 'idle' && !jobDescription ? (
                <EmptyState
                  title="No job description added"
                  message="Add enough context so analysis can produce meaningful skill comparisons."
                />
              ) : null}
              {jobStatus === 'loading' ? <LoadingState label="Saving job context..." /> : null}
              {jobStatus === 'success' ? (
                <FeedbackState
                  variant="success"
                  title="Job description saved"
                  message="Context is saved. Run live resume analysis from the next step."
                  actions={
                    <Link href={routes.analysis} className="btn btn-secondary">
                      Open Analysis
                    </Link>
                  }
                />
              ) : null}
              {jobStatus === 'error' ? (
                <FeedbackState
                  variant="error"
                  title="Need more details"
                  message={jobErrorMessage}
                />
              ) : null}
              <Button type="submit" disabled={jobStatus === 'loading'}>
                {jobStatus === 'loading' ? 'Saving...' : 'Save Description'}
              </Button>
            </form>
          </Card>
        </section>
      </section>
    </AppShell>
  );
}
