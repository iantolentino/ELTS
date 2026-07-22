import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  const requestTypes = await prisma.requestType.findMany({
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

  console.log("Seeded request type fields");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
