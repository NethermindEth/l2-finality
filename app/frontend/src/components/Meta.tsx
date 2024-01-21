import Head from 'next/head'

type MetaProps = {
  title?: string
  description?: string
}

const Meta = ({ title, description }: MetaProps) => {
  return (
    <Head>
      <title>{title || 'Default Title'}</title>
      <meta name="description" content={description || 'Default description'} />
    </Head>
  )
}

export default Meta
