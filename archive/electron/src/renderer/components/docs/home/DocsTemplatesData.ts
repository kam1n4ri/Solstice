import {
  FileText,
  Briefcase,
  Users,
  Terminal,
  Mail,
  CalendarCheck,
  LucideIcon,
} from 'lucide-react';

export interface DocTemplate {
  id: string;
  title: string;
  label: string;
  category: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  badgeColorClass: string;
  content: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'blank',
    title: 'Untitled document',
    label: 'Blank document',
    category: 'General',
    description: 'Start fresh with a clean, blank slate',
    badge: 'Blank',
    icon: FileText,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: '<p></p>',
  },
  {
    id: 'project-proposal',
    title: 'Project Proposal',
    label: 'Project Proposal',
    category: 'Work',
    description: 'Pitch new initiatives, scope, goals, and budget',
    badge: 'Proposal',
    icon: Briefcase,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: `<h1>Project Proposal: [Project Name]</h1>
<p><em>Prepared by: [Your Name / Team] &mdash; Date: [Current Date]</em></p>
<hr />
<h2>1. Executive Summary</h2>
<p>Provide a high-level summary of the proposed project, why it matters, and the primary business or technical outcome it achieves.</p>
<h2>2. Objectives &amp; Goals</h2>
<ul>
  <li><strong>Objective A:</strong> Specific, measurable goal to deliver within Q1.</li>
  <li><strong>Objective B:</strong> Secondary improvement or efficiency gain.</li>
</ul>
<h2>3. Scope of Work</h2>
<p>Detail what is included in the project scope and clearly state what is out of scope to avoid ambiguity.</p>
<h2>4. Deliverables &amp; Milestones</h2>
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f8fafc;">
      <th>Phase</th>
      <th>Key Milestone</th>
      <th>Target Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Phase 1</td>
      <td>Discovery &amp; Architectural RFC</td>
      <td>Week 2</td>
    </tr>
    <tr>
      <td>Phase 2</td>
      <td>Core Implementation &amp; Tests</td>
      <td>Week 6</td>
    </tr>
    <tr>
      <td>Phase 3</td>
      <td>Beta Rollout &amp; Verification</td>
      <td>Week 8</td>
    </tr>
  </tbody>
</table>
<h2>5. Budget &amp; Resource Allocation</h2>
<p>Outline the necessary budget, tooling licenses, and personnel required.</p>`,
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    label: 'Meeting Notes',
    category: 'Collaboration',
    description: 'Keep track of attendees, discussions, and action items',
    badge: 'Meeting',
    icon: Users,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: `<h1>Meeting Notes &mdash; [Meeting Topic]</h1>
<p><strong>Date &amp; Time:</strong> [Insert Date &amp; Time]<br />
<strong>Facilitator:</strong> [Facilitator Name]<br />
<strong>Attendees:</strong> [Attendee 1, Attendee 2, Attendee 3]</p>
<hr />
<h2>Agenda</h2>
<ol>
  <li>Project status &amp; recent progress updates</li>
  <li>Key technical roadblocks or dependencies</li>
  <li>Next sprint commitments</li>
</ol>
<h2>Discussion &amp; Decisions</h2>
<p>Summarize major points discussed and decisions agreed upon by the team.</p>
<blockquote><p><strong>Key Decision:</strong> Adopt modular file structure with strict typing across all components.</p></blockquote>
<h2>Action Items</h2>
<ul data-type="taskList">
  <li data-checked="false"><p>Finalize architectural spec by Wednesday</p></li>
  <li data-checked="false"><p>Schedule follow-up review with stakeholders</p></li>
  <li data-checked="true"><p>Set up baseline CI test pipeline</p></li>
</ul>`,
  },
  {
    id: 'tech-rfc',
    title: 'RFC: System Architecture',
    label: 'Technical RFC',
    category: 'Engineering',
    description: 'Propose system designs, trade-offs, and architecture',
    badge: 'RFC',
    icon: Terminal,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: `<h1>RFC: [Title of Proposed Architecture]</h1>
<p><strong>Author:</strong> [Author Name] &mdash; <strong>Status:</strong> Draft &mdash; <strong>Date:</strong> [Current Date]</p>
<hr />
<h2>1. Context &amp; Background</h2>
<p>Describe the current architecture, what has changed, and why a new solution or overhaul is required.</p>
<h2>2. Problem Statement</h2>
<p>Explain the bottlenecks, reliability hazards, or user experience issues in the current system.</p>
<h2>3. Proposed Architecture</h2>
<p>Detail the design, data structures, IPC contracts, and component hierarchy.</p>
<pre><code>// Example IPC Contract interface
interface DocumentServiceContract {
  saveFile(path: string, content: string): Promise&lt;boolean&gt;;
  readFile(path: string): Promise&lt;string&gt;;
}</code></pre>
<h2>4. Alternatives Considered</h2>
<p>Highlight 2-3 alternate approaches considered and why they were rejected (e.g. performance, complexity).</p>
<h2>5. Rollout &amp; Migration Plan</h2>
<p>Outline backward compatibility guarantees, feature flags, and verification steps.</p>`,
  },
  {
    id: 'formal-memo',
    title: 'Memorandum',
    label: 'Formal Memo',
    category: 'Communication',
    description: 'Professional internal announcements and executive memos',
    badge: 'Memo',
    icon: Mail,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: `<div style="font-family: inherit;">
  <h1 style="text-align: center; letter-spacing: 0.1em; text-transform: uppercase;">Memorandum</h1>
  <hr style="margin: 1.5rem 0;" />
  <p><strong>TO:</strong> [Recipient Team / Department]<br />
  <strong>FROM:</strong> [Your Name &amp; Title]<br />
  <strong>DATE:</strong> [Today's Date]<br />
  <strong>SUBJECT:</strong> [Subject / Purpose of Memo]</p>
  <hr style="margin: 1.5rem 0;" />
  <h2>Summary</h2>
  <p>State concisely the essential message, policy change, or update being communicated.</p>
  <h2>Background &amp; Rationale</h2>
  <p>Provide the essential context and reasons leading to this announcement.</p>
  <h2>Key Details &amp; Guidance</h2>
  <p>Detail the specific steps, operational timelines, and rules to follow.</p>
  <h2>Next Steps</h2>
  <p>Provide contact information for follow-up questions and specify any immediate actions required.</p>
</div>`,
  },
  {
    id: 'weekly-report',
    title: 'Weekly Status Report',
    label: 'Weekly Report',
    category: 'Reporting',
    description: 'Track weekly progress, milestones, and upcoming blockers',
    badge: 'Report',
    icon: CalendarCheck,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: `<h1>Weekly Status Report &mdash; Week of [Date]</h1>
<p><strong>Team / Individual:</strong> [Name] &mdash; <strong>Period:</strong> [Start Date &ndash; End Date]</p>
<hr />
<h2>Key Accomplishments</h2>
<ul>
  <li>Completed sprint deliverable on time with full test coverage.</li>
  <li>Resolved file pipeline and dashboard recents inconsistencies.</li>
</ul>
<h2>In Progress</h2>
<ul>
  <li>Performance benchmarks and memory usage optimization.</li>
  <li>Refactoring template gallery with responsive previews.</li>
</ul>
<h2>Blockers &amp; Risks</h2>
<p>None at this time. All cross-team dependencies are aligned.</p>
<h2>Next Week's Priorities</h2>
<ol>
  <li>Ship version release candidate.</li>
  <li>Conduct regression testing and end-to-end verification.</li>
</ol>`,
  },
];
