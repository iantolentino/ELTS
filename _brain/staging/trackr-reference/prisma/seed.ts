import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEPARTMENT_SEEDS: Record<string, {
  requestTypes: { name: string; description: string; icon: string; order: number }[];
  faqItems:     { question: string; answer: string; order: number }[];
}> = {
  "IT Support": {
    requestTypes: [
      { name: "Report a Bug",          description: "Something isn't working as expected",              icon: "🐛", order: 0 },
      { name: "Request Hardware",       description: "Request new equipment like laptop, monitor, etc.", icon: "🖥️", order: 1 },
      { name: "Password Reset",         description: "Can't access your account or forgot password",    icon: "🔑", order: 2 },
      { name: "Software Installation",  description: "Request installation of software or tools",       icon: "💿", order: 3 },
      { name: "Network Issue",          description: "VPN, WiFi, or connectivity problems",             icon: "🌐", order: 4 },
      { name: "General IT Support",     description: "Any other IT related issue",                      icon: "🎫", order: 5 },
    ],
    faqItems: [
      { question: "How do I reset my password?",          answer: "Submit a Password Reset request and our team will respond within 1 hour during business hours.",         order: 0 },
      { question: "How long does hardware requests take?", answer: "Hardware requests are typically processed within 3-5 business days depending on availability.",          order: 1 },
      { question: "What is the SLA for critical issues?",  answer: "Critical issues are responded to within 1 hour. High priority within 4 hours. Medium within 8 hours.", order: 2 },
    ],
  },
  "HR": {
    requestTypes: [
      { name: "Leave Request",         description: "Apply for annual, sick, or emergency leave",       icon: "📅", order: 0 },
      { name: "Payroll Inquiry",       description: "Questions about salary, deductions, or payslips",  icon: "💰", order: 1 },
      { name: "Onboarding Support",    description: "Help with new employee onboarding process",        icon: "👋", order: 2 },
      { name: "Policy Clarification",  description: "Questions about company policies and procedures",  icon: "📋", order: 3 },
      { name: "Benefits Inquiry",      description: "Questions about health, insurance, or benefits",   icon: "🏥", order: 4 },
    ],
    faqItems: [
      { question: "How many leave days do I have?",     answer: "Leave entitlements vary by role and tenure. Check your contract or submit a Leave inquiry for details.",   order: 0 },
      { question: "When is payroll processed?",         answer: "Payroll is processed on the last business day of each month.",                                             order: 1 },
      { question: "How do I update my personal info?",  answer: "Submit a General HR request with your updated information and supporting documents.",                      order: 2 },
    ],
  },
  "Finance": {
    requestTypes: [
      { name: "Expense Reimbursement",  description: "Submit expenses for reimbursement approval",      icon: "🧾", order: 0 },
      { name: "Budget Request",         description: "Request budget allocation for a project or team",  icon: "📊", order: 1 },
      { name: "Invoice Processing",     description: "Submit or follow up on invoice processing",        icon: "📄", order: 2 },
      { name: "Financial Report",       description: "Request financial statements or reports",          icon: "📈", order: 3 },
    ],
    faqItems: [
      { question: "How long does reimbursement take?",  answer: "Expense reimbursements are processed within 5-7 business days after approval.",  order: 0 },
      { question: "What receipts do I need to submit?", answer: "All expense claims require original receipts. Digital copies are accepted.",       order: 1 },
    ],
  },
  "Marketing": {
    requestTypes: [
      { name: "Design Request",       description: "Request graphics, banners, or marketing materials",  icon: "🎨", order: 0 },
      { name: "Content Review",       description: "Get content reviewed before publishing",             icon: "✍️", order: 1 },
      { name: "Campaign Support",     description: "Support for marketing campaigns and promotions",     icon: "📣", order: 2 },
      { name: "Brand Asset Request",  description: "Request logos, templates, or brand guidelines",     icon: "🏷️", order: 3 },
    ],
    faqItems: [
      { question: "How long does a design request take?",  answer: "Simple designs take 2-3 days. Complex designs may take up to a week.",          order: 0 },
      { question: "What format should I submit requests?", answer: "Include dimensions, colors, and reference examples when submitting requests.",   order: 1 },
    ],
  },
};

const REQUEST_TYPE_FIELDS: Record<string, {
  label: string;
  key: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "NUMBER" | "DATE" | "BOOLEAN";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  order: number;
}[]> = {
  "Report a Bug": [
    { label: "Affected system", key: "affectedSystem", type: "TEXT", required: true, placeholder: "App, website, device, or service", order: 0 },
    { label: "Impact", key: "impact", type: "SELECT", required: true, options: ["Blocked", "Major issue", "Minor issue"], order: 1 },
    { label: "Steps to reproduce", key: "stepsToReproduce", type: "TEXTAREA", placeholder: "What did you do before the issue happened?", order: 2 },
  ],
  "Request Hardware": [
    { label: "Device type", key: "deviceType", type: "SELECT", required: true, options: ["Laptop", "Monitor", "Keyboard", "Mouse", "Headset", "Other"], order: 0 },
    { label: "Needed by", key: "neededBy", type: "DATE", required: true, order: 1 },
    { label: "Business reason", key: "businessReason", type: "TEXTAREA", required: true, order: 2 },
  ],
  "Password Reset": [
    { label: "Account or system", key: "accountSystem", type: "TEXT", required: true, placeholder: "Google Workspace, VPN, payroll, etc.", order: 0 },
    { label: "Can you access email?", key: "canAccessEmail", type: "BOOLEAN", order: 1 },
  ],
  "Leave Request": [
    { label: "Leave type", key: "leaveType", type: "SELECT", required: true, options: ["Annual", "Sick", "Emergency", "Unpaid"], order: 0 },
    { label: "Start date", key: "startDate", type: "DATE", required: true, order: 1 },
    { label: "End date", key: "endDate", type: "DATE", required: true, order: 2 },
  ],
  "Expense Reimbursement": [
    { label: "Amount", key: "amount", type: "NUMBER", required: true, placeholder: "0.00", order: 0 },
    { label: "Expense category", key: "expenseCategory", type: "SELECT", required: true, options: ["Travel", "Meals", "Software", "Office supplies", "Other"], order: 1 },
    { label: "Receipt available", key: "receiptAvailable", type: "BOOLEAN", order: 2 },
  ],
  "Design Request": [
    { label: "Asset type", key: "assetType", type: "SELECT", required: true, options: ["Social post", "Banner", "Presentation", "Flyer", "Other"], order: 0 },
    { label: "Dimensions", key: "dimensions", type: "TEXT", placeholder: "Example: 1080x1080", order: 1 },
    { label: "Deadline", key: "deadline", type: "DATE", order: 2 },
  ],
};

async function seedRequestTypeFields(departmentId: string) {
  const requestTypes = await prisma.requestType.findMany({
    where: { departmentId },
    select: { id: true, name: true },
  });

  for (const requestType of requestTypes) {
    const fields = REQUEST_TYPE_FIELDS[requestType.name] ?? [];
    for (const field of fields) {
      await prisma.requestTypeField.upsert({
        where: {
          requestTypeId_key: {
            requestTypeId: requestType.id,
            key: field.key,
          },
        },
        update: {
          label:       field.label,
          type:        field.type,
          required:    field.required ?? false,
          placeholder: field.placeholder ?? null,
          helpText:    field.helpText ?? null,
          options:     field.options ?? [],
          order:       field.order,
        },
        create: {
          requestTypeId: requestType.id,
          label:         field.label,
          key:           field.key,
          type:          field.type,
          required:      field.required ?? false,
          placeholder:   field.placeholder ?? null,
          helpText:      field.helpText ?? null,
          options:       field.options ?? [],
          order:         field.order,
        },
      });
    }
  }
}

async function main() {
  console.log("🌱 Seeding request types and FAQs...");

  const departments = await prisma.department.findMany();

  for (const dept of departments) {
    const seed = DEPARTMENT_SEEDS[dept.name];
    if (!seed) {
      // Generic seed for unknown departments
      await prisma.requestType.createMany({
        data: [
          { name: "General Request",  description: "Submit a general request to this department", icon: "🎫", departmentId: dept.id, order: 0 },
          { name: "Report an Issue",  description: "Report a problem or issue",                   icon: "⚠️", departmentId: dept.id, order: 1 },
        ],
        skipDuplicates: true,
      });
      await prisma.faqItem.createMany({
        data: [
          { question: "How do I submit a request?",   answer: "Click 'Submit a Request' and fill in the form. Our team will get back to you shortly.", departmentId: dept.id, order: 0 },
          { question: "What is the response time?",   answer: "We aim to respond to all requests within one business day.",                              departmentId: dept.id, order: 1 },
        ],
        skipDuplicates: true,
      });
      await seedRequestTypeFields(dept.id);
      continue;
    }

    await prisma.requestType.createMany({
      data: seed.requestTypes.map((rt) => ({ ...rt, departmentId: dept.id })),
      skipDuplicates: true,
    });

    await prisma.faqItem.createMany({
      data: seed.faqItems.map((faq) => ({ ...faq, departmentId: dept.id })),
      skipDuplicates: true,
    });

    console.log(`  ✅ Seeded ${dept.name}`);
  }

  console.log("✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
