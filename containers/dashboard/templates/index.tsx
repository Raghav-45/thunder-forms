import { FC } from 'react'
import Layout from '../layout'
import { TemplateGallery } from './components/template-gallery'

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return (
    <Layout>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col items-center justify-between gap-y-4 px-4 lg:px-6">
              <div className="flex w-full justify-between items-center">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl leading-none font-bold">
                    Choose a Template
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Select a template and start creating your form instantly.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 lg:px-6">
              <TemplateGallery />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default page
