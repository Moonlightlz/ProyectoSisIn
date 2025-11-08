import React from 'react';
import ClusteringPanel from './ClusteringPanel';
import './ReportsPage.css';

const ClusteringPage = () => {
  return (
    <div className="reports-container">
      <h1>Clustering</h1>
      <div className="charts-grid">
        <ClusteringPanel />
      </div>
    </div>
  );
};

export default ClusteringPage;
