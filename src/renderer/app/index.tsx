import ReactDom from 'react-dom/client';
import React from 'react';

import { Routes } from '../routes/routes';

import './app.css';

import '../entities/theme/model';

ReactDom.createRoot(document.querySelector('#app') as HTMLElement).render(
    <React.StrictMode>
        <Routes />
    </React.StrictMode>,
);
