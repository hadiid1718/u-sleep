import React, { useState } from 'react'
import './ContactForm.css'
import { apiRequest } from '../services/core/apiClient'
import { useNavigate } from 'react-router-dom'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name || !email || message.length < 10) {
      setError('Please provide name, valid email and message (min 10 chars).')
      return
    }
    setLoading(true)
    try {
      const payload = { name, email, message }
      const response = await apiRequest('/support/contact', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send message')
      }
      setSuccess('Your message has been sent. Support will contact you shortly.')
      setName('')
      setEmail('')
      setMessage('')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      console.error(err)
      setError('Unable to send message. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-container">
      <div className="contact-card">
        <h2>Contact Support</h2>
        <p>If your account is suspended, use the suspension appeal page instead.</p>
        <form onSubmit={handleSubmit} className="contact-form">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <label>Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue (min 10 chars)" rows={6} />

          <div className="contact-actions">
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
          </div>
          {success && <div className="contact-success">{success}</div>}
          {error && <div className="contact-error">{error}</div>}
        </form>
      </div>
    </div>
  )
}
