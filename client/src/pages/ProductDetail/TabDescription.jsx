import { ImageOff } from 'lucide-react';
import { MOCK_PACKAGE_COMPONENTS } from './mockData.js';

// ── Package description: components with images + descriptions ─────────────
const PackageDescription = ({ components,description }) => (

  <div className=''>
      {description && (
      <p className="text-gray-700 text-base leading-relaxed mb-8">
        {description}
      </p>
    )}
    <div className="border-t border-gray-100">
      <div className="bg-[#f9f9f9] px-6 py-3 text-sm font-semibold text-gray-600 text-center ">
        Components
      </div>
      <div className="divide-y divide-gray-100">
        {components.map((comp, i) => (
          <div key={i} className="flex gap-6 py-8 px-2">
            <div className="w-[120px] h-[120px] flex-shrink-0 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
              {comp.image ? (
                <img src={comp.image} alt={comp.name} className="w-full h-full object-contain" />
              ) : (
                <ImageOff size={28} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h4 className="font-bold text-gray-900 text-base">{comp.name}</h4>
                <span className="text-[10px] font-bold border border-gray-300 text-gray-500 rounded-full px-2.5 py-0.5">
                  {comp.qty} Unit{comp.qty !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                  {comp.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
const NormalDescription = ({ product }) => (
  <div className="max-w-4xl space-y-6">

    {product.description ? (
      <div
        className="text-black bg-[#f9f9f9] font-semibold text-[15px] text-sm leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    ) : product.short_description ? (
      <p className="text-gray-700 text-sm font-semibold">
        {product.short_description}
      </p>
    ) : (
      <p className="text-gray-400 text-sm">No description available.</p>
    )}

  </div>
);

// ── Tab entry point ────────────────────────────────────────────────────────
const TabDescription = ({ product }) => {
  console.log("Product in TabDescription:", product);
  const isPackage  = product.listing_type?.toLowerCase() === 'package';
  const components = product.components || MOCK_PACKAGE_COMPONENTS;

  return isPackage
    ? <PackageDescription components={components} description={product.description || product.short_description} />
    : <NormalDescription product={product} />;
};

export default TabDescription;
