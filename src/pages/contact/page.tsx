import { useEffect, useState } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import Button from '../../components/base/Button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    userType: 'client'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    document.title = "Contact - DjibGo | Contactez-nous pour vos questions";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formBody = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        formBody.append(key, value);
      });

      const response = await fetch('https://readdy.ai/api/form/d4vee0unfc78pt9tmiq0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString()
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          userType: 'client'
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const contactInfo = [
    {
      icon: 'ri-phone-line',
      title: 'Téléphone',
      content: '+253 77 55 09 08',
      link: 'tel:+25377550908'
    },
    {
      icon: 'ri-mail-line',
      title: 'Email',
      content: 'djibgoservice@gmail.com',
      link: 'mailto:djibgoservice@gmail.com'
    },
    {
      icon: 'ri-map-pin-line',
      title: 'Adresse',
      content: 'Djibouti, Centre Ville',
      link: null
    },
    {
      icon: 'ri-time-line',
      title: 'Horaires',
      content: '24/7',
      link: null
    }
  ];

  const faqs = [
    {
      question: 'Comment puis-je devenir professionnel sur DjibGo ?',
      answer: 'Inscrivez-vous via notre formulaire professionnel, complétez votre profil avec vos qualifications, et notre équipe validera votre compte sous 24-48h.'
    },
    {
      question: 'Les professionnels sont-ils vérifiés ?',
      answer: 'Oui, tous nos professionnels passent par un processus de vérification incluant la validation de leurs documents et qualifications.'
    },
    {
      question: 'Comment fonctionne le paiement ?',
      answer: 'Le paiement se fait directement entre vous et le professionnel. Nous proposons plusieurs options sécurisées via notre plateforme.'
    },
    {
      question: 'Puis-je annuler une réservation ?',
      answer: 'Oui, vous pouvez annuler une réservation selon les conditions d\'annulation du professionnel. Consultez notre politique d\'annulation pour plus de détails.'
    }
  ];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20customer%20service%20representative%20with%20headset%20in%20bright%20contemporary%20office%2C%20professional%20African%20team%20helping%20clients%2C%20warm%20welcoming%20atmosphere%2C%20natural%20lighting%2C%20clean%20workspace%20with%20computers%20and%20plants%2C%20customer%20support%20center%20in%20Djibouti&width=1920&height=800&seq=contact-hero-bg&orientation=landscape')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Contactez <strong className="text-orange-400">DjibGo</strong>
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto leading-relaxed">
            Notre équipe est à votre écoute pour répondre à toutes vos questions et vous accompagner dans votre expérience DjibGo.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`${info.icon} text-2xl text-orange-500`}></i>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{info.title}</h3>
                {info.link ? (
                  <a href={info.link} className="text-gray-600 hover:text-orange-500 transition-colors">
                    {info.content}
                  </a>
                ) : (
                  <p className="text-gray-600">{info.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Envoyez-nous un <span className="text-orange-500">Message</span>
              </h2>
              <p className="text-gray-600 text-lg">
                Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Contact Form */}
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <form onSubmit={handleSubmit} id="contact-form" data-readdy-form>
                  <div className="mb-6">
                    <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                      Vous êtes
                    </label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="client">Un client</option>
                      <option value="professional">Un professionnel</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      required
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      required
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="+253 77 XX XX XX"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      required
                      placeholder="Objet de votre message"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                      required
                      placeholder="Décrivez votre demande en détail (max 500 caractères)"
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.message.length}/500 caractères
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 whitespace-nowrap"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line mr-2"></i>
                        Envoyer le message
                      </>
                    )}
                  </Button>

                  {submitStatus === 'success' && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-checkbox-circle-line text-green-600 text-xl mr-2"></i>
                        <p className="text-green-700 font-medium">
                          Message envoyé avec succès ! Nous vous répondrons bientôt.
                        </p>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-error-warning-line text-red-600 text-xl mr-2"></i>
                        <p className="text-red-700 font-medium">
                          Erreur lors de l'envoi. Veuillez réessayer.
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* FAQ Section */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">
                  Questions <span className="text-orange-500">Fréquentes</span>
                </h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-start">
                        <i className="ri-question-line text-orange-500 mr-2 mt-1"></i>
                        {faq.question}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed ml-7">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <i className="ri-information-line text-orange-500 mr-2"></i>
                    Besoin d'aide immédiate ?
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Consultez notre page d'aide ou contactez-nous directement par téléphone.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white whitespace-nowrap"
                      onClick={() => window.REACT_APP_NAVIGATE('/faq')}
                    >
                      <i className="ri-question-answer-line mr-2"></i>
                      Voir la FAQ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white whitespace-nowrap"
                      onClick={() => window.REACT_APP_NAVIGATE('/support')}
                    >
                      <i className="ri-customer-service-line mr-2"></i>
                      Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Notre <span className="text-orange-500">Localisation</span>
            </h2>
            <p className="text-gray-600 text-lg">
              Retrouvez-nous à Djibouti
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-lg overflow-hidden">
              <div className="w-full h-96">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62057.89793085394!2d43.11453!3d11.58901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x162f7b8c8c8c8c8d%3A0x8c8c8c8c8c8c8c8c!2sDjibouti!5e0!3m2!1sen!2sdj!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="DjibGo Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
