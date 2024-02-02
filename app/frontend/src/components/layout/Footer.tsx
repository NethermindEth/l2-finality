import React from 'react'
import styles from '../../styles/footer.module.css'

const Footer = () => {
  return (
    <footer className={styles['footer']}>
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}

export default Footer
