'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';

export default function ResumePage() {
  const [resumeStatus, setResumeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [jobStatus, setJobStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resumeName, setResumeName] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');

  async function handleResumeUpload(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setResumeStatus('loading');

    await new Promise((resolve) => setTimeout(resolve, 850));

    if (!resumeName.toLowerCase().endsWith('.pdf')) {
      setResumeStatus('error');
      return;
    }

    setResumeStatus('success');
  }

  async function handleJobSave(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setJobStatus('loading');

    await new Promise((resolve) => setTimeout(resolve, 750));

    if (jobDescription.trim().length < 80) {
      setJobStatus('error');
      return;
    }

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
                  onChange={(event) => setResumeName(event.target.files?.[0]?.name ?? '')}
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
                  message="Resume metadata is ready for async processing and analysis."
                />
              ) : null}
              {resumeStatus === 'error' ? (
                <FeedbackState
                  variant="error"
                  title="Upload failed"
                  message="Only PDF files are accepted in this MVP phase."
                />
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
                  message="You can now proceed to the resume analysis page."
                />
              ) : null}
              {jobStatus === 'error' ? (
                <FeedbackState
                  variant="error"
                  title="Need more details"
                  message="Provide at least a short paragraph so AI can match role expectations accurately."
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
