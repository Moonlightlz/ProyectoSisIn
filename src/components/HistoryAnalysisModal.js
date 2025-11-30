import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './HistoryAnalysisModal.css';

const HistoryAnalysisModal = ({ isOpen, onClose, title, analysis, data, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="history-analysis-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            Análisis del Histórico: {title}
          </h3>
          <button onClick={onClose} className="modal-close-btn">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <div className="loading-analysis">
              <div className="spinner"></div>
              <p>Generando análisis...</p>
            </div>
          ) : (
            <div className="analysis-content">
              {data && (
                <div className="history-data-table-container">
                  <table className="history-data-table">
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data).map(([key, value]) => (
                        <tr key={key}>
                          <td>{key.replace(/_/g, ' ')}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {analysis ? (
                <div className="ai-response-box">
                  <p>{analysis}</p>
                </div>
              ) : (
                <p className="error-analysis">No se pudo generar el análisis. Inténtalo de nuevo.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryAnalysisModal;