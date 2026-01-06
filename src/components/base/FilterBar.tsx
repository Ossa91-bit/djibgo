import { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  categories: FilterOption[];
  priceRanges: FilterOption[];
  ratings: FilterOption[];
  locations: FilterOption[];
  availability: FilterOption[];
  distances: FilterOption[];
  districts?: FilterOption[];
  onFilterChange: (filters: any) => void;
  showDistanceFilter?: boolean;
  isMobile?: boolean;
  className?: string;
}

export default function FilterBar({
  categories,
  priceRanges,
  ratings,
  locations,
  availability,
  distances,
  districts = [],
  onFilterChange,
  showDistanceFilter = false,
  isMobile = false,
  className = ''
}: FilterBarProps) {
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    priceRange: '',
    rating: '',
    location: '',
    availability: '',
    distance: '',
    district: ''
  });

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = {
      ...selectedFilters,
      [filterType]: value
    };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      category: '',
      priceRange: '',
      rating: '',
      location: '',
      availability: '',
      distance: '',
      district: ''
    };
    setSelectedFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        {(selectedFilters.category || selectedFilters.priceRange || selectedFilters.rating || 
          selectedFilters.location || selectedFilters.availability || selectedFilters.distance || 
          selectedFilters.district) && (
          <button
            onClick={clearFilters}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Catégorie
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={selectedFilters.category === category.value}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Localisation
          </label>
          <div className="space-y-2">
            {locations.map((location) => (
              <label key={location.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="location"
                  value={location.value}
                  checked={selectedFilters.location === location.value}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">{location.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quartier */}
        {districts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quartier
            </label>
            <select
              value={selectedFilters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm cursor-pointer"
            >
              <option value="">Tous les quartiers</option>
              {districts.map((district) => (
                <option key={district.id} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              <i className="ri-information-line mr-1"></i>
              Filtrage précis par quartier
            </p>
          </div>
        )}

        {/* Distance */}
        {showDistanceFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <i className="ri-map-pin-distance-line mr-1 text-teal-600"></i>
              Distance
            </label>
            <div className="space-y-2">
              {distances.map((distance) => (
                <label key={distance.id} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="distance"
                    value={distance.value}
                    checked={selectedFilters.distance === distance.value}
                    onChange={(e) => handleFilterChange('distance', e.target.value)}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700">{distance.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tarif horaire */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tarif horaire
          </label>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label key={range.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priceRange"
                  value={range.value}
                  checked={selectedFilters.priceRange === range.value}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Note minimum
          </label>
          <div className="space-y-2">
            {ratings.map((rating) => (
              <label key={rating.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={rating.value}
                  checked={selectedFilters.rating === rating.value}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">{rating.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Disponibilité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Disponibilité
          </label>
          <div className="space-y-2">
            {availability.map((avail) => (
              <label key={avail.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value={avail.value}
                  checked={selectedFilters.availability === avail.value}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">{avail.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
