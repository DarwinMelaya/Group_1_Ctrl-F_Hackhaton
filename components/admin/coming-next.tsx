import { Construction } from "lucide-react";
import { EmptyState } from "@/components/data/states";
import { PageHeader } from "./page-header";

/** Temporary page body for sections whose feature step has not been built yet. */
export function ComingNext({ title, description, step }: { title: string; description: string; step: number }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Not built yet"
        description={`This section is built in feature step ${step}. The data is already in the database.`}
      />
    </>
  );
}
