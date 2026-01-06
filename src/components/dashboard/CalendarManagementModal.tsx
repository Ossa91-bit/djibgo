
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../base/LoadingSpinner';

interface CalendarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
}

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  client: {
    full_name: string;
    phone: string;
  };
  service: {
    name: string;
  };
}

const CalendarManagementModal: React.FC<CalendarManagementModalProps> = ({
  isOpen,
  onClose,
  professionalId,
}) => {
  const [activeTab, setActiveTab] = useState<'availability' | 'bookings'>('availability');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadCalendarData();
    }
  }, [isOpen, professionalId]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Load availability time slots
      const { data: slots, error: slotsError } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', professionalId)
        .order('day_of_week', { ascending: true });

      if (slotsError) throw slotsError;

      // Initialize default time slots if none exist
      if (!slots || slots.length === 0) {
        const defaultSlots: TimeSlot[] = daysOfWeek.slice(1, 6).map(day => ({
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: true,
        }));
        setTimeSlots(defaultSlots);
      } else {
        setTimeSlots(slots);
      }

      // Load upcoming bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          client:profiles!bookings_client_id_fkey(full_name, phone),
          services(name)
        `)
        .eq('professional_id', professionalId)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .limit(20);

      if (bookingsError) throw bookingsError;
      
      // Transform the data to match the expected structure
      const transformedBookings = (bookings || []).map((booking: any) => ({
        id: booking.id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        client: booking.client,
        service: {
          name: booking.services?.name || 'Service non spécifié'
        }
      }));
      
      setUpcomingBookings(transformedBookings);
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      // Delete existing availability
      await supabase
        .from('professional_availability')
        .delete()
        .eq('professional_id', professionalId);

      // Insert new availability
      const slotsToInsert = timeSlots
        .filter(slot => slot.is_available)
        .map(slot => ({
          professional_id: professionalId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        }));

      if (slotsToInsert.length > 0) {
        const { error } = await supabase
          .from('professional_availability')
          .insert(slotsToInsert);

        if (error) throw error;
      }

      alert('Disponibilités enregistrées avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement des disponibilités');
    } finally {
      setSaving(false);
    }
  };

  const updateTimeSlot = (dayOfWeek: number, field: keyof TimeSlot, value: any) => {
    setTimeSlots(prev => {
      const existing = prev.find(slot => slot.day_of_week === dayOfWeek);
      if (existing) {
        return prev.map(slot =>
          slot.day_of_week === dayOfWeek ? { ...slot, [field]: value } : slot
        );
      } else {
        return [...prev, {
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          is_available: field === 'is_available' ? value : true,
          [field]: value,
        }];
      }
    });
  };

  const getTimeSlot = (dayOfWeek: number): TimeSlot => {
    return timeSlots.find(slot => slot.day_of_week === dayOfWeek) || {
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: false,
    };
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Reload bookings
      await loadCalendarData();
      alert('Statut de la réservation mis à jour !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
              <i className="ri-calendar-line text-teal-600 text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestion du Calendrier</h2>
              <p className="text-gray-600 text-sm">Gérez vos disponibilités et réservations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-2xl text-gray-600"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'availability'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-time-line mr-2"></i>
              Disponibilités
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-calendar-check-line mr-2"></i>
              Réservations ({upcomingBookings.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {activeTab === 'availability' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <i className="ri-information-line text-blue-600 text-xl mr-3 mt-0.5"></i>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Définissez vos horaires de travail</h4>
                        <p className="text-blue-800 text-sm">
                          Cochez les jours où vous êtes disponible et définissez vos horaires. Les clients pourront réserver uniquement pendant ces créneaux.
                        </p>
                      </div>
                    </div>
                  </div>

                  {daysOfWeek.map(day => {
                    const slot = getTimeSlot(day.value);
                    return (
                      <div
                        key={day.value}
                        className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4"
                      >
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.is_available}
                            onChange={(e) => updateTimeSlot(day.value, 'is_available', e.target.checked)}
                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="ml-3 font-medium text-gray-900 w-24">{day.label}</span>
                        </label>

                        {slot.is_available && (
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="flex items-center">
                              <label className="text-sm text-gray-600 mr-2">De:</label>
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateTimeSlot(day.value, 'start_time', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              />
                            </div>
                            <div className="flex items-center">
                              <label className="text-sm text-gray-600 mr-2">À:</label>
                              <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateTimeSlot(day.value, 'end_time', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveAvailability}
                      disabled={saving}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {saving ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line mr-2"></i>
                          Enregistrer les disponibilités
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-calendar-line text-gray-400 text-4xl"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune réservation à venir</h3>
                      <p className="text-gray-600">Vos prochaines réservations apparaîtront ici</p>
                    </div>
                  ) : (
                    upcomingBookings.map(booking => (
                      <div
                        key={booking.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                                <i className="ri-user-line text-teal-600 text-lg"></i>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{booking.client.full_name}</h4>
                                <p className="text-sm text-gray-600">{booking.client.phone}</p>
                              </div>
                            </div>

                            <div className="ml-13 space-y-1">
                              <div className="flex items-center text-sm text-gray-700">
                                <i className="ri-briefcase-line mr-2 text-gray-400"></i>
                                {booking.service.name}
                              </div>
                              <div className="flex items-center text-sm text-gray-700">
                                <i className="ri-calendar-line mr-2 text-gray-400"></i>
                                {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="flex items-center text-sm text-gray-700">
                                <i className="ri-time-line mr-2 text-gray-400"></i>
                                {booking.start_time} - {booking.end_time}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {booking.status === 'confirmed' ? 'Confirmée' : 
                               booking.status === 'pending' ? 'En attente' : booking.status}
                            </span>

                            {booking.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                                  title="Confirmer"
                                >
                                  <i className="ri-check-line"></i>
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                                  title="Annuler"
                                >
                                  <i className="ri-close-line"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarManagementModal;
