import { v4 as uuidv4 } from 'uuid';

// In-memory document store
const store = [];

// ─── Tokenize text ─────────────────────────────────────────────────────────
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

// ─── TF-IDF score ──────────────────────────────────────────────────────────
function tfidfScore(queryTerms, docTerms, allDocs) {
  const N = allDocs.length;
  const tf = {};
  docTerms.forEach(t => { tf[t] = (tf[t] || 0) + 1; });

  let score = 0;
  queryTerms.forEach(qt => {
    if (tf[qt]) {
      const termTF = tf[qt] / docTerms.length;
      const docsWithTerm = allDocs.filter(d => tokenize(d.text).includes(qt)).length;
      const idf = Math.log((N + 1) / (docsWithTerm + 1)) + 1;
      score += termTF * idf;
    }
  });
  return score;
}

// ─── Init (no-op for in-memory) ────────────────────────────────────────────
export async function initVectorStore() {
  console.log('📦 In-memory vector store initialized');
}

// ─── Add chunks ────────────────────────────────────────────────────────────
export async function addDocuments(chunks) {
  chunks.forEach(chunk => store.push(chunk));
  return chunks.length;
}

// ─── Retrieve top-K relevant chunks ───────────────────────────────────────
export async function retrieveRelevant(query, topK = 5) {
  if (store.length === 0) return [];

  const queryTerms = tokenize(query);
  const scored = store.map(doc => ({
    ...doc,
    score: tfidfScore(queryTerms, tokenize(doc.text), store),
  }));

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── List all unique documents ─────────────────────────────────────────────
export async function listDocuments() {
  const seen = new Set();
  const docs = [];
  for (const chunk of store) {
    if (!seen.has(chunk.metadata.docId)) {
      seen.add(chunk.metadata.docId);
      docs.push({
        id: chunk.metadata.docId,
        name: chunk.metadata.fileName,
        category: chunk.metadata.category,
        uploadedAt: chunk.metadata.uploadedAt,
        chunkCount: store.filter(c => c.metadata.docId === chunk.metadata.docId).length,
      });
    }
  }
  return docs;
}

// ─── Delete document chunks ────────────────────────────────────────────────
export async function deleteDocument(docId) {
  const before = store.length;
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].metadata.docId === docId) store.splice(i, 1);
  }
  return before - store.length;
}

// ─── Chunk text into overlapping segments ─────────────────────────────────
export function chunkText(text, docId, fileName, category, chunkSize = 300, overlap = 60) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkContent = words.slice(start, end).join(' ');

    chunks.push({
      id: `${docId}-chunk-${index}-${uuidv4().slice(0, 8)}`,
      text: chunkContent,
      metadata: {
        docId,
        fileName,
        category,
        chunkIndex: index,
        uploadedAt: new Date().toISOString(),
      },
    });

    index++;
    if (end === words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

// ─── Seed mock company docs on startup ────────────────────────────────────
export async function seedMockDocuments() {
  const mockDocs = [
    {
      id: 'hr-policy',
      fileName: 'HR Policy Manual.pdf',
      category: 'Human Resources',
      content: `JL Group of Institutions HR Policy Manual v3.2.
Vacation Policy: Full-time employees receive 15 days paid vacation per year, increasing to 20 days after 3 years of service and 25 days after 5 years. Vacation must be approved by your direct manager at least 2 weeks in advance. Unused vacation can be carried over up to 10 days into the next calendar year.
Sick Leave: Employees receive 10 days paid sick leave per year. Sick leave does not carry over. For absences longer than 3 consecutive days, a doctor note is required.
Remote Work: JL Group of Institutions follows a hybrid model. Employees are expected to be in the office a minimum of 3 days per week. Tuesday Wednesday and Thursday are standard anchor days. Remote work on Mondays and Fridays is permitted with manager approval.
Performance Reviews: Annual performance reviews are held in December. Mid-year check-ins occur in June. Employees are rated on a 5-point scale Outstanding Exceeds Expectations Meets Expectations Partially Meets Does Not Meet.
Compensation: Salary reviews happen annually in January. Merit increases range from 0 to 8 percent based on performance rating. Outstanding performers may be eligible for a spot bonus of up to 5000 dollars.
Overtime: Non-exempt employees receive 1.5x pay for hours worked beyond 40 per week. Overtime must be pre-approved by HR and the department head.
Onboarding: New employees have a 90-day probationary period. During this time they receive a buddy mentor and complete 12 mandatory training modules including security compliance and code of conduct.`,
    },
    {
      id: 'product-catalog',
      fileName: 'Product Catalog 2024.pdf',
      category: 'Products',
      content: `JL Group of Institutions Product Catalog Fiscal Year 2024.
CloudSync Pro: Our flagship cloud synchronization platform. Pricing starts at 299 dollars per month for up to 50 users 599 dollars per month for 51 to 200 users and enterprise pricing for 200 or more users. Key features include real-time sync version history up to 365 days AES-256 encryption SSO integration and a 99.99 percent SLA uptime guarantee. CloudSync Pro launched in Q1 2022 and currently serves 4200 enterprise clients.
DataVault: Secure document management system. Pricing at 149 dollars per month for small teams up to 20 users 349 dollars per month for medium businesses. DataVault includes OCR-based search automated retention policies digital signature integration and ISO 27001 compliance. Launched Q3 2023.
InsightBoard: Business analytics dashboard. Pricing is 199 dollars per month per workspace. Connects to 80 or more data sources including Salesforce HubSpot Stripe and SQL databases. Offers AI-powered forecasting and custom report builder. Launched Q2 2024.
SecureComms: End-to-end encrypted messaging for enterprises. 9 dollars per user per month with minimum 25 users. HIPAA and SOC2 compliant. Integrates with Slack and Microsoft Teams.`,
    },
    {
      id: 'compliance',
      fileName: 'Compliance Guidelines.pdf',
      category: 'Legal & Compliance',
      content: `JL Group of Institutions Compliance and Legal Guidelines Updated January 2024.
Data Privacy: JL Group of Institutions is GDPR compliant for all EU operations and CCPA compliant for California residents. All customer data must be stored in approved data centers which are US-East EU-West and APAC-South. Data retention periods are customer data 7 years employee data 5 years after termination financial records 10 years.
Information Security: All employees must complete annual security training. Passwords must be at least 14 characters changed every 90 days and MFA is mandatory for all systems. Laptops must use full-disk encryption. USB drives from unknown sources are prohibited.
Code of Conduct: JL Group of Institutions has a strict zero-tolerance policy for discrimination harassment and workplace violence. All employees must sign and acknowledge the Code of Conduct annually. Violations should be reported to HR or via the anonymous ethics hotline 1-800-ACM-ETHIC.
Financial Compliance: Expense reports over 500 dollars require manager approval. Over 2000 dollars require VP approval. Travel bookings must use the approved Concur platform. Gifts from vendors exceeding 50 dollars in value must be reported to the compliance team.`,
    },
    {
      id: 'benefits',
      fileName: 'Employee Benefits 2024.pdf',
      category: 'Human Resources',
      content: `JL Group of Institutions Employee Benefits Summary 2024.
Health Insurance: JL Group of Institutions covers 90 percent of premium for employee-only plans 75 percent for employee plus spouse and 70 percent for family plans. Available providers are BlueCross BlueShield with PPO and HMO options and Kaiser Permanente HMO. Dental coverage is 80 percent for preventive 60 percent for basic procedures 50 percent for major procedures. Vision coverage includes one eye exam and 200 dollar frame allowance per year.
Retirement: JL Group of Institutions offers a 401k with a 4 percent company match which is 100 percent match on first 2 percent and 50 percent match on next 4 percent. Vesting schedule is 25 percent after year 1 50 percent after year 2 75 percent after year 3 100 percent after year 4. Employees are auto-enrolled at 3 percent contribution.
Equity: All full-time employees receive RSU grants at hire. Cliff vesting at 1 year which is 25 percent then monthly vesting over the next 36 months. Refresh grants are given to high performers annually.
Other Benefits: 1500 dollar annual learning and development budget. 75 dollar per month commuter subsidy. Free gym membership at partner studios. 500 dollar home office setup allowance one-time. Parental leave is 16 weeks for primary caregiver and 6 weeks for secondary caregiver. Mental health includes 12 free therapy sessions per year via BetterHelp.`,
    },
    {
      id: 'it-support',
      fileName: 'IT Support Guide.pdf',
      category: 'IT',
      content: `JL Group of Institutions IT Support Guide Internal Use Only.
Help Desk: Submit tickets at helpdesk.JL Group of Institutions.internal or call extension 4357. Priority levels are P1 system down with 2-hour response P2 degraded with 4-hour response P3 general with next business day response. After-hours emergencies use PagerDuty.
Hardware: New employees receive a MacBook Pro 14 inch for developers or MacBook Air M2 for others. Hardware refresh cycle is every 3 years. Request upgrades via the IT portal. Approved peripherals include Dell monitors Logitech keyboards and mice and Jabra headsets. Personal devices are not permitted on the corporate network.
Software: Standard software includes Slack Google Workspace Zoom and Jira. Additional software requires IT approval via a Software Approval Request or SAR. All software must be from the approved vendor list. Unlicensed software is grounds for disciplinary action.
Network: Corporate WiFi uses WPA3 encryption. Guest WiFi is available for visitors using SSID JL Group of Institutions-Guest. VPN is required for accessing internal resources remotely. Approved VPN client is Cisco AnyConnect. Do not use personal VPN services on company networks.
Accounts: Account provisioning takes 1 business day. Offboarding means all accounts are disabled within 2 hours of termination. Password reset requests require manager verification. Shared accounts are not permitted.`,
    },
    {
      id: 'onboarding',
      fileName: 'Onboarding Handbook.pdf',
      category: 'Human Resources',
      content: `JL Group of Institutions Onboarding Handbook Welcome to the Team.
Day 1 Checklist: Collect laptop and badge from IT desk at Lobby Building A. Complete I-9 verification with HR by end of day. Set up corporate email and Slack. Join your team channel and the general channel. Attend orientation session at 10 AM in Conference Room Redwood.
Week 1: Complete security awareness training which is mandatory and takes about 3 hours. Set up one-on-one with your manager. Review team OKRs and roadmap. Get access to all required tools via IT portal. Shadow a team member on current projects.
First 30 Days: Complete all 12 onboarding modules in the LMS. Meet with 5 colleagues outside your immediate team using the Coffee Chat bot in Slack. Review and sign Code of Conduct IP agreement and NDA. Set up quarterly goals with your manager.
First 90 Days: Complete probationary period with formal check-in with HR and manager at day 60 and day 90. Present a short project or proposal to your team. Identify mentorship opportunities. Internal transfers are eligible after 12 months.
Key Contacts: IT helpdesk extension 4357. HR team at hr@JL Group of Institutions.com. Payroll at payroll@JL Group of Institutions.com. Facilities at facilities@JL Group of Institutions.com. Ethics hotline 1-800-ACM-ETHIC.
Company Values: Innovation First means we build bold products. Customer Obsession means every decision starts with the customer. Integrity means we do the right thing. One Team means we win and lose together. Continuous Growth means we never stop learning.`,
    },
  ];

  for (const doc of mockDocs) {
    const chunks = chunkText(doc.content, doc.id, doc.fileName, doc.category);
    await addDocuments(chunks);
  }
  console.log(`🌱 Seeded ${mockDocs.length} mock company documents (${store.length} total chunks)`);
}