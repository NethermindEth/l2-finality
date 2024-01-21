import React from 'react'
import Meta from './Meta'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Inter } from 'next/font/google'

import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

type LayoutProps = {
  children: React.ReactNode
  title?: string
  description?: string
}

const RootLayout = ({ children, title, description }: LayoutProps) => {
  return (
    <>
      <Meta title={title} description={description} />
      <Header />
      <main className={inter.className}>{children}</main>
      <Footer />
    </>
  )
}

export default RootLayout
