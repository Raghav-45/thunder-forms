export default function FormsPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col py-4 md:py-6">
          <div className="flex flex-col items-center justify-between gap-y-4 px-4 lg:px-6">
            <div className="flex w-full justify-between items-center">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl leading-none font-bold">
                  Form Responses
                </h1>
                <p className="text-muted-foreground text-sm">
                  View and manage submissions for your forms, including detailed
                  response data and export options.
                </p>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
