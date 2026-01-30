import ReactDom from 'react-dom/client';
import React from 'react';

import { Toaster } from '../components/ui/sonner';
import { Routes } from '../routes/routes';

import './app.css';

import '../entities/theme/model';

ReactDom.createRoot(document.querySelector('#app') as HTMLElement).render(
    <React.StrictMode>
        <Routes />
        <Toaster position="top-center" />
    </React.StrictMode>,
);
