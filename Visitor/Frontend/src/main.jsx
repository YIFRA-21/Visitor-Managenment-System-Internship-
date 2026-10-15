import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ToastProvider } from './contexts/ToastContext';
import { store } from './store/store';
import './tailwind.css';
import './styles/main.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <ThemeProvider>
              <LanguageProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
