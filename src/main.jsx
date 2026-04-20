// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter }       from 'react-router-dom';
import { AuthProvider }        from './context/AuthContext.jsx';
import { UserRightsProvider }  from './context/UserRightsContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* UserRightsProvider is inside AuthProvider so it can read currentUser */}
        <UserRightsProvider>
          <App />
        </UserRightsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);