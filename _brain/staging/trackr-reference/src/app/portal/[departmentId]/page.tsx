import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DepartmentPortalClient from "./DepartmentPortalClient";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getDepartmentPortal = unstable_cache(
  (departmentId: string) => prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id:          true,
      name:        true,
      description: true,
      color:       true,
      requestTypes: {
        select: {
          id:          true,
          name:        true,
          description: true,
          icon:        true,
          fields: {
            select: {
              id:          true,
              label:       true,
              key:         true,
              type:        true,
              required:    true,
              placeholder: true,
              helpText:    true,
              options:     true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      faqItems: {
        select: {
          id:       true,
          question: true,
          answer:   true,
        },
        orderBy: { order: "asc" },
      },
    },
  }),
  ["department-portal"],
  { revalidate: 60 },
);

export default async function DepartmentPortalPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;

  const dept = await getDepartmentPortal(departmentId);

  if (!dept) notFound();

  return <DepartmentPortalClient dept={dept} />;
}
