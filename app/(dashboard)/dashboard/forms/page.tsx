import { DataTable } from "@/components/data-table";
import { tableData } from "@/config/data";

export default function FormsPage() {
  return (
    <>
    <div className="flex flex-col items-center justify-between gap-y-4 px-4 lg:px-6">
      <div className="flex w-full justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl leading-none font-bold">Forms Management</h1>
          <p className="text-muted-foreground text-sm">
            Effortlessly create, organize, and track your forms in one place.
          </p>
        </div>
      </div>
    </div>
    <DataTable data={tableData} />
    </>
  )
}
