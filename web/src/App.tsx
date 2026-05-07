import { useState } from 'react';
import './App.css';

interface FormData {
  name: string;
  dateOfBirth: string;
  classField: string;
  address1: string;
  address2: string;
  address3: string;
  phone: string;
  email: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  dateOfBirth: '',
  classField: '',
  address1: '',
  address2: '',
  address3: '',
  phone: '',
  email: '',
};

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Odoslanie zlyhalo');
      }
      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznáma chyba');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-logos">
          <span className="logo-placeholder">[Logo SOŠ]</span>
        </div>
        <h2 className="school-name">
          Stredná odborná škola technológií a remesiel, Ivanská cesta 21, 820 16
          Bratislava
        </h2>
        <div className="header-logos">
          <span className="logo-placeholder">[Erasmus+]</span>
          <span className="logo-placeholder">[SAAIC]</span>
        </div>
      </header>

      <h1 className="title">
        Prihláška do výberového konania na projekt Erasmus+ pre školský rok
        2026/2027
      </h1>
      <p className="subtitle">
        The Application for the Erasmus+ project in the 2026/2027 school year
      </p>

      {success && (
        <div className="alert success">
          Prihláška bola úspešne odoslaná! / Application was successfully
          submitted!
        </div>
      )}
      {error && <div className="alert error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label htmlFor="name">Meno a priezvisko / Name and surname:</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="dateOfBirth">
            Dátum narodenia / Date of Birth:
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            value={form.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="classField">Trieda, odbor / Class:</label>
          <input
            id="classField"
            name="classField"
            type="text"
            required
            value={form.classField}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="address1">Adresa bydliska / Address:</label>
          <input
            id="address1"
            name="address1"
            type="text"
            required
            placeholder="Ulica a číslo"
            value={form.address1}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="address2">&nbsp;</label>
          <input
            id="address2"
            name="address2"
            type="text"
            placeholder="PSČ a mesto"
            value={form.address2}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="address3">&nbsp;</label>
          <input
            id="address3"
            name="address3"
            type="text"
            placeholder="Krajina"
            value={form.address3}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="phone">Telefón / Phone Nr:</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="email">Emailová adresa / email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <p className="confirm-text">
          Svojím podpisom potvrdzujem prihlášku do výberového konania na projekt
          Erasmus+.
          <br />
          I confirm the application for the tender for the Erasmus+ project.
        </p>

        <div className="info-text">
          <strong>Prílohy v anglickom jazyku / Attachment in English:</strong>
          <br />
          Životopis – Europass –{' '}
          <a
            href="https://europa.eu/europass/en"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://europa.eu/europass/en
          </a>
          <br />
          Motivačný list (predstavy a očakávania účastníka mobility) formou
          interview
        </div>

        <button type="submit" disabled={submitting} className="submit-btn">
          {submitting ? 'Odosiela sa...' : 'Odoslať prihlášku / Submit'}
        </button>
      </form>

      <footer className="footer">
        Uvedené informácie sú určené pre interné potreby školy
      </footer>
    </div>
  );
}

export default App;
