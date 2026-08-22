import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ResumePage() {
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
            <form className="form-grid">
              <label>
                Resume PDF
                <input className="input" type="file" accept="application/pdf" />
              </label>
              <Button type="submit">Upload Resume</Button>
            </form>
          </Card>
          <Card title="Job Description" eyebrow="Step 2">
            <form className="form-grid">
              <label>
                Paste Job Description
                <textarea
                  className="textarea"
                  placeholder="Paste the role requirements, responsibilities, and preferred skills..."
                />
              </label>
              <Button type="submit">Save Description</Button>
            </form>
          </Card>
        </section>
      </section>
    </AppShell>
  );
}
