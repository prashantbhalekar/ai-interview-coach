'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackState } from '@/components/ui/feedback-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError, apiRequest, apiUpload } from '@/lib/api-client';
import type { ResumeStatusResponse, ResumeUploadResponse } from '@/lib/contracts';
import {
  clearResumeContextForToken,
  loadResumeContextForToken,
  saveResumeContextForToken,
} from '@/lib/resume-context';
import { routes } from '@/lib/routes';

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeStatus, setResumeStatus] = useState<
    'empty' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed'
  >('empty');
  const [jobStatus, setJobStatus] = useState<'empty' | 'editing' | 'saving' | 'saved' | 'failed'>(
    'empty',
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeErrorMessage, setResumeErrorMessage] = useState('Unable to upload resume.');
  const [jobErrorMessage, setJobErrorMessage] = useState('Unable to save job context.');
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const parsed = loadResumeContextForToken(token);
    if (!parsed) {
      return;
    }

    setResumeName(parsed.resumeFileName ?? '');
    setResumeText(parsed.resumeText ?? '');
    setJobDescription(parsed.jobDescription ?? '');

    if ((parsed.resumeFileName ?? '').trim()) {
      const normalizedStatus = normalizeResumeStatus(parsed.resumeStatus ?? 'READY');
      setResumeStatus(normalizedStatus);
    }

    if ((parsed.jobDescription ?? '').trim().length >= 80) {
      setJobStatus('saved');
    } else if ((parsed.jobDescription ?? '').trim().length > 0) {
      setJobStatus('editing');
    }

    if ((parsed.resumeId ?? '').trim()) {
      void (async () => {
        try {
          const status = await apiRequest<ResumeStatusResponse>(
            `/resumes/${parsed.resumeId}/status`,
            {
              token,
            },
          );

          const normalizedStatus = normalizeResumeStatus(status.status);
          setResumeStatus(normalizedStatus);
          setResumeName(status.fileName);

          saveResumeContextForToken(token, {
            ...parsed,
            resumeFileName: status.fileName,
            resumeStatus: normalizedStatus,
            updatedAt: new Date().toISOString(),
          });
        } catch (error: unknown) {
          if (error instanceof ApiClientError && (error.status === 401 || error.status === 404)) {
            clearResumeContextForToken(token);
            setResumeFile(null);
            setResumeName('');
            setResumeText('');
            setJobDescription('');
            setResumeStatus('empty');
            setJobStatus('empty');
          }
        }
      })();
    }
  }, []);

  useEffect(() => {
    const trimmed = jobDescription.trim();
    if (!trimmed && jobStatus !== 'saving' && jobStatus !== 'saved') {
      setJobStatus('empty');
      return;
    }

    if (trimmed.length > 0 && jobStatus !== 'saving' && jobStatus !== 'saved') {
      setJobStatus('editing');
    }
  }, [jobDescription, jobStatus]);

  function getAccessToken(): string | null {
    return localStorage.getItem('aiic.accessToken');
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

  function setSelectedFile(file: File | null): void {
    if (!file) {
      setResumeFile(null);
      setResumeName('');
      setResumeStatus('empty');
      return;
    }

    setResumeFile(file);
    setResumeName(file.name);
    setResumeStatus('selected');
    setResumeErrorMessage('Unable to upload resume.');
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setResumeStatus('failed');
      setResumeErrorMessage('Only PDF files are supported.');
      return;
    }

    setSelectedFile(file);
  }

  async function handleResumeUpload(): Promise<void> {
    setResumeStatus('uploading');
    setResumeErrorMessage('Unable to upload resume.');

    const token = getAccessToken();
    if (!token) {
      setResumeErrorMessage('Please log in before uploading a resume.');
      setResumeStatus('failed');
      return;
    }

    if (!resumeFile || !resumeName.toLowerCase().endsWith('.pdf')) {
      setResumeErrorMessage('Only PDF files are supported.');
      setResumeStatus('failed');
      return;
    }

    if (resumeText.trim().length < 120) {
      setResumeErrorMessage('Add resume text (at least 120 characters) before uploading.');
      setResumeStatus('failed');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);

      const upload = await apiUpload<ResumeUploadResponse>('/resumes/upload', formData, {
        token,
      });

      setResumeStatus('processing');
      const status = await waitForStableResumeStatus(token, upload.resumeId);
      const normalizedStatus = normalizeResumeStatus(status?.status ?? upload.status);

      saveResumeContextForToken(token, {
        resumeId: upload.resumeId,
        resumeFileName: upload.fileName,
        resumeStatus: normalizedStatus,
        resumeText,
        jobDescription,
        updatedAt: new Date().toISOString(),
      });

      setResumeStatus(normalizedStatus);
      setResumeName(upload.fileName);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setResumeErrorMessage(error.message);
      }
      setResumeStatus('failed');
    }
  }

  async function handleJobSave(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setJobStatus('saving');
    setJobErrorMessage('Unable to save job context.');

    if (jobDescription.trim().length < 80) {
      setJobErrorMessage(
        'Provide at least a short paragraph so AI can match role expectations accurately.',
      );
      setJobStatus('failed');
      return;
    }

    if (resumeText.trim().length < 120) {
      setJobErrorMessage(
        'Add extracted resume text (at least 120 characters) to save analysis-ready context.',
      );
      setJobStatus('failed');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setJobErrorMessage('Please log in before saving job context.');
      setJobStatus('failed');
      return;
    }

    const existing = loadResumeContextForToken(token) ?? null;

    saveResumeContextForToken(token, {
      resumeId: existing?.resumeId ?? '',
      resumeFileName: existing?.resumeFileName ?? resumeName,
      resumeStatus: normalizeResumeStatus(existing?.resumeStatus),
      resumeText,
      jobDescription,
      updatedAt: new Date().toISOString(),
    });

    setJobStatus('saved');
  }

  function handleResumeRemove(): void {
    setResumeFile(null);
    setResumeName('');
    setResumeText('');
    setResumeStatus('empty');

    const token = getAccessToken();
    if (!token) {
      return;
    }

    const existing = loadResumeContextForToken(token) ?? null;

    saveResumeContextForToken(token, {
      resumeId: '',
      resumeFileName: '',
      resumeStatus: 'empty',
      resumeText: '',
      jobDescription: existing?.jobDescription ?? jobDescription,
      updatedAt: new Date().toISOString(),
    });
  }

  const resumeReady = resumeStatus === 'ready' && resumeText.trim().length >= 120;
  const jobSaved = jobStatus === 'saved' && jobDescription.trim().length >= 80;
  const contextReady = resumeReady && jobSaved;

  const resumeStepState: 'completed' | 'active' | 'pending' = resumeReady
    ? 'completed'
    : resumeName
      ? 'active'
      : 'pending';
  const jobStepState: 'completed' | 'active' | 'pending' = jobSaved
    ? 'completed'
    : jobDescription.trim().length > 0
      ? 'active'
      : 'pending';

  const jobCharacterCount = jobDescription.trim().length;
  const resumeMeta = resumeFile
    ? `PDF • ${Math.max(1, Math.round(resumeFile.size / 1024))} KB`
    : 'PDF';

  return (
    <AppShell>
      <PageContainer>
        <SectionHeading
          title="Prepare Your Interview Context"
          subtitle="Upload your resume and add the target job description. We’ll use both to personalize your analysis and interview questions."
        />

        <ol className="setup-stepper" aria-label="Interview context setup steps">
          <li className={`setup-step step-${resumeStepState}`}>
            <span className="setup-step-number">1</span>
            <span className="setup-step-copy">
              <strong>Step 1</strong>
              <span>Resume</span>
            </span>
          </li>
          <li className={`setup-step step-${jobStepState}`}>
            <span className="setup-step-number">2</span>
            <span className="setup-step-copy">
              <strong>Step 2</strong>
              <span>Job Description</span>
            </span>
          </li>
        </ol>

        <section className="resume-setup-grid">
          <Card title="Upload Resume" eyebrow="Step 1" className="resume-step-card">
            <div className="form-grid">
              {!resumeName ? (
                <>
                  <div
                    className={`upload-dropzone ${isDragActive ? 'upload-dropzone-active' : ''}`}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragActive(false);
                    }}
                    onDrop={handleDrop}
                  >
                    <span className="upload-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 16V6M12 6l-4 4M12 6l4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 17v2h16v-2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <h3>Upload your resume</h3>
                    <p className="muted">PDF only, up to the configured file-size limit.</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose PDF
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="sr-only-input"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  {resumeStatus === 'failed' ? (
                    <FeedbackState
                      variant="error"
                      title="Resume upload failed"
                      message={resumeErrorMessage}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <div className="file-summary">
                    <div>
                      <p className="file-name">{resumeName}</p>
                      <p className="muted">{resumeMeta}</p>
                    </div>
                    <StatusBadge
                      label={getResumeStatusLabel(resumeStatus)}
                      tone={getResumeStatusTone(resumeStatus)}
                    />
                  </div>

                  <div className="file-actions-row">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleResumeRemove}>
                      Remove
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="sr-only-input"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div className="compact-status" role="status" aria-live="polite">
                    <p>
                      <strong>{getResumeStatusTitle(resumeStatus)}</strong>
                    </p>
                    <p className="muted">{getResumeStatusDescription(resumeStatus)}</p>
                  </div>

                  {resumeStatus === 'uploading' || resumeStatus === 'processing' ? (
                    <LoadingState
                      label={
                        resumeStatus === 'uploading'
                          ? 'Uploading resume...'
                          : 'Processing resume...'
                      }
                    />
                  ) : null}

                  {resumeStatus === 'failed' ? (
                    <FeedbackState
                      variant="error"
                      title="Processing failed"
                      message={resumeErrorMessage}
                      actions={
                        <Button type="button" onClick={handleResumeUpload}>
                          Retry
                        </Button>
                      }
                    />
                  ) : null}

                  <div className="extracted-state">
                    <p>
                      <strong>
                        {resumeStatus === 'ready'
                          ? 'Resume text ready'
                          : 'Review resume text before upload'}
                      </strong>
                    </p>
                    <p className="muted">
                      {resumeStatus === 'ready'
                        ? 'Use this text for analysis, or make edits before refreshing your results.'
                        : 'Paste or review the text used for analysis, then upload the selected PDF.'}
                    </p>

                    <label className="form-grid">
                      <span className="muted">
                        Resume Text (required for analysis, minimum 120 characters)
                      </span>
                      <textarea
                        className="textarea extracted-debug-textarea"
                        placeholder="Paste or edit resume text used for analysis..."
                        value={resumeText}
                        onChange={(event) => setResumeText(event.target.value)}
                        minLength={120}
                      />
                    </label>
                  </div>

                  <Button
                    type="button"
                    onClick={handleResumeUpload}
                    disabled={resumeStatus === 'uploading' || resumeStatus === 'processing'}
                  >
                    {resumeStatus === 'ready' ? 'Replace Resume' : 'Upload Resume'}
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card title="Job Description" eyebrow="Step 2" className="resume-step-card">
            <form className="form-grid" onSubmit={handleJobSave}>
              <label className="form-grid">
                <span>
                  <strong>Target job description</strong>
                </span>
                <span className="muted">
                  Paste the job description for the role you’re preparing for.
                </span>
                <textarea
                  className="textarea job-description-textarea"
                  placeholder="Paste the complete job description here..."
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                />
              </label>

              <div className="char-row">
                <span className="muted">{jobCharacterCount} characters</span>
                <StatusBadge
                  label={
                    jobStatus === 'saved'
                      ? 'Saved'
                      : jobStatus === 'saving'
                        ? 'Saving'
                        : jobStatus === 'failed'
                          ? 'Failed'
                          : jobStatus === 'editing'
                            ? 'Editing'
                            : 'Pending'
                  }
                  tone={
                    jobStatus === 'saved'
                      ? 'success'
                      : jobStatus === 'saving'
                        ? 'info'
                        : jobStatus === 'failed'
                          ? 'error'
                          : 'neutral'
                  }
                />
              </div>

              {jobStatus === 'saving' ? <LoadingState label="Saving job description..." /> : null}

              {jobStatus === 'saved' ? (
                <div className="compact-status" role="status" aria-live="polite">
                  <p>
                    <strong>Job description saved</strong>
                  </p>
                  <p className="muted">Your interview context is ready.</p>
                </div>
              ) : null}

              {jobStatus === 'failed' ? (
                <FeedbackState
                  variant="error"
                  title="Job description could not be saved"
                  message={jobErrorMessage}
                />
              ) : null}

              <Button type="submit" disabled={jobStatus === 'saving'}>
                {jobStatus === 'saved'
                  ? 'Saved'
                  : jobStatus === 'saving'
                    ? 'Saving...'
                    : 'Save Job Description'}
              </Button>

              {jobStatus === 'empty' ? (
                <EmptyState
                  variant="subtle"
                  title="No job description added"
                  message="Add enough role context so analysis can produce relevant skill comparisons."
                />
              ) : null}
            </form>
          </Card>
        </section>

        <section className="context-summary" aria-label="Interview context readiness summary">
          <p>
            <strong>Interview Context</strong>
          </p>
          <ul className="context-checklist">
            <li className={resumeName ? 'is-complete' : ''}>
              {resumeName ? '✓' : '•'} Resume uploaded
            </li>
            <li className={resumeReady ? 'is-complete' : ''}>
              {resumeReady ? '✓' : '•'} Resume processed
            </li>
            <li className={jobSaved ? 'is-complete' : ''}>
              {jobSaved ? '✓' : '•'} Job description saved
            </li>
          </ul>
          <p className="muted">{contextReady ? 'Ready for analysis' : 'Context incomplete'}</p>
        </section>

        <section className="resume-final-cta">
          <p className="muted">
            {contextReady
              ? 'Your interview context is ready.'
              : 'Upload a resume and save a job description to continue.'}
          </p>
          <Link
            href={contextReady ? routes.analysis : '#'}
            className={`btn btn-primary ${contextReady ? '' : 'btn-disabled'}`}
            aria-disabled={!contextReady}
            onClick={(event) => {
              if (!contextReady) {
                event.preventDefault();
              }
            }}
          >
            Analyze Resume
          </Link>
        </section>
      </PageContainer>
    </AppShell>
  );
}

function normalizeResumeStatus(
  status: string | undefined,
): 'empty' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed' {
  if (!status) {
    return 'empty';
  }

  const value = status.trim().toUpperCase();
  if (value === 'QUEUED' || value === 'PROCESSING') {
    return 'processing';
  }

  if (value === 'FAILED') {
    return 'failed';
  }

  return 'ready';
}

function getResumeStatusLabel(
  status: 'empty' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed',
): string {
  if (status === 'uploading') {
    return 'Uploading';
  }
  if (status === 'processing') {
    return 'Processing';
  }
  if (status === 'failed') {
    return 'Failed';
  }
  if (status === 'ready') {
    return 'Uploaded';
  }
  if (status === 'selected') {
    return 'Selected';
  }
  return 'Pending';
}

function getResumeStatusTone(
  status: 'empty' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed',
): 'neutral' | 'info' | 'success' | 'error' {
  if (status === 'uploading' || status === 'processing') {
    return 'info';
  }
  if (status === 'ready') {
    return 'success';
  }
  if (status === 'failed') {
    return 'error';
  }
  return 'neutral';
}

function getResumeStatusTitle(
  status: 'empty' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed',
): string {
  if (status === 'uploading') {
    return 'Uploading...';
  }
  if (status === 'processing') {
    return 'Processing resume...';
  }
  if (status === 'ready') {
    return 'Resume ready';
  }
  if (status === 'failed') {
    return 'Processing failed';
  }
  return 'PDF selected';
}

function getResumeStatusDescription(
  status: 'empty' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed',
): string {
  if (status === 'uploading') {
    return 'Your PDF is being uploaded securely.';
  }
  if (status === 'processing') {
    return 'Your resume is being validated and prepared.';
  }
  if (status === 'ready') {
    return 'Your resume has been uploaded and processed successfully.';
  }
  if (status === 'failed') {
    return 'Resume processing failed. Retry upload after checking your file.';
  }
  return 'Add or review the resume text below, then upload this PDF.';
}
