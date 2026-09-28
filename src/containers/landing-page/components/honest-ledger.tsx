const ROWS = [
  {
    job: 'Draft the fields',
    byHand: 'Stare at a blank spreadsheet and guess the columns.',
    thunder:
      'One sentence — the AI drafts name, email, choice, number, and more.',
  },
  {
    job: 'Build with control',
    byHand: 'Fight formatting to fake structure.',
    thunder:
      'Pages, sections, fourteen field types, drag and drop, live preview.',
  },
  {
    job: 'Collect responses',
    byHand: 'Trawl the inbox and paste rows together.',
    thunder:
      'A public link feeds one live table, validation and uploads included.',
  },
  {
    job: 'Export the data',
    byHand: 'Reformat CSVs by hand for every stakeholder.',
    thunder: 'One-click CSV export, formatted and ready.',
  },
  {
    job: 'Sync the sheet',
    byHand: 'Copy-paste Fridays, forever.',
    thunder: 'Every row lands in Google Sheets as it arrives.',
  },
  {
    job: 'Run it again',
    byHand: 'Save-as chaos: final_v2_REAL.xlsx.',
    thunder: 'Duplicate in one action, or start from six real templates.',
  },
]

export function HonestLedger() {
  return (
    <section
      aria-labelledby="landing-1-ledger"
      className="container py-20 md:py-28"
    >
      <h2
        id="landing-1-ledger"
        className="font-anton max-w-2xl text-4xl font-normal tracking-tight text-balance md:text-6xl"
      >
        Retire the spreadsheet
      </h2>
      <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
        Six jobs you do by hand today, and what they become. No rival named,
        no number invented.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b bg-muted/40">
              <th scope="col" className="px-5 py-4 text-sm font-semibold">
                The job
              </th>
              <th
                scope="col"
                className="px-5 py-4 text-sm font-semibold text-muted-foreground"
              >
                By hand
              </th>
              <th scope="col" className="px-5 py-4 text-sm font-semibold">
                Thunder Forms
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.job} className="border-b align-top last:border-b-0">
                <th scope="row" className="px-5 py-4 text-sm font-semibold">
                  {row.job}
                </th>
                <td className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {row.byHand}
                </td>
                <td className="px-5 py-4 text-sm leading-relaxed">
                  {row.thunder}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
