import { analyticsPrisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  try {
    // Get browser breakdown
    const browserBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ browser: string; count: bigint }>
    >`
      SELECT 
        s."browser",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND s."browser" IS NOT NULL AND s."browser" != ''
      GROUP BY s."browser"
      ORDER BY count DESC
      LIMIT 8
    `

    // Get OS breakdown
    const osBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ os: string; count: bigint }>
    >`
      SELECT 
        s."os",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND s."os" IS NOT NULL AND s."os" != ''
      GROUP BY s."os"
      ORDER BY count DESC
      LIMIT 8
    `

    // Get device breakdown
    const deviceBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ device: string; count: bigint }>
    >`
      SELECT 
        s."device",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND s."device" IS NOT NULL AND s."device" != ''
      GROUP BY s."device"
      ORDER BY count DESC
      LIMIT 8
    `

    // Get country breakdown
    const countryBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ country: string; count: bigint }>
    >` 
      SELECT 
        s."country",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND s."country" IS NOT NULL AND s."country" != ''
      GROUP BY s."country"
      ORDER BY count DESC
      LIMIT 6
    `

    // Get state/region breakdown
    const stateBreakdown = await analyticsPrisma.$queryRaw<
      Array<{ region: string; count: bigint }>
    >` 
      SELECT 
        s."region",
        COUNT(DISTINCT s."session_id") as count
      FROM "session" s
      INNER JOIN "website_event" w ON s."session_id" = w."session_id"
      WHERE w."url_path" ILIKE ${`/forms/${id}%`}
      AND s."region" IS NOT NULL AND s."region" != ''
      GROUP BY s."region"
      ORDER BY count DESC
      LIMIT 6
    ` // Format the data for radial charts
    const formatBreakdownData = (
      data: Array<{ [key: string]: string | bigint }>,
      labelKey: string
    ) => {
      return data.map((item, index) => {
        const base = {
          name: item[labelKey] as string,
          value: Number(item.count),
          fill: `var(--color-${index + 1})`,
        }
        // For country data, use the country field as country_code since it contains ISO codes
        if (labelKey === 'country') {
          return { ...base, country_code: item[labelKey] as string }
        }
        return base
      })
    }

    return NextResponse.json(
      {
        success: true,
        browser: formatBreakdownData(browserBreakdown, 'browser'),
        os: formatBreakdownData(osBreakdown, 'os'),
        device: formatBreakdownData(deviceBreakdown, 'device'),
        country: formatBreakdownData(countryBreakdown, 'country'),
        state: formatBreakdownData(stateBreakdown, 'region'),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Breakdown analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch breakdown analytics' },
      { status: 500 }
    )
  }
}
