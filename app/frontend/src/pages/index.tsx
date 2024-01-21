import React from 'react'
import RootLayout from '../components/RootLayout'
import Image from 'next/image'

const pageTitle: string = 'L2 Finality'
const pageDescription: string = 'L2 Finality Description'

const HomePage: React.FC = () => {
  return (
    <RootLayout title={pageTitle} description={pageDescription}>
      <div>
        <h1 className="text-2xl font-bold text-blue-500">
          Welcome to My Next.js App
        </h1>
        <p className="text-gray-700">
          This is some text with Tailwind CSS styles.
        </p>
        <div className="z-10 max-w-5xl items-center justify-between font-mono text-sm">
          <div className="h-48 flex w-full items-center justify-center lg:static lg:h-auto lg:w-auto lg:bg-none lgmb-12">
            <Image
              src={'/icons/base.png'}
              alt="Base logo"
              width={64}
              height={72}
            />
            <p className="text-lg md:text-2xl ml-4">Base Logo</p>
          </div>
        </div>
      </div>
    </RootLayout>
  )
}

export default HomePage
