
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface SMSLog {
  id: string;
  recipient_phone: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  sent_at: string;
  created_at: string;
}

export default function SMSLogsManagement() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, dateFilter]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Envoyé';
      case 'failed':
        return 'Échoué';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Date', 'Téléphone', 'Message', 'Statut', 'Erreur'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('fr-FR'),
        log.recipient_phone,
        `"${log.message.replace(/"/g, '""')}"`,
        getStatusLabel(log.status),
        log.error_message || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const successRate = logs.length > 0 ? Math.round((sentCount / logs.length) * 100) : 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Logs SMS</h2>
        <div className="flex space-x-3">
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <i className="ri-download-line mr-2"></i>
            Exporter
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <i className="ri-refresh-line mr-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total SMS</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-message-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Envoyés</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{sentCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Échoués</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{failedCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <i className="ri-close-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Taux de succès</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{successRate}%</p>
            </div>
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
              <i className="ri-percent-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Téléphone, message..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Tous</option>
              <option value="sent">Envoyés</option>
              <option value="failed">Échoués</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Toutes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erreur
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.recipient_phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md truncate">
                      {log.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {getStatusLabel(log.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-red-600 max-w-xs truncate">
                      {log.error_message || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
