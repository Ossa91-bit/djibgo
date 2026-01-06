import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'paid';
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  bookings?: {
    profiles?: {
      full_name: string;
    };
    professional_profile?: {
      full_name: string;
    };
    services?: {
      title: string;
      price: number;
    };
  };
}

interface LocalPayment {
  id: string;
  booking_id: string;
  user_id: string;
  payment_method: 'waafipay' | 'dmoney';
  phone_number: string;
  amount: number;
  commission_amount: number;
  professional_amount: number;
  transaction_reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  verified_by?: string;
  initiated_at: string;
  verified_at?: string;
  booking?: {
    client?: {
      full_name: string;
    };
    professional?: {
      full_name: string;
    };
    service?: {
      title: string;
    };
  };
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [localPayments, setLocalPayments] = useState<LocalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'stripe' | 'local'>('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedLocalPayment, setSelectedLocalPayment] = useState<LocalPayment | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, paymentTypeFilter]);

  useEffect(() => {
    // Apply search filter
    if (searchTerm.trim() === '') {
      fetchPayments();
    }
  }, [searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Stripe payments (from bookings)
      if (paymentTypeFilter === 'all' || paymentTypeFilter === 'stripe') {
        let query = supabase
          .from('bookings')
          .select(`
            id,
            status,
            payment_status,
            payment_method,
            created_at,
            client_id,
            professional_id,
            service_id,
            total_amount,
            profiles!bookings_client_id_fkey(full_name, phone),
            professional_profile:profiles!bookings_professional_id_fkey(full_name, phone),
            services(title, price)
          `)
          .or('payment_method.is.null,payment_method.eq.stripe')
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('payment_status', statusFilter);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Error:', fetchError);
          setError('Error loading Stripe payments');
        } else {
          const formattedPayments = (data || []).map((booking: any) => ({
            id: booking.id,
            booking_id: booking.id,
            amount: booking.total_amount || booking.services?.price || 0,
            status: booking.payment_status || 'pending',
            payment_method: 'Stripe',
            created_at: booking.created_at,
            bookings: {
              profiles: booking.profiles,
              professional_profile: booking.professional_profile,
              services: booking.services
            }
          }));

          setPayments(formattedPayments);
        }
      } else {
        setPayments([]);
      }

      // Fetch local payments (WaafiPay & D-Money)
      if (paymentTypeFilter === 'all' || paymentTypeFilter === 'local') {
        let localQuery = supabase
          .from('local_payments')
          .select(`
            *,
            booking:bookings(
              client:profiles!bookings_client_id_fkey(full_name),
              professional:profiles!bookings_professional_id_fkey(full_name),
              service:services(title)
            )
          `)
          .order('initiated_at', { ascending: false });

        if (statusFilter !== 'all') {
          localQuery = localQuery.eq('status', statusFilter === 'paid' ? 'completed' : statusFilter);
        }

        const { data: localData, error: localError } = await localQuery;

        if (localError) {
          console.error('Error:', localError);
          setError('Error loading local payments');
        } else {
          setLocalPayments(localData || []);
        }
      } else {
        setLocalPayments([]);
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLocalPayment = async () => {
    if (!selectedLocalPayment) return;

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/local-payment-processing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'confirm_local_payment',
            payment_id: selectedLocalPayment.id,
            verified_by: 'admin'
          })
        }
      );

      if (response.ok) {
        setShowVerifyModal(false);
        setSelectedLocalPayment(null);
        fetchPayments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to verify payment');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error verifying payment');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'refunded':
        return 'Refunded';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method.toLowerCase()) {
      case 'stripe':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Stripe</span>;
      case 'waafipay':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">WaafiPay</span>;
      case 'dmoney':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">D-Money</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{method}</span>;
    }
  };

  const toggleSelectPayment = (id: string) => {
    setSelectedPayments(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.id));
    }
  };

  const exportData = () => {
    try {
      const dataToExport = selectedPayments.length > 0
        ? payments.filter(p => selectedPayments.includes(p.id))
        : payments;

      const csv = [
        ['ID', 'Client', 'Professionnel', 'Service', 'Montant', 'Statut', 'Date'].join(','),
        ...dataToExport.map(p => [
          p.id,
          p.bookings?.profiles?.full_name || 'N/A',
          p.bookings?.professional_profile?.full_name || 'N/A',
          p.bookings?.services?.title || 'N/A',
          p.amount,
          getStatusLabel(p.status),
          new Date(p.created_at).toLocaleDateString('fr-FR')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Erreur lors de l\'export des données');
    }
  };

  // Combiner tous les paiements pour la pagination
  const allPayments = [
    ...payments.map(p => ({ ...p, paymentType: 'stripe' as const })),
    ...localPayments.map(p => ({ ...p, paymentType: 'local' as const }))
  ].sort((a, b) => {
    const dateA = 'created_at' in a ? new Date(a.created_at).getTime() : new Date(a.initiated_at).getTime();
    const dateB = 'created_at' in b ? new Date(b.created_at).getTime() : new Date(b.initiated_at).getTime();
    return dateB - dateA;
  });

  // Pagination
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = allPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(allPayments.length / paymentsPerPage);

  const totalRevenue = payments
    .filter(p => p.status === 'paid' || p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0) +
    localPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0) +
    localPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalTransactions = payments.length + localPayments.length;
  const completedTransactions = payments.filter(p => p.status === 'paid' || p.status === 'completed').length +
    localPayments.filter(p => p.status === 'completed').length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <i className="ri-error-warning-line mr-2"></i>
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
        <div className="flex space-x-3">
          {selectedPayments.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-download-line mr-2"></i>
              Export Selection ({selectedPayments.length})
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-download-line mr-2"></i>
            Export All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalRevenue.toLocaleString()} DJF</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{pendingRevenue.toLocaleString()} DJF</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-exchange-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalTransactions > 0 
                  ? Math.round((completedTransactions / totalTransactions) * 100)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Client, professional, service..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPaymentTypeFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  paymentTypeFilter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPaymentTypeFilter('stripe')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  paymentTypeFilter === 'stripe'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Stripe
              </button>
              <button
                onClick={() => setPaymentTypeFilter('local')}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  paymentTypeFilter === 'local'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Local (WaafiPay/D-Money)
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchPayments}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('refunded')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'refunded'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refunded
          </button>
        </div>
      </div>

      {/* Local Payments Pending Verification */}
      {localPayments.filter(p => p.status === 'pending').length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
            <i className="ri-alert-line text-2xl"></i>
            Local Payments Pending Verification ({localPayments.filter(p => p.status === 'pending').length})
          </h3>
          <div className="space-y-3">
            {localPayments.filter(p => p.status === 'pending').map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPaymentMethodBadge(payment.payment_method)}
                    <span className="text-sm font-mono text-gray-600">{payment.transaction_reference}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium ml-2">{payment.booking?.client?.full_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-teal-600 ml-2">{payment.amount.toLocaleString()} DJF</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium ml-2">+253 {payment.phone_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Initiated:</span>
                      <span className="ml-2">{new Date(payment.initiated_at).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedLocalPayment(payment);
                    setShowVerifyModal(true);
                  }}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-check-line mr-2"></i>
                  Verify Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPayments.map((payment) => {
                if (payment.paymentType === 'stripe') {
                  const stripePayment = payment as Payment & { paymentType: 'stripe' };
                  return (
                    <tr key={`stripe-${stripePayment.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stripePayment.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge('Stripe')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stripePayment.bookings?.profiles?.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {stripePayment.bookings?.professional_profile?.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stripePayment.bookings?.services?.title || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {stripePayment.amount.toLocaleString()} DJF
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stripePayment.status)}`}>
                          {getStatusLabel(stripePayment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(stripePayment.created_at).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                  );
                } else {
                  const localPayment = payment as LocalPayment & { paymentType: 'local' };
                  return (
                    <tr key={`local-${localPayment.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {localPayment.transaction_reference}
                        </div>
                        <div className="text-xs text-gray-500">
                          +253 {localPayment.phone_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(localPayment.payment_method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {localPayment.booking?.client?.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {localPayment.booking?.professional?.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {localPayment.booking?.service?.title || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {localPayment.amount.toLocaleString()} DJF
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(localPayment.status)}`}>
                          {getStatusLabel(localPayment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(localPayment.initiated_at).toLocaleDateString('en-US')}
                      </td>
                    </tr>
                  );
                }
              })}

              {currentPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <i className="ri-file-list-line text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No payments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {indexOfFirstPayment + 1} à {Math.min(indexOfLastPayment, allPayments.length)} sur {allPayments.length} paiements
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verify Payment Modal */}
      {showVerifyModal && selectedLocalPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Verify Local Payment</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                {getPaymentMethodBadge(selectedLocalPayment.payment_method)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Ref:</span>
                <span className="font-mono text-sm">{selectedLocalPayment.transaction_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone Number:</span>
                <span className="font-medium">+253 {selectedLocalPayment.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-teal-600">{selectedLocalPayment.amount.toLocaleString()} DJF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{selectedLocalPayment.booking?.client?.full_name || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <i className="ri-alert-line mr-2"></i>
                Please verify that the payment has been received in your {selectedLocalPayment.payment_method === 'waafipay' ? 'WaafiPay' : 'D-Money'} merchant account before confirming.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleVerifyLocalPayment}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-check-line"></i>
                    Confirm Payment
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedLocalPayment(null);
                }}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Exporter les données</h3>
            <p className="text-gray-600 mb-6">
              {selectedPayments.length > 0
                ? `Exporter ${selectedPayments.length} paiement(s) sélectionné(s) ?`
                : `Exporter tous les ${payments.length} paiements ?`}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={exportData}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                Exporter CSV
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
