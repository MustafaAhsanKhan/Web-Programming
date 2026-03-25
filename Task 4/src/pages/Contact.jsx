import { useState } from 'react';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = {
      name,
      email,
      message,
    };

    console.log('Contact Form Data:', formData);

    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <section>
      <h1>Contact Us</h1>
      <form onSubmit={handleSubmit} className="contact-form">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          rows="4"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />

        <button type="submit">Send Message</button>
      </form>
    </section>
  );
}

export default Contact;