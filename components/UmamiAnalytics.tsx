import Script from 'next/script'

const UmamiAnalytics = ({}) => {
  return (
    <Script
      src="https://thunder-forms-analytics.vercel.app/script.js"
      data-website-id="d80b3a28-2e8b-41fd-b302-2be8748f7d49"
      strategy="lazyOnload"
    />
  )
}

export default UmamiAnalytics
