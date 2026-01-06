
import LazyImage from '../../../components/base/LazyImage';

interface Service {
  id: number;
  name: string;
  icon: string;
  description: string;
  professionalCount: number;
  avgPrice: string;
  image: string;
}

interface ServiceCardProps {
  service: Service;
  onExploreClick?: () => void;
}

export default function ServiceCard({ service, onExploreClick }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="relative h-40 overflow-hidden">
        <LazyImage
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className={`${service.icon} text-orange-600 text-lg`}></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.professionalCount} professionnels</p>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-500">À partir de</span>
            <span className="font-bold text-orange-600 ml-1">{service.avgPrice}</span>
          </div>
          <button 
            onClick={onExploreClick}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            Explore Services
          </button>
        </div>
      </div>
    </div>
  );
}
