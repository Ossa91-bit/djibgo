import { useState } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function Support() {
  const [activeTab, setActiveTab] = useState('faq');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openBookingFaq, setOpenBookingFaq] = useState<number | null>(null);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [bookingFormData, setBookingFormData] = useState({
    name: '',
    email: '',
    bookingId: '',
    issueType: 'reschedule',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [bookingSubmitMessage, setBookingSubmitMessage] = useState('');

  const scrollToBookingSupport = () => {
    const element = document.getElementById('booking-support');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation des données avant soumission
      if (!contactFormData.name || !contactFormData.email || !contactFormData.subject || !contactFormData.message) {
        throw new Error('Tous les champs requis doivent être remplis');
      }

      if (contactFormData.message.length > 500) {
        throw new Error('Le message ne peut pas dépasser 500 caractères');
      }

      // Préparation des données en format application/x-www-form-urlencoded
      const formParams = new URLSearchParams();
      formParams.append('name', contactFormData.name);
      formParams.append('email', contactFormData.email);
      formParams.append('subject', contactFormData.subject);
      formParams.append('message', contactFormData.message);
      formParams.append('priority', contactFormData.priority);

      const response = await fetch('https://readdy.ai/api/form/d4tn9d6u005hmhpl8c70', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString()
      });

      if (response.ok) {
        setSubmitMessage('Votre message a été envoyé avec succès ! Nous vous répondrons dans les 24 heures.');
        setContactFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'normal'
        });
        
        // Auto-effacement du message après 5 secondes
        setTimeout(() => setSubmitMessage(''), 5000);
      } else {
        throw new Error('Échec de l\'envoi du message');
      }
    } catch (error: any) {
      setSubmitMessage(`Erreur lors de l'envoi : ${error.message}. Veuillez réessayer.`);
      setTimeout(() => setSubmitMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingSubmitting(true);

    try {
      // Validation des données avant soumission
      if (!bookingFormData.name || !bookingFormData.email || !bookingFormData.message) {
        throw new Error('Tous les champs requis doivent être remplis');
      }

      if (bookingFormData.message.length > 500) {
        throw new Error('Le message ne peut pas dépasser 500 caractères');
      }

      // Préparation des données en format application/x-www-form-urlencoded
      const formParams = new URLSearchParams();
      formParams.append('name', bookingFormData.name);
      formParams.append('email', bookingFormData.email);
      formParams.append('bookingId', bookingFormData.bookingId);
      formParams.append('issueType', bookingFormData.issueType);
      formParams.append('message', bookingFormData.message);
      formParams.append('priority', bookingFormData.priority);

      const response = await fetch('https://readdy.ai/api/form/d4u8qvs0r9mt3nkms58g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString()
      });

      if (response.ok) {
        setBookingSubmitMessage('Votre demande de support de réservation a été soumise ! Notre équipe vous contactera dans les 4 heures.');
        setBookingFormData({
          name: '',
          email: '',
          bookingId: '',
          issueType: 'reschedule',
          message: '',
          priority: 'normal'
        });
        
        // Auto-effacement du message après 5 secondes
        setTimeout(() => setBookingSubmitMessage(''), 5000);
      } else {
        throw new Error('Échec de l\'envoi de la demande de réservation');
      }
    } catch (error: any) {
      setBookingSubmitMessage(`Erreur lors de l'envoi : ${error.message}. Veuillez réessayer.`);
      setTimeout(() => setBookingSubmitMessage(''), 5000);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const faqData = [
    {
      question: "How do I book a professional service?",
      answer: "Simply browse our services, select a professional, choose your preferred time slot, and confirm your booking. You'll receive a confirmation message with all the details."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and mobile payments through our secure payment system powered by Stripe."
    },
    {
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes, you can cancel or reschedule your booking up to 24 hours before the scheduled time without any charges. For cancellations within 24 hours, a small fee may apply."
    },
    {
      question: "How do I become a professional on DjibGo?",
      answer: "Click on 'Become a Professional' on our homepage, fill out the application form with your credentials and experience, and our team will review your application within 48 hours."
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely! We use enterprise-grade security measures and encryption to protect your personal information. Your data is never shared with third parties without your consent."
    },
    {
      question: "What areas does DjibGo serve?",
      answer: "DjibGo currently serves all major areas in Djibouti City and surrounding regions. We're constantly expanding our service areas based on demand."
    },
    {
      question: "How do I contact a professional directly?",
      answer: "You can message professionals through our platform or use the WhatsApp contact option available on each professional's profile page."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "We have a satisfaction guarantee. If you're not happy with the service, contact our support team within 24 hours and we'll work with you to resolve the issue or provide a refund."
    }
  ];

  const bookingFaqData = [
    {
      question: "How do I cancel my booking?",
      answer: "You can cancel your booking by going to your dashboard, finding the booking, and clicking 'Cancel'. For cancellations within 24 hours, please contact support directly."
    },
    {
      question: "Can I reschedule my appointment?",
      answer: "Yes! You can reschedule up to 2 hours before your appointment time. Go to your dashboard, select the booking, and choose 'Reschedule' to pick a new time slot."
    },
    {
      question: "What if the professional doesn't show up?",
      answer: "If your professional doesn't arrive within 15 minutes of the scheduled time, please contact them directly or our support team immediately. We'll help resolve the issue and arrange a replacement if needed."
    },
    {
      question: "How do I modify booking details?",
      answer: "Most booking details can be modified from your dashboard. For changes to location or special requests, please contact the professional directly or our support team."
    },
    {
      question: "I can't find my booking confirmation",
      answer: "Check your email for the confirmation message. You can also view all your bookings in your dashboard under 'My Bookings'. If you still can't find it, contact support with your email address."
    },
    {
      question: "The professional wants to change the time, what do I do?",
      answer: "If a professional requests a time change, you'll receive a notification. You can accept or decline the new time through your dashboard or by replying to the notification."
    }
  ];

  const supportCategories = [
    {
      icon: "ri-question-line",
      title: "General Help",
      description: "Get answers to common questions about using DjibGo",
      action: () => setActiveTab('faq')
    },
    {
      icon: "ri-calendar-line",
      title: "Booking Issues",
      description: "Help with scheduling, canceling, or modifying appointments",
      action: scrollToBookingSupport
    },
    {
      icon: "ri-user-line",
      title: "Account Support",
      description: "Assistance with your profile, settings, and account management",
      action: () => setActiveTab('contact')
    },
    {
      icon: "ri-credit-card-line",
      title: "Payment Help",
      description: "Support for billing, refunds, and payment methods",
      action: () => setActiveTab('contact')
    },
    {
      icon: "ri-shield-check-line",
      title: "Safety & Security",
      description: "Report issues or get help with safety concerns",
      action: () => setActiveTab('contact')
    },
    {
      icon: "ri-tools-line",
      title: "Technical Support",
      description: "Help with app functionality and technical problems",
      action: () => setActiveTab('contact')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <strong>How can we help you?</strong>
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Find answers to your questions or get in touch with our support team
            </p>
            
            {/* Quick Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help topics..."
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                  <i className="ri-search-line text-gray-500 text-xl"></i>
                </div>
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors font-medium whitespace-nowrap">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Choose Your Support Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportCategories.map((category, index) => (
              <button
                key={index}
                onClick={category.action}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left w-full"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <i className={`${category.icon} text-orange-500 text-2xl`}></i>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {category.title}
                </h3>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Support Section */}
      <section id="booking-support" className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-calendar-line text-white text-3xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Booking Issues Support
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Having trouble with your booking? We're here to help you resolve any scheduling, cancellation, or modification issues quickly.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl border border-blue-200 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-check-line text-green-500 text-2xl"></i>
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Reschedule</h4>
                <p className="text-gray-600 text-sm mb-4">Change your appointment time</p>
                <a href="/dashboard" className="text-green-500 hover:text-green-600 font-medium">
                  Go to Dashboard →
                </a>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-blue-200 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-close-line text-red-500 text-2xl"></i>
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Cancel</h4>
                <p className="text-gray-600 text-sm mb-4">Cancel your booking</p>
                <a href="/dashboard" className="text-red-500 hover:text-red-600 font-medium">
                  Go to Dashboard →
                </a>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-blue-200 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-customer-service-line text-orange-500 text-2xl"></i>
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Need Help?</h4>
                <p className="text-gray-600 text-sm mb-4">Contact support directly</p>
                <a href="https://wa.me/+25377123456" className="text-orange-500 hover:text-orange-600 font-medium">
                  WhatsApp Support →
                </a>
              </div>
            </div>

            {/* Booking FAQ */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
                Common Booking Questions
              </h3>
              <div className="space-y-4">
                {bookingFaqData.map((faq, index) => (
                  <div key={index} className="bg-white border border-blue-200 rounded-lg">
                    <button
                      onClick={() => setOpenBookingFaq(openBookingFaq === index ? null : index)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i className={`ri-${openBookingFaq === index ? 'subtract' : 'add'}-line text-blue-500 text-xl`}></i>
                      </div>
                    </button>
                    {openBookingFaq === index && (
                      <div className="px-6 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Issue Form */}
            <div className="bg-white p-8 rounded-xl border border-blue-200">
              <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
                Soumettre un problème de réservation
              </h3>
              
              <form onSubmit={handleBookingSubmit} data-readdy-form id="booking-support-form" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={bookingFormData.name}
                      onChange={(e) => setBookingFormData({...bookingFormData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre nom complet"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse e-mail *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={bookingFormData.email}
                      onChange={(e) => setBookingFormData({...bookingFormData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="votre.email@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID de réservation (si disponible)
                    </label>
                    <input
                      type="text"
                      name="bookingId"
                      value={bookingFormData.bookingId}
                      onChange={(e) => setBookingFormData({...bookingFormData, bookingId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: BK-12345"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de problème *
                    </label>
                    <select
                      name="issueType"
                      required
                      value={bookingFormData.issueType}
                      onChange={(e) => setBookingFormData({...bookingFormData, issueType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="reschedule">Reprogrammer le rendez-vous</option>
                      <option value="cancel">Annuler la réservation</option>
                      <option value="modify">Modifier les détails de la réservation</option>
                      <option value="no-show">Professionnel absent</option>
                      <option value="payment">Problème de paiement</option>
                      <option value="other">Autre problème</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de priorité
                  </label>
                  <select
                    name="priority"
                    value={bookingFormData.priority}
                    onChange={(e) => setBookingFormData({...bookingFormData, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Faible - Peut attendre 24+ heures</option>
                    <option value="normal">Normal - Dans les 4-8 heures</option>
                    <option value="high">Élevé - Dans les 2 heures</option>
                    <option value="urgent">Urgent - Attention immédiate requise</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Décrivez votre problème *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    maxLength={500}
                    value={bookingFormData.message}
                    onChange={(e) => setBookingFormData({...bookingFormData, message: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Veuillez fournir des détails sur votre problème de réservation, y compris les dates, heures et toute information pertinente..."
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {bookingFormData.message.length}/500
                  </div>
                </div>
                
                {bookingSubmitMessage && (
                  <div className={`p-4 rounded-lg ${
                    bookingSubmitMessage.includes('soumise') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      <i className={`${
                        bookingSubmitMessage.includes('soumise') 
                          ? 'ri-check-circle-line' 
                          : 'ri-error-warning-line'
                      } mr-2`}></i>
                      {bookingSubmitMessage}
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isBookingSubmitting || bookingFormData.message.length > 500}
                    className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isBookingSubmitting ? 'Envoi en cours...' : 'Soumettre le problème de réservation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Support Tabs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`px-6 py-3 rounded-md font-medium transition-all whitespace-nowrap ${
                    activeTab === 'faq'
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  FAQ
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`px-6 py-3 rounded-md font-medium transition-all whitespace-nowrap ${
                    activeTab === 'contact'
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Contact Support
                </button>
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`px-6 py-3 rounded-md font-medium transition-all whitespace-nowrap ${
                    activeTab === 'guides'
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  User Guides
                </button>
              </div>
            </div>

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div id="faq">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  {faqData.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <i className={`ri-${openFaq === index ? 'subtract' : 'add'}-line text-orange-500 text-xl`}></i>
                        </div>
                      </button>
                      {openFaq === index && (
                        <div className="px-6 pb-4 text-gray-600">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div id="contact">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
                  Contact Our Support Team
                </h3>
                
                {/* Contact Methods */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-whatsapp-line text-green-500 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">WhatsApp</h4>
                    <p className="text-gray-600 text-sm mb-3">Quick responses</p>
                    <a href="https://wa.me/+25377123456" className="text-green-500 hover:text-green-600 font-medium">
                      +253 77 12 34 56
                    </a>
                  </div>
                  
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-mail-line text-blue-500 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">Email</h4>
                    <p className="text-gray-600 text-sm mb-3">24h response time</p>
                    <a href="mailto:support@djibgo.dj" className="text-blue-500 hover:text-blue-600 font-medium">
                      support@djibgo.dj
                    </a>
                  </div>
                  
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-phone-line text-orange-500 text-2xl"></i>
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">Phone</h4>
                    <p className="text-gray-600 text-sm mb-3">Mon-Sat 8AM-6PM</p>
                    <a href="tel:+25321123456" className="text-orange-500 hover:text-orange-600 font-medium">
                      +253 21 12 34 56
                    </a>
                  </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleContactSubmit} data-readdy-form id="contact-support-form" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Votre nom complet"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse e-mail *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="votre.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sujet *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={contactFormData.subject}
                        onChange={(e) => setContactFormData({...contactFormData, subject: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Comment pouvons-nous vous aider ?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priorité
                      </label>
                      <select
                        name="priority"
                        value={contactFormData.priority}
                        onChange={(e) => setContactFormData({...contactFormData, priority: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="low">Faible - Question générale</option>
                        <option value="normal">Normal - Support standard</option>
                        <option value="high">Élevé - Problème urgent</option>
                        <option value="critical">Critique - Service en panne</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      maxLength={500}
                      value={contactFormData.message}
                      onChange={(e) => setContactFormData({...contactFormData, message: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Veuillez décrire votre problème ou question en détail..."
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {contactFormData.message.length}/500
                    </div>
                  </div>
                  
                  {submitMessage && (
                    <div className={`p-4 rounded-lg ${
                      submitMessage.includes('succès') 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <div className="flex items-center">
                        <i className={`${
                          submitMessage.includes('succès') 
                            ? 'ri-check-circle-line' 
                            : 'ri-error-warning-line'
                        } mr-2`}></i>
                        {submitMessage}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting || contactFormData.message.length > 500}
                      className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Guides Tab */}
            {activeTab === 'guides' && (
              <div>
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
                  User Guides & Tutorials
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <i className="ri-user-add-line text-blue-500 text-2xl"></i>
                    </div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Getting Started</h4>
                    <p className="text-gray-600 mb-4">Learn how to create your account, set up your profile, and make your first booking.</p>
                    <a href="#" className="text-blue-500 hover:text-blue-600 font-medium">
                      Read Guide →
                    </a>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <i className="ri-calendar-check-line text-green-500 text-2xl"></i>
                    </div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Booking Services</h4>
                    <p className="text-gray-600 mb-4">Step-by-step guide on how to find, book, and manage your professional services.</p>
                    <a href="#" className="text-green-500 hover:text-green-600 font-medium">
                      Read Guide →
                    </a>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <i className="ri-star-line text-purple-500 text-2xl"></i>
                    </div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">For Professionals</h4>
                    <p className="text-gray-600 mb-4">Complete guide for service providers on how to join, set up services, and manage bookings.</p>
                    <a href="#" className="text-purple-500 hover:text-purple-600 font-medium">
                      Read Guide →
                    </a>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <i className="ri-settings-line text-orange-500 text-2xl"></i>
                    </div>
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Account Management</h4>
                    <p className="text-gray-600 mb-4">Learn how to update your profile, change settings, and manage your account security.</p>
                    <a href="#" className="text-orange-500 hover:text-orange-600 font-medium">
                      Read Guide →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Contact Bar */}
      <section className="bg-orange-500 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white mb-4 md:mb-0">
              <h3 className="text-xl font-semibold mb-1">Need immediate assistance?</h3>
              <p className="opacity-90">Our support team is here to help you 24/7</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://wa.me/+25377123456"
                className="bg-white text-orange-500 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-center whitespace-nowrap"
              >
                <i className="ri-whatsapp-line mr-2"></i>
                WhatsApp Support
              </a>
              <a
                href="tel:+25321123456"
                className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-orange-500 transition-colors font-medium text-center whitespace-nowrap"
              >
                <i className="ri-phone-line mr-2"></i>
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}