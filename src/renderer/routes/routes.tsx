import { Route } from 'react-router-dom';

import { Router } from 'lib/electron-router-dom';

import { MainRoute } from './main/index';

export function Routes() {
    return <Router main={<Route element={<MainRoute />} path="*" />} />;
}
