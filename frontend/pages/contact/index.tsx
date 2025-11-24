import ContactForm from '@/components/Contact/ContactForm'
import ContactHero from '@/components/Contact/ContactHero'
import ContactInfo from '@/components/Contact/ContactInfo'
import React from 'react'

export default function ContactPage() {
    return (
        <div>
            <ContactHero />
            <ContactInfo />
            <ContactForm />
        </div>
    )
}
