import { prisma } from "@/lib/prisma";
import PortalClient from "./PortalClient";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getPortalDepartments = unstable_cache(
  () => prisma.department.findMany({
    select: {
      id:          true,
      name:        true,
      description: true,
      color:       true,
    },
    orderBy: { name: "asc" },
  }),
  ["portal-departments"],
  { revalidate: 60 },
);

export default async function PortalPage() {
  const departments = await getPortalDepartments();

  return <PortalClient departments={departments} />;
}
