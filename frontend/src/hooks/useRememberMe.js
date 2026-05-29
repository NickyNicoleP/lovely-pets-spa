import { useEffect, useState } from 'react';

export default function useRememberMe(key = 'pawspa_user') {
  const [savedEmail, setSavedEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email on component mount
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      setSavedEmail(saved);
      setRememberMe(true);
    }
  }, [key]);

  // Save email to localStorage
  const saveEmail = (email) => {
    if (email) {
      localStorage.setItem(key, email);
      setSavedEmail(email);
    }
  };

  // Remove saved email from localStorage
  const clearEmail = () => {
    localStorage.removeItem(key);
    setSavedEmail('');
    setRememberMe(false);
  };

  return {
    savedEmail,
    rememberMe,
    setRememberMe,
    saveEmail,
    clearEmail,
  };
}
