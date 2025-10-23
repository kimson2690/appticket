import React, { useState, useEffect } from 'react';
import { History, Package } from 'lucide-react';

interface TicketAssignment {
  id: string;
  employee_name: string;
  tickets_count: number;
  ticket_value: number;
  type: 'manual' | 'batch';
  assigned_by: string;
  notes?: string;
  batch_number?: string;
  created_at: string;
}

const MyHistory: React.FC = () => {
  const [history, setHistory] = useState<TicketAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
      };

      const historyRes = await fetch(`${baseUrl}/employee/ticket-history`, { headers });
      const historyData = await historyRes.json();

      if (historyData.success) setHistory(historyData.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + 'F';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historique des Affectations</h1>
          <p className="text-gray-600 mt-1">Consultez l'historique de tous les tickets qui vous ont été affectés</p>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold">
          {history.length} affectation{history.length > 1 ? 's' : ''}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun historique</h3>
            <p className="text-gray-500">Vous n'avez pas encore reçu de tickets</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-orange-200 transition-colors">
              <div className="flex items-start justify-between">
                {/* Left side */}
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    assignment.type === 'batch' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <Package className={`w-6 h-6 ${
                      assignment.type === 'batch' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        +{assignment.tickets_count} ticket{assignment.tickets_count > 1 ? 's' : ''}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.type === 'batch' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.type === 'batch' ? 'Affectation groupée' : 'Affectation manuelle'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valeur totale</p>
                        <p className="text-sm font-semibold text-orange-600">
                          {formatCurrency(assignment.ticket_value * assignment.tickets_count)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date d'affectation</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(assignment.created_at)}</p>
                      </div>
                    </div>

                    {assignment.batch_number && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Numéro de souche</p>
                        <p className="text-sm font-mono font-medium text-gray-700">{assignment.batch_number}</p>
                      </div>
                    )}

                    {assignment.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Note</p>
                        <p className="text-sm text-gray-700">{assignment.notes}</p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Affecté par <span className="font-medium text-gray-700">{assignment.assigned_by}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side - Value badge */}
                <div className="text-right">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl px-4 py-2">
                    <p className="text-xs text-orange-600 font-medium mb-1">Valeur unitaire</p>
                    <p className="text-xl font-bold text-orange-700">{formatCurrency(assignment.ticket_value)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHistory;
