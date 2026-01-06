
import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Simulation de données analytiques
    setTimeout(() => {
      setAnalyticsData({
        userGrowth: [
          { month: 'Jan', users: 120, professionals: 15 },
          { month: 'Fév', users: 180, professionals: 22 },
          { month: 'Mar', users: 240, professionals: 35 },
          { month: 'Avr', users: 320, professionals: 48 },
          { month: 'Mai', users: 410, professionals: 65 },
          { month: 'Jun', users: 520, professionals: 82 }
        ],
        revenue: [
          { month: 'Jan', amount: 1200 },
          { month: 'Fév', amount: 1800 },
          { month: 'Mar', amount: 2400 },
          { month: 'Avr', amount: 3200 },
          { month: 'Mai', amount: 4100 },
          { month: 'Jun', amount: 5200 }
        ],
        topServices: [
          { name: 'Plomberie', bookings: 150, revenue: 12500 },
          { name: 'Électricité', bookings: 120, revenue: 9800 },
          { name: 'Ménage', bookings: 200, revenue: 8000 },
          { name: 'Jardinage', bookings: 80, revenue: 6400 },
          { name: 'Peinture', bookings: 90, revenue: 7200 }
        ]
      });
      setLoading(false);
    }, 1000);
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Analyses et Statistiques</h2>
        <div className="flex space-x-3">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
            <option>Derniers 30 jours</option>
            <option>Derniers 90 jours</option>
            <option>Cette année</option>
          </select>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <i className="ri-download-line mr-2"></i>
            Rapport
          </button>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Croissance des utilisateurs</h3>
        <div className="h-64 flex items-end space-x-4 pb-4">
          {analyticsData.userGrowth.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col space-y-1">
                <div 
                  className="bg-teal-500 rounded-t"
                  style={{ height: `${(data.users / 520) * 200}px` }}
                ></div>
                <div 
                  className="bg-orange-500 rounded-b"
                  style={{ height: `${(data.professionals / 82) * 80}px` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-teal-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Utilisateurs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Professionnels</span>
          </div>
        </div>
      </div>

      {/* Revenue and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chiffre d'affaires mensuel</h3>
          <div className="h-48 flex items-end space-x-3 pb-4">
            {analyticsData.revenue.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-green-500 rounded-t flex items-end justify-center pb-1"
                  style={{ height: `${(data.amount / 5200) * 160}px` }}
                >
                  <span className="text-white text-xs font-medium">
                    {(data.amount / 1000).toFixed(1)}k€
                  </span>
                </div>
                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services les plus demandés</h3>
          <div className="space-y-3">
            {analyticsData.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600">{service.bookings} réservations</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{service.revenue}€</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(service.bookings / 200) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-user-add-line text-blue-600 text-xl"></i>
          </div>
          <p className="text-2xl font-bold text-gray-900">+23%</p>
          <p className="text-gray-600">Nouveaux utilisateurs</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-calendar-check-line text-green-600 text-xl"></i>
          </div>
          <p className="text-2xl font-bold text-gray-900">87%</p>
          <p className="text-gray-600">Taux de conversion</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-star-line text-yellow-600 text-xl"></i>
          </div>
          <p className="text-2xl font-bold text-gray-900">4.8</p>
          <p className="text-gray-600">Note moyenne</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-time-line text-purple-600 text-xl"></i>
          </div>
          <p className="text-2xl font-bold text-gray-900">2.4h</p>
          <p className="text-gray-600">Temps moyen session</p>
        </div>
      </div>
    </div>
  );
}
