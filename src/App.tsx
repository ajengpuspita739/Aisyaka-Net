/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { db } from './db';
import { MOCK_TRAFFIC_WAVE, REGIONS } from './data';
import { Customer, Device, NetworkAlert } from './types';

export default function App() {
  // Session handling state
  const [operatorUser, setOperatorUser] = useState<string | null>(null);

  // Master monitoring data states for live interactives, loaded from our SQL-simulated db
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [devices, setDevices] = useState<Device[]>(() => db.getDevices());
  const [alerts, setAlerts] = useState<NetworkAlert[]>(() => db.getAlerts());

  // Handle master updates
  const handleUpdateCustomersList = (updatedList: Customer[]) => {
    setCustomers(updatedList);
  };

  const handleUpdateAlertsList = (updatedList: NetworkAlert[]) => {
    db.updateAlerts(updatedList);
    setAlerts(updatedList);
  };

  // Sign out and zero session logs
  const handleLogout = () => {
    setOperatorUser(null);
  };

  return (
    <>
      {operatorUser === null ? (
        <LoginScreen onLoginSuccess={(username) => setOperatorUser(username)} />
      ) : (
        <Dashboard
          username={operatorUser}
          customers={customers}
          devices={devices}
          alerts={alerts}
          trafficData={MOCK_TRAFFIC_WAVE}
          regions={REGIONS}
          onLogout={handleLogout}
          onUpdateCustomersList={handleUpdateCustomersList}
          onUpdateAlertsList={handleUpdateAlertsList}
        />
      )}
    </>
  );
}
